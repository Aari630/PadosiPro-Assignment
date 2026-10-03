import request from 'supertest';
import app from '../app';
import { prisma } from '../config/db';

// Mock the mailer so tests don't require Mailpit or Docker to be running
jest.mock('../config/mailer', () => ({
  sendOtpEmail: jest.fn().mockResolvedValue(undefined)
}));

describe('End-to-End API Workflows', () => {
  beforeAll(async () => {
    // Clear test database before running
    await prisma.emailOtp.deleteMany();
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  const testEmail = 'test@example.com';

  it('Rejects invalid registration payloads', async () => {
    const res = await request(app).post('/api/auth/register').send({ email: 'not-an-email', password: '123' });
    expect(res.status).toBe(400);
  });

  it('Successfully registers a user', async () => {
    const res = await request(app).post('/api/auth/register').send({ email: testEmail, password: 'SecurePassword123!' });
    expect(res.status).toBe(201);
  });

  it('Protects authenticated routes without token', async () => {
    const res = await request(app).get('/api/profile');
    expect(res.status).toBe(401);
  });
});