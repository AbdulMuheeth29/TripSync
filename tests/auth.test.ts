import { describe, it, expect, beforeEach } from 'vitest';
import {
  hashPassword,
  comparePassword,
  generateToken,
  verifyToken,
  type JWTPayload,
} from '../server/auth';

describe('Authentication', () => {
  describe('Password Hashing', () => {
    it('should hash a password', async () => {
      const password = 'testPassword123';
      const hash = await hashPassword(password);

      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(0);
    });

    it('should generate different hashes for the same password', async () => {
      const password = 'testPassword123';
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);

      expect(hash1).not.toBe(hash2);
    });

    it('should verify correct password', async () => {
      const password = 'testPassword123';
      const hash = await hashPassword(password);
      const isValid = await comparePassword(password, hash);

      expect(isValid).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const password = 'testPassword123';
      const wrongPassword = 'wrongPassword456';
      const hash = await hashPassword(password);
      const isValid = await comparePassword(wrongPassword, hash);

      expect(isValid).toBe(false);
    });
  });

  describe('JWT Token Management', () => {
    const mockPayload: JWTPayload = {
      userId: 'test-user-123',
      email: 'test@example.com',
    };

    it('should generate a valid JWT token', () => {
      const token = generateToken(mockPayload);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });

    it('should verify and decode a valid token', () => {
      const token = generateToken(mockPayload);
      const decoded = verifyToken(token);

      expect(decoded).toBeDefined();
      expect(decoded?.userId).toBe(mockPayload.userId);
      expect(decoded?.email).toBe(mockPayload.email);
    });

    it('should reject an invalid token', () => {
      const invalidToken = 'invalid.token.string';
      const decoded = verifyToken(invalidToken);

      expect(decoded).toBeNull();
    });

    it('should reject a malformed token', () => {
      const malformedToken = 'not-a-jwt';
      const decoded = verifyToken(malformedToken);

      expect(decoded).toBeNull();
    });

    it('should reject an empty token', () => {
      const decoded = verifyToken('');

      expect(decoded).toBeNull();
    });

    it('should include standard JWT claims', () => {
      const token = generateToken(mockPayload);
      const decoded = verifyToken(token) as any;

      expect(decoded).toBeDefined();
      expect(decoded.iat).toBeDefined(); // issued at
      expect(decoded.exp).toBeDefined(); // expiration
    });
  });

  describe('Token Expiration', () => {
    it('should set expiration time correctly', () => {
      const mockPayload: JWTPayload = {
        userId: 'test-user-123',
        email: 'test@example.com',
      };

      const token = generateToken(mockPayload);
      const decoded = verifyToken(token) as any;

      expect(decoded).toBeDefined();

      const iat = decoded.iat;
      const exp = decoded.exp;
      const expectedDuration = 7 * 24 * 60 * 60; // 7 days in seconds

      expect(exp - iat).toBe(expectedDuration);
    });
  });
});
