import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import express, { type Express } from 'express';
import { randomUUID } from 'crypto';
import { hashPassword, comparePassword, generateToken, requireAuth } from '../../server/auth';

describe('Auth API Integration', () => {
  let app: Express;

  beforeAll(() => {
    // Create a minimal Express app for testing
    app = express();
    app.use(express.json());

    // Mock register endpoint
    app.post('/api/auth/register', async (req, res) => {
      try {
        const { email, name, password } = req.body;

        if (!email || !name || !password) {
          return res.status(400).json({
            error: 'Email, name, and password are required',
            code: 'VALIDATION_ERROR',
          });
        }

        if (password.length < 8) {
          return res.status(400).json({
            error: 'Password must be at least 8 characters',
            code: 'WEAK_PASSWORD',
          });
        }

        const passwordHash = await hashPassword(password);
        const userId = randomUUID();
        const token = generateToken({ userId, email: email.toLowerCase() });

        res.status(201).json({
          token,
          user: {
            id: userId,
            email: email.toLowerCase(),
            name,
            createdAt: new Date().toISOString(),
          },
        });
      } catch (error) {
        res.status(500).json({ error: 'Registration failed' });
      }
    });

    // Mock login endpoint
    app.post('/api/auth/login', async (req, res) => {
      try {
        const { email, password } = req.body;

        if (!email || !password) {
          return res.status(400).json({
            error: 'Email and password are required',
            code: 'VALIDATION_ERROR',
          });
        }

        // For testing, accept any credentials with password 'password123'
        if (password === 'password123') {
          const userId = randomUUID();
          const token = generateToken({ userId, email: email.toLowerCase() });

          res.json({
            token,
            user: {
              id: userId,
              email: email.toLowerCase(),
              name: 'Test User',
              createdAt: new Date().toISOString(),
            },
          });
        } else {
          res.status(401).json({
            error: 'Invalid credentials',
            code: 'INVALID_CREDENTIALS',
          });
        }
      } catch (error) {
        res.status(500).json({ error: 'Login failed' });
      }
    });

    // Protected endpoint for testing auth middleware
    app.get('/api/protected', requireAuth, (req, res) => {
      res.json({
        message: 'Access granted',
        userId: (req as any).userId,
        email: (req as any).userEmail,
      });
    });
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'newuser@example.com',
          name: 'New User',
          password: 'securePassword123',
        })
        .expect(201);

      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe('newuser@example.com');
      expect(response.body.user.name).toBe('New User');
      expect(response.body.user).not.toHaveProperty('passwordHash');
    });

    it('should reject registration with missing email', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          password: 'password123',
        })
        .expect(400);

      expect(response.body.code).toBe('VALIDATION_ERROR');
      expect(response.body.error).toContain('required');
    });

    it('should reject registration with missing name', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'password123',
        })
        .expect(400);

      expect(response.body.code).toBe('VALIDATION_ERROR');
    });

    it('should reject registration with missing password', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          name: 'Test User',
        })
        .expect(400);

      expect(response.body.code).toBe('VALIDATION_ERROR');
    });

    it('should reject registration with weak password', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          name: 'Test User',
          password: 'weak',
        })
        .expect(400);

      expect(response.body.code).toBe('WEAK_PASSWORD');
      expect(response.body.error).toContain('8 characters');
    });

    it('should normalize email to lowercase', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'Test@EXAMPLE.COM',
          name: 'Test User',
          password: 'password123',
        })
        .expect(201);

      expect(response.body.user.email).toBe('test@example.com');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
        })
        .expect(200);

      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe('test@example.com');
    });

    it('should reject login with invalid password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword',
        })
        .expect(401);

      expect(response.body.code).toBe('INVALID_CREDENTIALS');
    });

    it('should reject login with missing email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          password: 'password123',
        })
        .expect(400);

      expect(response.body.code).toBe('VALIDATION_ERROR');
    });

    it('should reject login with missing password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
        })
        .expect(400);

      expect(response.body.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('Authentication Middleware', () => {
    it('should allow access with valid token', async () => {
      const token = generateToken({
        userId: 'test-user-123',
        email: 'test@example.com',
      });

      const response = await request(app)
        .get('/api/protected')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.message).toBe('Access granted');
      expect(response.body.userId).toBe('test-user-123');
      expect(response.body.email).toBe('test@example.com');
    });

    it('should reject access without token', async () => {
      const response = await request(app)
        .get('/api/protected')
        .expect(401);

      expect(response.body.code).toBe('AUTH_REQUIRED');
    });

    it('should reject access with invalid token', async () => {
      const response = await request(app)
        .get('/api/protected')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.code).toBe('INVALID_TOKEN');
    });

    it('should reject access with malformed authorization header', async () => {
      const response = await request(app)
        .get('/api/protected')
        .set('Authorization', 'NotBearer token')
        .expect(401);

      expect(response.body.code).toBe('AUTH_REQUIRED');
    });
  });
});
