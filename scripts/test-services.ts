/**
 * Test Production Services
 * Validates Redis, S3/R2, and Sentry configurations
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load production environment
config({ path: resolve(process.cwd(), '.env.production') });

async function testRedis() {
  console.log('\n🔍 Testing Redis Connection...');

  const redisUrl = process.env.REDIS_URL;

  if (!redisUrl) {
    console.log('⚠️  REDIS_URL not configured - will use in-memory cache');
    return false;
  }

  try {
    const Redis = (await import('ioredis')).default;
    const client = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      connectTimeout: 5000,
    });

    // Test connection
    await client.ping();
    console.log('✅ Redis: Connected successfully');

    // Test write
    await client.set('test:connection', 'ok', 'EX', 10);
    const value = await client.get('test:connection');

    if (value === 'ok') {
      console.log('✅ Redis: Read/Write working');
    }

    // Get info
    const info = await client.info('server');
    const version = info.match(/redis_version:(\S+)/)?.[1];
    console.log(`ℹ️  Redis version: ${version}`);

    await client.quit();
    return true;
  } catch (error) {
    console.error('❌ Redis: Connection failed');
    console.error('   Error:', error instanceof Error ? error.message : String(error));
    return false;
  }
}

async function testS3() {
  console.log('\n🔍 Testing S3/R2 Storage...');

  const hasS3 =
    process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY && process.env.AWS_S3_BUCKET;

  const hasR2 =
    process.env.R2_ACCOUNT_ID &&
    process.env.R2_ACCESS_KEY_ID &&
    process.env.R2_SECRET_ACCESS_KEY &&
    process.env.R2_BUCKET_NAME;

  if (!hasS3 && !hasR2) {
    console.log('⚠️  No cloud storage configured - file uploads disabled');
    return false;
  }

  try {
    const { S3Client, ListBucketsCommand, PutObjectCommand, DeleteObjectCommand } =
      await import('@aws-sdk/client-s3');

    const accountId = process.env.R2_ACCOUNT_ID;
    const accessKeyId = process.env.R2_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY;
    const region = process.env.AWS_REGION || 'auto';
    const bucket = process.env.R2_BUCKET_NAME || process.env.AWS_S3_BUCKET;

    const endpoint = accountId ? `https://${accountId}.r2.cloudflarestorage.com` : undefined;

    const client = new S3Client({
      region,
      endpoint,
      credentials: {
        accessKeyId: accessKeyId!,
        secretAccessKey: secretAccessKey!,
      },
    });

    const storageType = hasR2 ? 'R2' : 'S3';
    console.log(`ℹ️  Testing ${storageType} with bucket: ${bucket}`);

    // Test write
    const testKey = `test-connection-${Date.now()}.txt`;
    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: testKey,
        Body: 'Connection test',
        ContentType: 'text/plain',
      })
    );
    console.log(`✅ ${storageType}: Upload working`);

    // Test delete
    await client.send(
      new DeleteObjectCommand({
        Bucket: bucket,
        Key: testKey,
      })
    );
    console.log(`✅ ${storageType}: Delete working`);

    return true;
  } catch (error) {
    console.error('❌ Storage: Connection failed');
    console.error('   Error:', error instanceof Error ? error.message : String(error));
    console.error('   Check your credentials and bucket name');
    return false;
  }
}

async function testSentry() {
  console.log('\n🔍 Testing Sentry Configuration...');

  const sentryDsn = process.env.SENTRY_DSN;

  if (!sentryDsn) {
    console.log('⚠️  SENTRY_DSN not configured - error tracking disabled');
    return false;
  }

  try {
    const Sentry = await import('@sentry/node');

    // Validate DSN format
    if (!sentryDsn.startsWith('https://') || !sentryDsn.includes('@sentry.io')) {
      console.error('❌ Sentry: Invalid DSN format');
      console.error('   DSN should start with https:// and contain @sentry.io');
      return false;
    }

    // Initialize Sentry
    Sentry.init({
      dsn: sentryDsn,
      environment: 'test',
      tracesSampleRate: 0.0, // Don't send test traces
    });

    console.log('✅ Sentry: Configuration valid');
    console.log('ℹ️  Sentry DSN:', sentryDsn.substring(0, 30) + '...');

    // Test capturing (won't actually send in test mode)
    console.log('ℹ️  Note: Test events are not sent to Sentry');

    return true;
  } catch (error) {
    console.error('❌ Sentry: Configuration failed');
    console.error('   Error:', error instanceof Error ? error.message : String(error));
    return false;
  }
}

async function testDatabase() {
  console.log('\n🔍 Testing Database Connection...');

  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error('❌ DATABASE_URL not configured');
    return false;
  }

  try {
    // Validate URL format
    new URL(databaseUrl);

    const { drizzle } = await import('drizzle-orm/node-postgres');
    const { Pool } = await import('pg');

    const pool = new Pool({
      connectionString: databaseUrl,
      max: 1,
      connectionTimeoutMillis: 5000,
    });

    const db = drizzle(pool);

    // Test query
    const result = await pool.query('SELECT NOW() as time, version() as version');
    console.log('✅ Database: Connected successfully');
    console.log('ℹ️  PostgreSQL version:', result.rows[0].version.split(' ')[1]);

    await pool.end();
    return true;
  } catch (error) {
    console.error('❌ Database: Connection failed');
    console.error('   Error:', error instanceof Error ? error.message : String(error));
    return false;
  }
}

async function testSMTP() {
  console.log('\n🔍 Testing SMTP Configuration...');

  const smtpHost = process.env.SMTP_HOST;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  if (!smtpHost || !smtpUser || !smtpPass) {
    console.log('⚠️  SMTP not configured - email features disabled');
    return false;
  }

  try {
    const nodemailer = await import('nodemailer');
    const smtpPort = parseInt(process.env.SMTP_PORT || '587');

    const transporter = nodemailer.default.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    // Verify connection
    await transporter.verify();
    console.log('✅ SMTP: Connection successful');
    console.log(`ℹ️  SMTP Host: ${smtpHost}:${smtpPort}`);
    console.log(`ℹ️  SMTP User: ${smtpUser}`);

    return true;
  } catch (error) {
    console.error('❌ SMTP: Connection failed');
    console.error('   Error:', error instanceof Error ? error.message : String(error));
    return false;
  }
}

async function main() {
  console.log('╔═══════════════════════════════════════════╗');
  console.log('║  TripSync Service Configuration Test     ║');
  console.log('╚═══════════════════════════════════════════╝');

  const results = {
    database: await testDatabase(),
    redis: await testRedis(),
    storage: await testS3(),
    sentry: await testSentry(),
    smtp: await testSMTP(),
  };

  console.log('\n' + '='.repeat(50));
  console.log('📊 Test Results Summary');
  console.log('='.repeat(50));

  const passed = Object.values(results).filter(Boolean).length;
  const total = Object.keys(results).length;

  console.log(
    `\n✅ Database:      ${results.database ? 'PASS' : 'FAIL'} ${!results.database ? '(REQUIRED)' : ''}`
  );
  console.log(
    `${results.redis ? '✅' : '⚠️ '} Redis:         ${results.redis ? 'PASS' : 'NOT CONFIGURED (optional)'}`
  );
  console.log(
    `${results.storage ? '✅' : '⚠️ '} Cloud Storage: ${results.storage ? 'PASS' : 'NOT CONFIGURED (optional)'}`
  );
  console.log(
    `${results.sentry ? '✅' : '⚠️ '} Sentry:        ${results.sentry ? 'PASS' : 'NOT CONFIGURED (optional)'}`
  );
  console.log(
    `${results.smtp ? '✅' : '⚠️ '} SMTP:          ${results.smtp ? 'PASS' : 'NOT CONFIGURED (recommended)'}`
  );

  console.log(`\n📈 Status: ${passed}/${total} services configured`);

  if (!results.database) {
    console.log('\n❌ CRITICAL: Database is required for production');
    process.exit(1);
  }

  if (!results.smtp) {
    console.log('\n⚠️  WARNING: SMTP not configured');
    console.log('   - Password reset will not work');
    console.log('   - Trip invitations will not work');
  }

  if (!results.redis) {
    console.log('\n⚠️  WARNING: Redis not configured');
    console.log('   - Will use in-memory cache (not recommended for production)');
    console.log('   - Cannot scale horizontally');
  }

  if (!results.storage) {
    console.log('\n⚠️  WARNING: Cloud storage not configured');
    console.log('   - Photo uploads disabled');
    console.log('   - Document uploads disabled');
  }

  if (!results.sentry) {
    console.log('\n⚠️  INFO: Sentry not configured');
    console.log('   - Error tracking disabled');
  }

  const criticalPassed = results.database;
  const recommendedPassed = results.database && results.smtp && results.redis && results.storage;

  if (criticalPassed && recommendedPassed && results.sentry) {
    console.log('\n🎉 All services configured correctly! Ready for production.');
  } else if (criticalPassed && recommendedPassed) {
    console.log('\n✅ Core services configured. Consider adding Sentry for error tracking.');
  } else if (criticalPassed) {
    console.log(
      '\n✅ Minimum requirements met. Consider adding optional services for better experience.'
    );
  }

  console.log('');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
