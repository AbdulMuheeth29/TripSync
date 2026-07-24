# Database Backup & Recovery Strategy

## Overview

This document outlines the database backup strategy for Trip-Sync, including automated backup procedures, restoration processes, and disaster recovery planning.

**Database**: PostgreSQL
**Backup Method**: pg_dump (logical backups)
**Backup Frequency**: Daily automated + manual pre-deployment
**Retention**: 30 days rolling, 12 monthly snapshots

## Backup Types

### 1. Automated Daily Backups

**Schedule**: Every day at 2 AM UTC
**Method**: Full logical backup using `pg_dump`
**Storage**: Cloud storage (AWS S3, Google Cloud Storage, or similar)
**Retention**: 30 days rolling

### 2. Pre-Deployment Backups

**Trigger**: Before any database migration or major deployment
**Method**: Manual full backup
**Retention**: 90 days

### 3. Monthly Snapshots

**Schedule**: First day of each month
**Method**: Full backup with long-term retention
**Retention**: 12 months (1 year)

## Backup Script

### Manual Backup

```bash
#!/bin/bash
# scripts/backup-database.sh

set -e

# Configuration
DB_URL="${DATABASE_URL}"
BACKUP_DIR="${BACKUP_DIR:-./backups}"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="tripsync_backup_${DATE}.sql"
BACKUP_PATH="${BACKUP_DIR}/${BACKUP_FILE}"

# Create backup directory if it doesn't exist
mkdir -p "${BACKUP_DIR}"

# Extract database connection details from DATABASE_URL
# Format: postgresql://user:password@host:port/database
DB_HOST=$(echo $DB_URL | sed -n 's/.*@\(.*\):.*/\1/p')
DB_PORT=$(echo $DB_URL | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
DB_NAME=$(echo $DB_URL | sed -n 's/.*\/\(.*\)?.*/\1/p' | sed 's/?.*//g')
DB_USER=$(echo $DB_URL | sed -n 's/.*\/\/\(.*\):.*/\1/p')
DB_PASS=$(echo $DB_URL | sed -n 's/.*:\/\/.*:\(.*\)@.*/\1/p')

echo "🔄 Starting database backup..."
echo "Database: ${DB_NAME}"
echo "Host: ${DB_HOST}:${DB_PORT}"
echo "Backup file: ${BACKUP_FILE}"

# Set password for pg_dump
export PGPASSWORD="${DB_PASS}"

# Create backup using pg_dump
pg_dump -h "${DB_HOST}" \
        -p "${DB_PORT}" \
        -U "${DB_USER}" \
        -d "${DB_NAME}" \
        -F c \
        -f "${BACKUP_PATH}" \
        --verbose

# Unset password
unset PGPASSWORD

# Get backup file size
BACKUP_SIZE=$(du -h "${BACKUP_PATH}" | cut -f1)

echo "✅ Backup complete!"
echo "File: ${BACKUP_PATH}"
echo "Size: ${BACKUP_SIZE}"

# Compress backup (optional but recommended)
echo "🔄 Compressing backup..."
gzip "${BACKUP_PATH}"
COMPRESSED_PATH="${BACKUP_PATH}.gz"
COMPRESSED_SIZE=$(du -h "${COMPRESSED_PATH}" | cut -f1)

echo "✅ Compression complete!"
echo "File: ${COMPRESSED_PATH}"
echo "Size: ${COMPRESSED_SIZE}"

# Upload to cloud storage (example for AWS S3)
if [ -n "${AWS_S3_BACKUP_BUCKET}" ]; then
  echo "🔄 Uploading to S3..."
  aws s3 cp "${COMPRESSED_PATH}" "s3://${AWS_S3_BACKUP_BUCKET}/backups/${BACKUP_FILE}.gz"
  echo "✅ Upload complete!"
fi

# Cleanup old backups (keep last 30 days)
echo "🔄 Cleaning up old backups..."
find "${BACKUP_DIR}" -name "tripsync_backup_*.sql.gz" -mtime +30 -delete
echo "✅ Cleanup complete!"

echo "🎉 Backup process finished successfully!"
```

### Automated Daily Backup (Cron)

```bash
# Add to crontab (crontab -e)
# Run daily at 2 AM UTC
0 2 * * * /path/to/tripsync/scripts/backup-database.sh >> /var/log/tripsync-backup.log 2>&1
```

### Docker-based Backup

```bash
#!/bin/bash
# scripts/backup-database-docker.sh

set -e

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="tripsync_backup_${DATE}.sql.gz"

# Backup using Docker
docker exec postgres_container pg_dump -U postgres tripsync | gzip > "./backups/${BACKUP_FILE}"

echo "✅ Backup saved to ./backups/${BACKUP_FILE}"
```

## Restoration Procedures

### Full Database Restore

```bash
#!/bin/bash
# scripts/restore-database.sh

set -e

# Configuration
BACKUP_FILE=$1
DB_URL="${DATABASE_URL}"

if [ -z "$BACKUP_FILE" ]; then
  echo "Usage: ./restore-database.sh <backup_file.sql.gz>"
  exit 1
fi

if [ ! -f "$BACKUP_FILE" ]; then
  echo "Error: Backup file not found: $BACKUP_FILE"
  exit 1
fi

echo "⚠️  WARNING: This will OVERWRITE the current database!"
echo "Database: ${DB_URL}"
echo "Backup file: ${BACKUP_FILE}"
read -p "Are you sure you want to continue? (type 'yes' to confirm): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
  echo "Restore cancelled."
  exit 0
fi

# Extract database connection details
DB_HOST=$(echo $DB_URL | sed -n 's/.*@\(.*\):.*/\1/p')
DB_PORT=$(echo $DB_URL | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
DB_NAME=$(echo $DB_URL | sed -n 's/.*\/\(.*\)?.*/\1/p' | sed 's/?.*//g')
DB_USER=$(echo $DB_URL | sed -n 's/.*\/\/\(.*\):.*/\1/p')
DB_PASS=$(echo $DB_URL | sed -n 's/.*:\/\/.*:\(.*\)@.*/\1/p')

export PGPASSWORD="${DB_PASS}"

echo "🔄 Dropping existing database..."
dropdb -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" --if-exists "${DB_NAME}"

echo "🔄 Creating new database..."
createdb -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" "${DB_NAME}"

echo "🔄 Restoring from backup..."

# Decompress if needed
if [[ $BACKUP_FILE == *.gz ]]; then
  gunzip -c "${BACKUP_FILE}" | pg_restore -h "${DB_HOST}" \
                                           -p "${DB_PORT}" \
                                           -U "${DB_USER}" \
                                           -d "${DB_NAME}" \
                                           --verbose \
                                           --no-owner \
                                           --no-acl
else
  pg_restore -h "${DB_HOST}" \
             -p "${DB_PORT}" \
             -U "${DB_USER}" \
             -d "${DB_NAME}" \
             -F c \
             --verbose \
             --no-owner \
             --no-acl \
             "${BACKUP_FILE}"
fi

unset PGPASSWORD

echo "✅ Database restored successfully!"
echo "🔄 Running post-restore checks..."

# Verify restore
psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" -c "SELECT COUNT(*) FROM users;"
psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" -c "SELECT COUNT(*) FROM trips;"

echo "✅ Restore complete and verified!"
```

### Point-in-Time Recovery (PITR)

For point-in-time recovery, you need continuous WAL archiving:

```bash
# postgresql.conf settings for WAL archiving
wal_level = replica
archive_mode = on
archive_command = 'test ! -f /path/to/archive/%f && cp %p /path/to/archive/%f'
```

## Cloud Storage Setup

### AWS S3

```bash
# Install AWS CLI
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# Configure AWS credentials
aws configure
# Enter: Access Key ID, Secret Access Key, Region (us-east-1), Output format (json)

# Create backup bucket
aws s3 mb s3://tripsync-backups

# Enable versioning (optional but recommended)
aws s3api put-bucket-versioning \
  --bucket tripsync-backups \
  --versioning-configuration Status=Enabled

# Set lifecycle policy (delete after 30 days)
cat > lifecycle.json <<EOF
{
  "Rules": [{
    "Id": "DeleteOldBackups",
    "Status": "Enabled",
    "Prefix": "backups/",
    "Expiration": {
      "Days": 30
    }
  }]
}
EOF

aws s3api put-bucket-lifecycle-configuration \
  --bucket tripsync-backups \
  --lifecycle-configuration file://lifecycle.json
```

### Google Cloud Storage

```bash
# Install gcloud CLI
curl https://sdk.cloud.google.com | bash

# Authenticate
gcloud auth login

# Create backup bucket
gsutil mb gs://tripsync-backups

# Set lifecycle policy
cat > lifecycle.json <<EOF
{
  "lifecycle": {
    "rule": [{
      "action": {"type": "Delete"},
      "condition": {"age": 30}
    }]
  }
}
EOF

gsutil lifecycle set lifecycle.json gs://tripsync-backups

# Upload backup
gsutil cp backup.sql.gz gs://tripsync-backups/backups/
```

## Backup Verification

**Test restores monthly** to ensure backups are valid:

```bash
#!/bin/bash
# scripts/test-backup-restore.sh

set -e

BACKUP_FILE=$1
TEST_DB="tripsync_restore_test"

echo "🧪 Testing backup restore..."

# Create test database
createdb "${TEST_DB}"

# Restore to test database
gunzip -c "${BACKUP_FILE}" | pg_restore -d "${TEST_DB}" --no-owner --no-acl

# Run verification queries
psql -d "${TEST_DB}" -c "SELECT COUNT(*) as user_count FROM users;"
psql -d "${TEST_DB}" -c "SELECT COUNT(*) as trip_count FROM trips;"
psql -d "${TEST_DB}" -c "SELECT COUNT(*) as item_count FROM itinerary_items;"

# Cleanup test database
dropdb "${TEST_DB}"

echo "✅ Backup verification complete!"
```

## Monitoring & Alerts

### Backup Success/Failure Alerts

```bash
# Add to backup script
if [ $? -eq 0 ]; then
  # Send success notification (example with curl to webhook)
  curl -X POST https://your-monitoring-service.com/webhook \
    -H "Content-Type: application/json" \
    -d "{\"status\": \"success\", \"backup\": \"${BACKUP_FILE}\", \"size\": \"${BACKUP_SIZE}\"}"
else
  # Send failure notification
  curl -X POST https://your-monitoring-service.com/webhook \
    -H "Content-Type: application/json" \
    -d "{\"status\": \"failed\", \"backup\": \"${BACKUP_FILE}\", \"error\": \"$?\"}"
fi
```

### Backup Monitoring Script

```bash
#!/bin/bash
# scripts/check-backup-status.sh

BACKUP_DIR="./backups"
ALERT_THRESHOLD_HOURS=36  # Alert if no backup in 36 hours

LATEST_BACKUP=$(ls -t ${BACKUP_DIR}/tripsync_backup_*.sql.gz 2>/dev/null | head -1)

if [ -z "$LATEST_BACKUP" ]; then
  echo "❌ No backups found!"
  exit 1
fi

BACKUP_AGE_SECONDS=$(( $(date +%s) - $(stat -c %Y "$LATEST_BACKUP" 2>/dev/null || stat -f %m "$LATEST_BACKUP") ))
BACKUP_AGE_HOURS=$(( BACKUP_AGE_SECONDS / 3600 ))

echo "Latest backup: ${LATEST_BACKUP}"
echo "Age: ${BACKUP_AGE_HOURS} hours"

if [ $BACKUP_AGE_HOURS -gt $ALERT_THRESHOLD_HOURS ]; then
  echo "⚠️  WARNING: Backup is older than ${ALERT_THRESHOLD_HOURS} hours!"
  exit 1
else
  echo "✅ Backup is recent"
  exit 0
fi
```

## Disaster Recovery Plan

### Recovery Time Objective (RTO)

**Target**: < 1 hour from disaster to service restoration

### Recovery Point Objective (RPO)

**Target**: < 24 hours of data loss (daily backups)

### DR Procedures

1. **Database Corruption**
   - Restore from latest daily backup
   - Apply WAL files if available (PITR)
   - Expected downtime: 15-30 minutes

2. **Complete Server Loss**
   - Provision new server
   - Install PostgreSQL
   - Download latest backup from S3/GCS
   - Restore database
   - Update DNS/load balancer
   - Expected downtime: 30-60 minutes

3. **Accidental Data Deletion**
   - If recent (<1 hour): Use PITR if enabled
   - If older: Restore specific tables from backup
   - Expected downtime: 5-15 minutes

### DR Checklist

```
☐ Backups running daily (check logs)
☐ Latest backup < 24 hours old
☐ Backup verification test passed this month
☐ Cloud storage credentials valid
☐ Backup restoration tested within 90 days
☐ DR contact list up to date
☐ DNS/failover configuration documented
☐ Post-recovery verification script ready
```

## Production Deployment Checklist

Before deploying database changes:

```bash
# 1. Create pre-deployment backup
./scripts/backup-database.sh

# 2. Verify backup was created
ls -lh backups/

# 3. Run migrations in transaction
npm run db:migrate

# 4. If migration fails, restore backup
./scripts/restore-database.sh backups/tripsync_backup_YYYYMMDD_HHMMSS.sql.gz

# 5. Verify application after deployment
curl https://api.tripsync.app/health
```

## Backup Storage Recommendations

### Local Development

- **Storage**: `./backups/` directory
- **Retention**: 7 days
- **Tool**: Manual script

### Staging

- **Storage**: S3 bucket `tripsync-backups-staging`
- **Retention**: 14 days
- **Tool**: Cron job + AWS CLI

### Production

- **Storage**: S3 bucket `tripsync-backups-production`
- **Retention**: 30 days rolling + 12 monthly snapshots
- **Redundancy**: Enable cross-region replication
- **Encryption**: Enable S3 server-side encryption
- **Access**: Restrict to backup IAM role only
- **Tool**: Cron job + AWS CLI + monitoring alerts

## Post-Restore Verification

After any restore, run these checks:

```sql
-- Check database size
SELECT pg_size_pretty(pg_database_size('tripsync'));

-- Check table counts
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
  (SELECT COUNT(*) FROM information_schema.columns
   WHERE table_schema = schemaname AND table_name = tablename) AS columns
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Check recent data
SELECT COUNT(*) FROM users WHERE created_at > NOW() - INTERVAL '7 days';
SELECT COUNT(*) FROM trips WHERE created_at > NOW() - INTERVAL '7 days';

-- Verify indexes
SELECT
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
```

## Environment Variables

Add to `.env`:

```bash
# Backup Configuration
BACKUP_DIR=./backups
AWS_S3_BACKUP_BUCKET=tripsync-backups-production

# AWS Credentials (for S3 uploads)
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1
```

## Quick Reference

```bash
# Create backup
./scripts/backup-database.sh

# Restore backup
./scripts/restore-database.sh backups/tripsync_backup_20260514_020000.sql.gz

# Test backup validity
./scripts/test-backup-restore.sh backups/tripsync_backup_20260514_020000.sql.gz

# Check backup status
./scripts/check-backup-status.sh

# List backups
ls -lh backups/

# Upload to S3
aws s3 cp backups/tripsync_backup_20260514_020000.sql.gz s3://tripsync-backups/backups/

# Download from S3
aws s3 cp s3://tripsync-backups/backups/tripsync_backup_20260514_020000.sql.gz ./backups/
```

---

**Last Updated**: 2026-05-14
**Version**: 1.0
**Review Schedule**: Quarterly
