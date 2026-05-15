import { emailService } from '../server/email-service';

async function testEmail() {
  const testEmail = process.argv[2] || 'test@example.com';

  console.log('🔄 Testing email configuration...');
  console.log(`Recipient: ${testEmail}\n`);

  if (!emailService.isEnabled()) {
    console.error('❌ Email service is NOT enabled\n');
    console.error('Missing environment variables. Please configure:');
    console.error('  - SMTP_HOST (e.g., smtp.gmail.com)');
    console.error('  - SMTP_USER (e.g., your-email@gmail.com)');
    console.error('  - SMTP_PASS (e.g., your-app-password)\n');
    console.error('See docs/EMAIL-CONFIGURATION.md for setup instructions');
    process.exit(1);
  }

  console.log('✅ Email service is enabled\n');

  try {
    // Test 1: Basic email
    console.log('📧 Test 1: Sending basic email...');
    await emailService.sendEmail({
      to: testEmail,
      subject: 'TripSync Email Test',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px; }
            .content { background: #f9fafb; padding: 30px; border-radius: 8px; margin-top: 20px; }
            .success { background: #10b981; color: white; padding: 12px; border-radius: 6px; text-align: center; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✅ Email Configuration Test</h1>
            </div>
            <div class="content">
              <div class="success">
                <strong>Success!</strong> Your SMTP configuration is working correctly.
              </div>
              <p>If you're seeing this email, it means:</p>
              <ul>
                <li>SMTP credentials are valid</li>
                <li>Email service is properly configured</li>
                <li>Emails can be delivered successfully</li>
              </ul>
              <p><strong>Test details:</strong></p>
              <ul>
                <li>Sent at: ${new Date().toISOString()}</li>
                <li>Environment: ${process.env.NODE_ENV || 'development'}</li>
              </ul>
              <p>You can now safely use the email service for production.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
Email Configuration Test

Success! Your SMTP configuration is working correctly.

If you're seeing this email, it means:
- SMTP credentials are valid
- Email service is properly configured
- Emails can be delivered successfully

Test details:
- Sent at: ${new Date().toISOString()}
- Environment: ${process.env.NODE_ENV || 'development'}

You can now safely use the email service for production.
      `,
    });
    console.log('✅ Basic email sent successfully!\n');

    // Test 2: Trip invitation email
    console.log('📧 Test 2: Sending trip invitation email...');
    await emailService.sendTripInvite({
      toEmail: testEmail,
      inviterName: 'Test User',
      tripDestination: 'Tokyo, Japan',
      tripDates: 'May 15-20, 2026',
      joinCode: 'TEST123',
      baseUrl: 'http://localhost:3000',
    });
    console.log('✅ Trip invitation email sent successfully!\n');

    // Test 3: Password reset email
    console.log('📧 Test 3: Sending password reset email...');
    await emailService.sendPasswordResetEmail(
      testEmail,
      'Test User',
      'http://localhost:3000/reset-password?token=test-token-123'
    );
    console.log('✅ Password reset email sent successfully!\n');

    console.log('🎉 All email tests passed!');
    console.log(`\nCheck ${testEmail} for 3 test emails:`);
    console.log('  1. Basic configuration test');
    console.log('  2. Trip invitation');
    console.log('  3. Password reset\n');

    process.exit(0);
  } catch (error: any) {
    console.error('\n❌ Email test failed!\n');
    console.error('Error:', error.message);
    console.error('\nCommon issues:');
    console.error('  - Wrong SMTP credentials (check SMTP_USER and SMTP_PASS)');
    console.error('  - Incorrect SMTP host or port');
    console.error('  - Firewall blocking SMTP ports (587, 465, or 25)');
    console.error('  - Gmail: Need to use App Password (not your account password)');
    console.error('  - SendGrid: Make sure to use "apikey" as SMTP_USER\n');
    console.error('See docs/EMAIL-CONFIGURATION.md for troubleshooting\n');

    process.exit(1);
  }
}

testEmail();
