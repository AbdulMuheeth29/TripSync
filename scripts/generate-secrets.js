#!/usr/bin/env node
/**
 * Generate secrets for deployment (per DEPLOYMENT-GUIDE.md).
 * Usage: node scripts/generate-secrets.js
 * Or: npm run generate-secrets
 */
import crypto from 'node:crypto';

console.log('JWT Secret (add to .env as JWT_SECRET):');
console.log(crypto.randomBytes(32).toString('hex'));
console.log('');
console.log('VAPID Keys (Web Push): run the following, then add to .env:');
console.log('  npx web-push generate-vapid-keys');
console.log('');
console.log('Add the generated keys as VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY in .env');
