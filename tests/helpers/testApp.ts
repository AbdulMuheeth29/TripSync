import express, { type Express } from 'express';
import { createServer, type Server } from 'http';

/**
 * Create a test Express app instance
 * This is a minimal setup for testing API endpoints
 */
export function createTestApp(): { app: Express; server: Server } {
  const app = express();

  // Basic middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  const server = createServer(app);

  return { app, server };
}

/**
 * Generate Authorization header with Bearer token
 */
export function authHeader(token: string): { Authorization: string } {
  return { Authorization: `Bearer ${token}` };
}

/**
 * Extract JSON response from supertest response
 */
export function getResponseBody(response: any): any {
  return response.body;
}
