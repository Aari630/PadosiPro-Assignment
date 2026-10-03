import request from 'supertest';
import app from '../app';
import { prisma } from '../config/db';
import jwt from 'jsonwebtoken';
import { sendOtpEmail } from '../config/mailer';

jest.mock('../config/mailer', () => ({
  sendOtpEmail: jest.fn().mockResolvedValue(undefined),
}));

const mockSendOtpEmail = sendOtpEmail as jest.Mock;

describe('End-to-End API Workflows', () => {
  const testEmail = 'testflow@example.com';
  const testPassword = 'SecurePassword123!';
  let testToken = '';
  let testTaskId = '';
  let testCategoryId = '';

  beforeAll(async () => {
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

    const existingTestUser = await prisma.user.findUnique({ where: { email: testEmail } });
    if (existingTestUser) {
      await prisma.user.delete({ where: { id: existingTestUser.id } });
    }

    const category = await prisma.category.create({
      data: {
        name: `Test Category ${Date.now()}`,
        slug: `test-category-${Date.now()}`,
      },
    });
    testCategoryId = category.id;

    const task = await prisma.task.create({
      data: {
        categoryId: category.id,
        name: 'Test Task',
        description: 'Task used by the API workflow tests.',
      },
    });

    testTaskId = task.id;
  });

  afterAll(async () => {
    const testUser = await prisma.user.findUnique({ where: { email: testEmail } });
    if (testUser) {
      await prisma.user.delete({ where: { id: testUser.id } });
    }

    if (testTaskId) {
      await prisma.task.delete({ where: { id: testTaskId } });
    }

    if (testCategoryId) {
      await prisma.category.delete({ where: { id: testCategoryId } });
    }

    await prisma.$disconnect();
  });

  it('rejects invalid registration payloads', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'not-an-email', password: '123' });

    expect(res.status).toBe(400);
  });

  it('protects authenticated routes without a token', async () => {
    const res = await request(app).get('/api/profile');

    expect(res.status).toBe(401);
  });

  it('completes registration, OTP verification, login, profile, and task workflows', async () => {
    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send({ email: testEmail, password: testPassword });

    expect(registerResponse.status).toBe(201);
    expect(mockSendOtpEmail).toHaveBeenCalledWith(testEmail, expect.any(String));

    const otp = mockSendOtpEmail.mock.calls.at(-1)?.[1];
    expect(otp).toMatch(/^\d{6}$/);

    const verifyResponse = await request(app)
      .post('/api/auth/verify-otp')
      .send({ email: testEmail, otp });

    expect(verifyResponse.status).toBe(200);
    expect(verifyResponse.body.token).toEqual(expect.any(String));
    expect(verifyResponse.body.user.hasProfile).toBe(false);

    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({ email: testEmail, password: testPassword });

    expect(loginResponse.status).toBe(200);
    expect(loginResponse.body.token).toEqual(expect.any(String));
    testToken = loginResponse.body.token;

    const initialProfileResponse = await request(app)
      .get('/api/profile')
      .set('Authorization', `Bearer ${testToken}`);

    expect(initialProfileResponse.status).toBe(200);
    expect(initialProfileResponse.body.profile).toBeNull();
    expect(initialProfileResponse.body.hasProfile).toBe(false);

    const profileResponse = await request(app)
      .post('/api/profile')
      .set('Authorization', `Bearer ${testToken}`)
      .send({
        fullName: 'Test User',
        mobileNumber: '9876543210',
        address: '123 Test Street',
        businessName: 'Test Business',
      });

    expect(profileResponse.status).toBe(200);
    expect(profileResponse.body.profile.fullName).toBe('Test User');

    const catalogResponse = await request(app)
      .get('/api/tasks/catalog')
      .set('Authorization', `Bearer ${testToken}`);

    expect(catalogResponse.status).toBe(200);
    expect(catalogResponse.body.categories).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: testCategoryId,
          tasks: expect.arrayContaining([
            expect.objectContaining({ id: testTaskId }),
          ]),
        }),
      ])
    );

    const selectResponse = await request(app)
      .post('/api/tasks/select')
      .set('Authorization', `Bearer ${testToken}`)
      .send({ taskIds: [testTaskId] });

    expect(selectResponse.status).toBe(200);
    expect(selectResponse.body.tasks).toHaveLength(1);
    expect(selectResponse.body.tasks[0].id).toBe(testTaskId);

    const selectedResponse = await request(app)
      .get('/api/tasks/selected')
      .set('Authorization', `Bearer ${testToken}`);

    expect(selectedResponse.status).toBe(200);
    expect(selectedResponse.body.tasks.map((task: { id: string }) => task.id)).toEqual([testTaskId]);

    const clearResponse = await request(app)
      .post('/api/tasks/select')
      .set('Authorization', `Bearer ${testToken}`)
      .send({ taskIds: [] });

    expect(clearResponse.status).toBe(200);
    expect(clearResponse.body.tasks).toEqual([]);

    const afterClearResponse = await request(app)
      .get('/api/tasks/selected')
      .set('Authorization', `Bearer ${testToken}`);

    expect(afterClearResponse.status).toBe(200);
    expect(afterClearResponse.body.tasks).toEqual([]);
  });

  it('rejects an expired JWT', async () => {
    const expiredToken = jwt.sign(
      { userId: 'expired-user', email: 'expired@example.com' },
      process.env.JWT_SECRET as string,
      { expiresIn: -1 }
    );

    const res = await request(app)
      .get('/api/profile')
      .set('Authorization', `Bearer ${expiredToken}`);

    expect(res.status).toBe(403);
    expect(res.body.message).toBe('Invalid or expired token');
  });
});