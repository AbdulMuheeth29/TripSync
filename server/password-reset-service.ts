import { randomBytes } from 'crypto';
import { randomUUID } from 'crypto';
import { getDb } from './db';
import { passwordResetTokens, users } from '../shared/schema';
import { eq, and, gt, lt } from 'drizzle-orm';
import { hashPassword } from './auth';
import { emailService } from './email-service';
import { appLogger } from './logger';

/**
 * Password Reset Service
 * Handles password reset token generation, validation, and password updates
 */

const TOKEN_EXPIRY_HOURS = 1; // Password reset tokens expire after 1 hour
const TOKEN_LENGTH = 32; // 32 bytes = 64 hex characters

/**
 * Generate a secure random token
 */
function generateResetToken(): string {
  return randomBytes(TOKEN_LENGTH).toString('hex');
}

/**
 * Request a password reset
 * Creates a token and sends reset email
 */
export async function requestPasswordReset(email: string): Promise<boolean> {
  try {
    const db = getDb();

    // Find user by email
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);

    // Always return true to prevent email enumeration attacks
    if (!user) {
      appLogger.warn('Password reset requested for non-existent email', {
        email: email.toLowerCase(),
      });
      return true; // Don't reveal that user doesn't exist
    }

    // Generate reset token
    const token = generateResetToken();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + TOKEN_EXPIRY_HOURS);

    // Invalidate any existing tokens for this user
    await db
      .update(passwordResetTokens)
      .set({ used: true })
      .where(and(eq(passwordResetTokens.userId, user.id), eq(passwordResetTokens.used, false)));

    // Create new reset token
    const tokenId = randomUUID();
    await db.insert(passwordResetTokens).values({
      id: tokenId,
      userId: user.id,
      token,
      expiresAt,
      used: false,
    });

    // Send reset email
    const resetUrl = `${process.env.APP_URL || 'http://localhost:3000'}/reset-password?token=${token}`;

    await emailService.sendPasswordResetEmail(user.email, user.name, resetUrl);

    appLogger.debug('Password reset requested', {
      event: 'password_reset_requested',
      userId: user.id,
      tokenId,
      expiresAt: expiresAt.toISOString(),
    });

    return true;
  } catch (error) {
    appLogger.error(error instanceof Error ? error : new Error(String(error)), {
      context: 'requestPasswordReset',
      email,
    });
    return false;
  }
}

/**
 * Validate a password reset token
 * Returns userId if valid, null if invalid/expired
 */
export async function validateResetToken(token: string): Promise<string | null> {
  try {
    const db = getDb();
    const now = new Date();

    // Find token that is not used and not expired
    const [resetToken] = await db
      .select()
      .from(passwordResetTokens)
      .where(
        and(
          eq(passwordResetTokens.token, token),
          eq(passwordResetTokens.used, false),
          gt(passwordResetTokens.expiresAt, now)
        )
      )
      .limit(1);

    if (!resetToken) {
      appLogger.warn('Invalid or expired password reset token used', {
        token: token.substring(0, 10) + '...', // Log partial token for debugging
      });
      return null;
    }

    return resetToken.userId;
  } catch (error) {
    appLogger.error(error instanceof Error ? error : new Error(String(error)), {
      context: 'validateResetToken',
    });
    return null;
  }
}

/**
 * Reset password using a valid token
 */
export async function resetPassword(token: string, newPassword: string): Promise<boolean> {
  try {
    const db = getDb();

    // Validate token
    const userId = await validateResetToken(token);
    if (!userId) {
      return false;
    }

    // Hash new password
    const passwordHash = await hashPassword(newPassword);

    // Update user password
    await db.update(users).set({ passwordHash }).where(eq(users.id, userId));

    // Mark token as used
    await db
      .update(passwordResetTokens)
      .set({ used: true })
      .where(eq(passwordResetTokens.token, token));

    appLogger.debug('Password reset completed', {
      event: 'password_reset_completed',
      userId,
      token: token.substring(0, 10) + '...', // Log partial token
    });

    return true;
  } catch (error) {
    appLogger.error(error instanceof Error ? error : new Error(String(error)), {
      context: 'resetPassword',
    });
    return false;
  }
}

/**
 * Clean up expired tokens (run periodically)
 */
export async function cleanupExpiredTokens(): Promise<number> {
  try {
    const db = getDb();
    const now = new Date();

    // Delete expired tokens
    const result = await db.delete(passwordResetTokens).where(
      and(
        eq(passwordResetTokens.used, true),
        // Delete used tokens older than 7 days or expired tokens
        lt(passwordResetTokens.expiresAt, now)
      )
    );

    const deletedCount = result.rowCount || 0;

    if (deletedCount > 0) {
      appLogger.debug('Cleaned up expired password reset tokens', {
        count: deletedCount,
      });
    }

    return deletedCount;
  } catch (error) {
    appLogger.error(error instanceof Error ? error : new Error(String(error)), {
      context: 'cleanupExpiredTokens',
    });
    return 0;
  }
}
