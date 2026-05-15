import { describe, it, expect, vi, beforeEach } from 'vitest';
import { captureException, captureMessage, addBreadcrumb } from '../server/sentry';

describe('Sentry Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('captureException', () => {
    it('should accept an error without context', () => {
      const error = new Error('Test error');

      // Should not throw
      expect(() => captureException(error)).not.toThrow();
    });

    it('should accept an error with context', () => {
      const error = new Error('Test error with context');
      const context = {
        user: { id: '123', email: 'test@example.com' },
        request: { method: 'POST', url: '/api/test' },
      };

      // Should not throw
      expect(() => captureException(error, context)).not.toThrow();
    });
  });

  describe('captureMessage', () => {
    it('should accept a message with default level', () => {
      // Should not throw
      expect(() => captureMessage('Test message')).not.toThrow();
    });

    it('should accept a message with error level', () => {
      // Should not throw
      expect(() => captureMessage('Error message', 'error')).not.toThrow();
    });

    it('should accept a message with warning level', () => {
      // Should not throw
      expect(() => captureMessage('Warning message', 'warning')).not.toThrow();
    });

    it('should accept a message with info level', () => {
      // Should not throw
      expect(() => captureMessage('Info message', 'info')).not.toThrow();
    });

    it('should accept a message with debug level', () => {
      // Should not throw
      expect(() => captureMessage('Debug message', 'debug')).not.toThrow();
    });
  });

  describe('addBreadcrumb', () => {
    it('should accept a breadcrumb with just a message', () => {
      // Should not throw
      expect(() => addBreadcrumb('User clicked button')).not.toThrow();
    });

    it('should accept a breadcrumb with category', () => {
      // Should not throw
      expect(() => addBreadcrumb('User action', 'ui')).not.toThrow();
    });

    it('should accept a breadcrumb with data', () => {
      const data = { buttonId: 'submit', value: 'save' };

      // Should not throw
      expect(() => addBreadcrumb('Button clicked', 'ui', data)).not.toThrow();
    });
  });

  describe('Error Filtering', () => {
    it('should handle network errors', () => {
      const error = new Error('Network request failed');

      // Should not throw even though it's in ignore list
      expect(() => captureException(error)).not.toThrow();
    });

    it('should handle authentication errors', () => {
      const error = new Error('AUTH_REQUIRED');

      // Should not throw even though it's in ignore list
      expect(() => captureException(error)).not.toThrow();
    });
  });

  describe('Sentry Configuration', () => {
    it('should be safe to call functions when Sentry is not initialized', () => {
      // All functions should be safe to call even if SENTRY_DSN is not set
      expect(() => {
        captureException(new Error('Test'));
        captureMessage('Test message');
        addBreadcrumb('Test breadcrumb');
      }).not.toThrow();
    });
  });
});
