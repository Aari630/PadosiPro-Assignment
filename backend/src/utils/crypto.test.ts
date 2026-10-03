import { generateOtp, hashOtp, hashPassword, verifyPassword } from './crypto';

describe('Security Logic', () => {
  test('generateOtp creates 6 digits', () => {
    expect(generateOtp()).toMatch(/^\d{6}$/);
  });

  test('hashOtp creates consistent SHA-256 hash', () => {
    const hash = hashOtp('123456');
    expect(hashOtp('123456')).toBe(hash);
    expect(hash).toHaveLength(64); 
  });

  test('Passwords hash securely', async () => {
    const password = 'SecurePassword123!';
    const hash = await hashPassword(password);
    expect(hash).not.toBe(password);
    expect(await verifyPassword(password, hash)).toBe(true);
    expect(await verifyPassword('wrong', hash)).toBe(false);
  });
});