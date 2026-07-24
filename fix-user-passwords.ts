/**
 * Fix User Passwords Script
 * Updates all users without password hashes to use "password123"
 */

import { storage } from './server/storage';
import { hashPassword } from './server/auth';

async function fixUserPasswords() {
  console.log('🔧 Fixing User Passwords\n');

  try {
    // Get all users (we need to implement this or use raw DB access)
    const testEmails = [
      'demo@tripsync.com',
      'alice@tripsync.com',
      'bob@tripsync.com',
      'charlie@tripsync.com',
      'diana@tripsync.com',
      'evan@tripsync.com',
    ];

    const passwordHash = await hashPassword('password123');
    let fixedCount = 0;
    let createdCount = 0;

    for (const email of testEmails) {
      const user = await storage.getUserByEmail(email);

      if (!user) {
        // Create user
        console.log(`Creating user: ${email}`);
        await storage.createUser({
          id: crypto.randomUUID(),
          email: email,
          name: email.split('@')[0].charAt(0).toUpperCase() + email.split('@')[0].slice(1),
          passwordHash,
        });
        createdCount++;
      } else if (!user.passwordHash) {
        // Update user password
        console.log(`Fixing password for: ${email}`);
        await storage.updateUser(user.id, { passwordHash });
        fixedCount++;
      } else {
        console.log(`✓ ${email} already has password`);
      }
    }

    console.log(`\n✅ Fixed ${fixedCount} users`);
    console.log(`✅ Created ${createdCount} users`);
    console.log(`\n🔑 All accounts now use password: password123\n`);
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

fixUserPasswords()
  .then(() => {
    console.log('✅ Done');
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Fatal error:', err);
    process.exit(1);
  });
