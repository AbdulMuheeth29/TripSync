/**
 * Email Notification Service
 * Handles sending email notifications for invites, reminders, and mentions
 */

import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

class EmailService {
  private transporter: Transporter | null = null;
  private fromEmail: string;
  private enabled: boolean = false;

  constructor() {
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = parseInt(process.env.SMTP_PORT || '587');
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    this.fromEmail = process.env.SMTP_FROM || 'noreply@tripsync.app';

    if (smtpHost && smtpUser && smtpPass) {
      this.transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465, // Use TLS if port is 465
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });
      this.enabled = true;
      console.log('✓ Email service initialized');
    } else {
      console.warn('⚠ Email service not configured. Notifications will be disabled.');
    }
  }

  /**
   * Check if email service is available
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Send an email
   */
  async sendEmail(options: EmailOptions): Promise<void> {
    if (!this.transporter) {
      console.warn('Email not sent (service not configured):', options.subject);
      return;
    }

    try {
      await this.transporter.sendMail({
        from: this.fromEmail,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      });
      console.log(`Email sent to ${options.to}: ${options.subject}`);
    } catch (error) {
      console.error('Failed to send email:', error);
      throw error;
    }
  }

  /**
   * Send trip invite email
   */
  async sendTripInvite(params: {
    toEmail: string;
    inviterName: string;
    tripDestination: string;
    tripDates: string;
    joinCode: string;
    inviteId?: string;
    baseUrl: string;
  }): Promise<void> {
    const { toEmail, inviterName, tripDestination, tripDates, joinCode, inviteId, baseUrl } =
      params;
    const joinUrl = inviteId ? `${baseUrl}/invite/${inviteId}` : `${baseUrl}/join/${joinCode}`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .details { background: white; padding: 20px; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 You're Invited to a Trip!</h1>
          </div>
          <div class="content">
            <p>Hi there!</p>
            <p><strong>${inviterName}</strong> has invited you to join a group trip to <strong>${tripDestination}</strong>!</p>

            <div class="details">
              <h3>Trip Details</h3>
              <p><strong>Destination:</strong> ${tripDestination}</p>
              <p><strong>Dates:</strong> ${tripDates}</p>
            </div>

            <p>Click the button below to view the trip details and join:</p>
            <a href="${joinUrl}" class="button">View Trip & Join</a>

            <p style="color: #6b7280; font-size: 14px;">Or copy this link: ${joinUrl}</p>

            <p>TripSync makes group trip planning easy with AI-powered itineraries, collaborative voting, expense tracking, and more!</p>
          </div>
          <div class="footer">
            <p>Sent by TripSync | <a href="${baseUrl}">Visit Website</a></p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
You're invited to a trip!

${inviterName} has invited you to join a group trip to ${tripDestination}!

Trip Details:
- Destination: ${tripDestination}
- Dates: ${tripDates}

Join the trip here: ${joinUrl}

TripSync makes group trip planning easy with AI-powered itineraries, collaborative voting, expense tracking, and more!
    `;

    await this.sendEmail({
      to: toEmail,
      subject: `🎉 You're invited to ${tripDestination}!`,
      html,
      text,
    });
  }

  /**
   * Send vote deadline reminder
   */
  async sendVoteDeadlineReminder(params: {
    toEmail: string;
    userName: string;
    tripDestination: string;
    deadline: string;
    tripUrl: string;
  }): Promise<void> {
    const { toEmail, userName, tripDestination, deadline, tripUrl } = params;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #f59e0b; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; padding: 12px 24px; background: #f59e0b; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .alert { background: #fef3c7; padding: 15px; border-left: 4px solid #f59e0b; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⏰ Vote Deadline Reminder</h1>
          </div>
          <div class="content">
            <p>Hi ${userName},</p>

            <div class="alert">
              <p><strong>The voting deadline for your ${tripDestination} trip is approaching!</strong></p>
              <p>Deadline: <strong>${deadline}</strong></p>
            </div>

            <p>Make sure to cast your votes on activities and decisions before the deadline. Your input helps the group make better decisions!</p>

            <a href="${tripUrl}" class="button">View Trip & Vote</a>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
Vote Deadline Reminder

Hi ${userName},

The voting deadline for your ${tripDestination} trip is approaching!
Deadline: ${deadline}

Make sure to cast your votes on activities and decisions before the deadline.

View trip: ${tripUrl}
    `;

    await this.sendEmail({
      to: toEmail,
      subject: `⏰ Vote deadline approaching for ${tripDestination}`,
      html,
      text,
    });
  }

  /**
   * Send mention notification (when someone @mentions you in chat)
   */
  async sendMentionNotification(params: {
    toEmail: string;
    userName: string;
    mentionedByName: string;
    tripDestination: string;
    message: string;
    tripUrl: string;
  }): Promise<void> {
    const { toEmail, userName, mentionedByName, tripDestination, message, tripUrl } = params;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #3b82f6; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; padding: 12px 24px; background: #3b82f6; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .message { background: white; padding: 20px; border-left: 4px solid #3b82f6; margin: 20px 0; font-style: italic; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>💬 You were mentioned!</h1>
          </div>
          <div class="content">
            <p>Hi ${userName},</p>
            <p><strong>${mentionedByName}</strong> mentioned you in the ${tripDestination} trip chat:</p>

            <div class="message">
              "${message}"
            </div>

            <a href="${tripUrl}" class="button">View & Reply</a>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
You were mentioned!

Hi ${userName},

${mentionedByName} mentioned you in the ${tripDestination} trip chat:

"${message}"

View and reply: ${tripUrl}
    `;

    await this.sendEmail({
      to: toEmail,
      subject: `💬 ${mentionedByName} mentioned you in ${tripDestination}`,
      html,
      text,
    });
  }

  /**
   * Send trip reminder (1 day before trip starts)
   */
  async sendTripReminder(params: {
    toEmail: string;
    userName: string;
    tripDestination: string;
    startDate: string;
    tripUrl: string;
  }): Promise<void> {
    const { toEmail, userName, tripDestination, startDate, tripUrl } = params;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; padding: 12px 24px; background: #10b981; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✈️ Your trip starts tomorrow!</h1>
          </div>
          <div class="content">
            <p>Hi ${userName},</p>
            <p>Get excited! Your trip to <strong>${tripDestination}</strong> starts tomorrow (${startDate})!</p>

            <p>Don't forget to:</p>
            <ul>
              <li>Check your itinerary and bookings</li>
              <li>Review packing list</li>
              <li>Download trip documents</li>
              <li>Check transportation details</li>
            </ul>

            <a href="${tripUrl}" class="button">View Trip Details</a>

            <p>Have an amazing trip! 🎉</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
Your trip starts tomorrow!

Hi ${userName},

Get excited! Your trip to ${tripDestination} starts tomorrow (${startDate})!

Don't forget to:
- Check your itinerary and bookings
- Review packing list
- Download trip documents
- Check transportation details

View trip details: ${tripUrl}

Have an amazing trip!
    `;

    await this.sendEmail({
      to: toEmail,
      subject: `✈️ Your ${tripDestination} trip starts tomorrow!`,
      html,
      text,
    });
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(toEmail: string, userName: string, resetUrl: string): Promise<void> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #dc2626; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; padding: 12px 24px; background: #dc2626; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .warning { background: #fee2e2; padding: 15px; border-left: 4px solid #dc2626; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔒 Password Reset Request</h1>
          </div>
          <div class="content">
            <p>Hi ${userName},</p>
            <p>We received a request to reset the password for your TripSync account.</p>

            <p>Click the button below to reset your password:</p>
            <a href="${resetUrl}" class="button">Reset Password</a>

            <p style="color: #6b7280; font-size: 14px;">Or copy this link: ${resetUrl}</p>

            <div class="warning">
              <p><strong>⚠️ Important:</strong></p>
              <ul style="margin: 10px 0;">
                <li>This link expires in 1 hour</li>
                <li>If you didn't request this, please ignore this email</li>
                <li>Your password will not change until you click the link above</li>
              </ul>
            </div>

            <p>For security reasons, we can't help you reset your password via email or phone. You must use the reset link above.</p>
          </div>
          <div class="footer">
            <p>Sent by TripSync | <a href="${process.env.APP_URL || 'http://localhost:3000'}">Visit Website</a></p>
            <p>If you have concerns about this email, contact us immediately.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
Password Reset Request

Hi ${userName},

We received a request to reset the password for your TripSync account.

Click this link to reset your password:
${resetUrl}

⚠️ Important:
- This link expires in 1 hour
- If you didn't request this, please ignore this email
- Your password will not change until you click the link above

For security reasons, we can't help you reset your password via email or phone. You must use the reset link above.
    `;

    await this.sendEmail({
      to: toEmail,
      subject: '🔒 Reset your TripSync password',
      html,
      text,
    });
  }
}

// Export singleton instance
export const emailService = new EmailService();
