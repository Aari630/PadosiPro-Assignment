import request from 'supertest';

jest.mock('../config/mailer', () => ({
  sendOtpEmail: jest.fn().mockResolvedValue(undefined),
}));

import app from '../app';
import { prisma } from '../config/db';
import { hashOtp, hashPassword } from '../utils/crypto';

const EMAIL = 'otp-rules@test.example';
const PASSWORD = 'Passw0rd!123';
const GOOD = '123456';
const BAD = '654321';

async function makeUser(verified = false) {
  return prisma.user.create({
    data: {
      email: EMAIL,
      passwordHash: await hashPassword(PASSWORD),
      isVerified: verified,
    },
  });
}

async function makeOtp(
  userId: string,
  opts: { expiresInMs?: number; lastSentAgoMs?: number; isUsed?: boolean; attemptCount?: number } = {}
) {
  const { expiresInMs = 10 * 60 * 1000, lastSentAgoMs = 60_000, isUsed = false, attemptCount = 0 } = opts;
  return prisma.emailOtp.create({
    data: {
      userId,
      codeHash: hashOtp(GOOD),
      expiresAt: new Date(Date.now() + expiresInMs),
      lastSentAt: new Date(Date.now() - lastSentAgoMs),
      isUsed,
      attemptCount,
    },
  });
}

const verify = (otp: string) => request(app).post('/api/auth/verify-otp').send({ email: EMAIL, otp });
const resend = () => request(app).post('/api/auth/resend-otp').send({ email: EMAIL });
const login = () => request(app).post('/api/auth/login').send({ email: EMAIL, password: PASSWORD });

beforeAll(() => {
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
});

beforeEach(async () => {
  const u = await prisma.user.findUnique({ where: { email: EMAIL } });
  if (u) {
    await prisma.emailOtp.deleteMany({ where: { userId: u.id } });
    await prisma.user.delete({ where: { id: u.id } });
  }
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('OTP verification rules', () => {
  it('accepts a correct OTP, verifies the user and returns a JWT', async () => {
    const user = await makeUser();
    await makeOtp(user.id);

    const res = await verify(GOOD);

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    const after = await prisma.user.findUnique({ where: { id: user.id } });
    expect(after?.isVerified).toBe(true);
  });

  it('rejects an expired OTP and leaves the user unverified', async () => {
    const user = await makeUser();
    await makeOtp(user.id, { expiresInMs: -1000 });

    const res = await verify(GOOD);

    expect(res.status).toBe(400);
    const after = await prisma.user.findUnique({ where: { id: user.id } });
    expect(after?.isVerified).toBe(false);
  });

  it('rejects a wrong OTP and increments the attempt counter', async () => {
    const user = await makeUser();
    const otp = await makeOtp(user.id);

    const res = await verify(BAD);

    expect(res.status).toBe(400);
    const after = await prisma.emailOtp.findUnique({ where: { id: otp.id } });
    expect(after?.attemptCount).toBe(1);
  });

  it('locks after 5 wrong attempts, even if the correct code is then sent', async () => {
    const user = await makeUser();
    await makeOtp(user.id);

    for (let i = 0; i < 5; i++) {
      const r = await verify(BAD);
      expect(r.status).toBe(400);
    }
    const locked = await verify(GOOD);

    expect(locked.status).toBe(429);
    const after = await prisma.user.findUnique({ where: { id: user.id } });
    expect(after?.isVerified).toBe(false);
  });

  it('is single use: the same OTP cannot be used twice', async () => {
    const user = await makeUser();
    await makeOtp(user.id);

    const first = await verify(GOOD);
    const second = await verify(GOOD);

    expect(first.status).toBe(200);
    expect(second.status).toBe(400);
  });

  it('does not accept an OTP already marked used', async () => {
    const user = await makeUser();
    await makeOtp(user.id, { isUsed: true });

    const res = await verify(GOOD);

    expect(res.status).toBe(400);
  });

  it('stores only a hash of the OTP, never the plain code', async () => {
    const user = await makeUser();
    const otp = await makeOtp(user.id);

    expect(otp.codeHash).not.toBe(GOOD);
    expect(otp.codeHash).toHaveLength(64); // SHA-256 hex
  });
});

describe('OTP resend cooldown', () => {
  it('blocks resend within 30 seconds', async () => {
    const user = await makeUser();
    await makeOtp(user.id, { lastSentAgoMs: 5_000 });

    const res = await resend();

    expect(res.status).toBe(429);
  });

  it('allows resend after the cooldown and invalidates the old OTP', async () => {
    const user = await makeUser();
    const old = await makeOtp(user.id, { lastSentAgoMs: 31_000 });

    const res = await resend();

    expect(res.status).toBe(200);
    const oldAfter = await prisma.emailOtp.findUnique({ where: { id: old.id } });
    expect(oldAfter?.isUsed).toBe(true);
    const active = await prisma.emailOtp.count({ where: { userId: user.id, isUsed: false } });
    expect(active).toBe(1);
  });
});

describe('login rules', () => {
  it('blocks login for an unverified user even with the correct password', async () => {
    await makeUser(false);

    const res = await login();

    expect(res.status).toBe(403);
    expect(res.body.token).toBeUndefined();
  });

  it('allows login for a verified user', async () => {
    await makeUser(true);

    const res = await login();

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
  });

  it('rejects a wrong password with 401', async () => {
    await makeUser(true);

    const res = await request(app).post('/api/auth/login').send({ email: EMAIL, password: 'wrong-password-1' });

    expect(res.status).toBe(401);
  });
});

describe('register rules', () => {
  const register = (password: string) =>
    request(app).post('/api/auth/register').send({ email: EMAIL, password });

  it('does not overwrite the password of an existing unverified account', async () => {
    const user = await makeUser(false);

    const res = await register('AttackerPass1!');

    expect(res.status).toBe(201);
    const after = await prisma.user.findUnique({ where: { id: user.id } });
    expect(after?.passwordHash).toBe(user.passwordHash);
  });

  it('applies the resend cooldown to re-registration of an unverified account', async () => {
    const user = await makeUser(false);
    await makeOtp(user.id, { lastSentAgoMs: 5_000 });

    const res = await register(PASSWORD);

    expect(res.status).toBe(429);
  });

  it('rejects registration for an already verified account', async () => {
    await makeUser(true);

    const res = await register(PASSWORD);

    expect(res.status).toBe(409);
  });
});