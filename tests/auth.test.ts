import { describe, it, expect, beforeEach } from 'vitest';
import { verifyPassword, generateSessionToken, isValidSessionToken } from '../src/lib/auth';

describe('Authentication Layer', () => {
  const secret = 'test-secret';
  const correctPassword = 'havaianas';

  it('should verify correct password', () => {
    expect(verifyPassword('havaianas', correctPassword)).toBe(true);
    expect(verifyPassword('  HAVAIANAS  ', correctPassword)).toBe(true);
    expect(verifyPassword('wrong', correctPassword)).toBe(false);
  });

  it('should generate and validate secure session tokens', () => {
    const token = generateSessionToken(secret);
    expect(typeof token).toBe('string');
    expect(isValidSessionToken(token, secret)).toBe(true);
    expect(isValidSessionToken('invalid.token', secret)).toBe(false);
  });
});
