/**
 * Quick Login Test Script
 * Tests login functionality and creates demo users
 */

import { storage } from "./server/storage";
import { hashPassword, comparePassword } from "./server/auth";

async function testLogin() {
  console.log("🧪 Testing Login Functionality\n");

  try {
    // Check if any users exist
    const testEmails = [
      "alice@tripsync.com",
      "bob@tripsync.com",
      "charlie@tripsync.com",
      "demo@tripsync.com"
    ];

    console.log("1. Checking existing users...");
    for (const email of testEmails) {
      const user = await storage.getUserByEmail(email);
      if (user) {
        console.log(`   ✅ Found user: ${email}`);

        // Test password verification
        if (user.passwordHash) {
          const isValid = await comparePassword("password123", user.passwordHash);
          console.log(`      Password test: ${isValid ? '✅ VALID' : '❌ INVALID'}`);
        } else {
          console.log(`      ⚠️  No password hash stored`);
        }
      } else {
        console.log(`   ❌ Not found: ${email}`);
      }
    }

    console.log("\n2. Creating demo user if needed...");
    let demoUser = await storage.getUserByEmail("demo@tripsync.com");

    if (!demoUser) {
      const passwordHash = await hashPassword("password123");
      demoUser = await storage.createUser({
        id: crypto.randomUUID(),
        email: "demo@tripsync.com",
        name: "Demo User",
        passwordHash,
      });
      console.log("   ✅ Created demo@tripsync.com");
    } else {
      console.log("   ✅ demo@tripsync.com already exists");
    }

    // Verify demo user password
    if (demoUser && demoUser.passwordHash) {
      const isValid = await comparePassword("password123", demoUser.passwordHash);
      console.log(`   Password verification: ${isValid ? '✅ SUCCESS' : '❌ FAILED'}`);
    }

    console.log("\n3. Summary:");
    console.log("   ✅ Login: demo@tripsync.com");
    console.log("   ✅ Password: password123");
    console.log("\n   To create test users, run: npx tsx server/seed-test-data.ts\n");

  } catch (error) {
    console.error("❌ Error:", error);
    console.error("\n⚠️  Make sure:");
    console.error("   1. PostgreSQL is running");
    console.error("   2. DATABASE_URL is set in .env");
    console.error("   3. Database 'tripsync' exists\n");
  }
}

testLogin().then(() => {
  console.log("✅ Test complete");
  process.exit(0);
}).catch((err) => {
  console.error("❌ Fatal error:", err);
  process.exit(1);
});
