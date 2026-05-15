#!/bin/bash
# Database Backup Script for Trip-Sync
# Creates a full PostgreSQL backup with compression and optional S3 upload

set -e

# Configuration
DB_URL="${DATABASE_URL}"
BACKUP_DIR="${BACKUP_DIR:-./backups}"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="tripsync_backup_${DATE}.sql"
BACKUP_PATH="${BACKUP_DIR}/${BACKUP_FILE}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Create backup directory if it doesn't exist
mkdir -p "${BACKUP_DIR}"

# Check if DATABASE_URL is set
if [ -z "$DB_URL" ]; then
  echo -e "${RED}Error: DATABASE_URL environment variable is not set${NC}"
  exit 1
fi

# Extract database connection details from DATABASE_URL
# Format: postgresql://user:password@host:port/database
DB_HOST=$(echo $DB_URL | sed -n 's/.*@\(.*\):.*/\1/p')
DB_PORT=$(echo $DB_URL | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
DB_NAME=$(echo $DB_URL | sed -n 's/.*\/\(.*\)?.*/\1/p' | sed 's/?.*//g')
DB_USER=$(echo $DB_URL | sed -n 's/.*\/\/\(.*\):.*/\1/p')
DB_PASS=$(echo $DB_URL | sed -n 's/.*:\/\/.*:\(.*\)@.*/\1/p')

echo -e "${YELLOW}🔄 Starting database backup...${NC}"
echo "Database: ${DB_NAME}"
echo "Host: ${DB_HOST}:${DB_PORT}"
echo "User: ${DB_USER}"
echo "Backup file: ${BACKUP_FILE}"
echo ""

# Set password for pg_dump
export PGPASSWORD="${DB_PASS}"

# Create backup using pg_dump with custom format (allows parallel restore)
pg_dump -h "${DB_HOST}" \
        -p "${DB_PORT}" \
        -U "${DB_USER}" \
        -d "${DB_NAME}" \
        -F c \
        -f "${BACKUP_PATH}" \
        --verbose 2>&1 | grep -v "^pg_dump: reading"

# Unset password
unset PGPASSWORD

# Check if backup was successful
if [ ! -f "${BACKUP_PATH}" ]; then
  echo -e "${RED}❌ Backup failed: file not created${NC}"
  exit 1
fi

# Get backup file size
BACKUP_SIZE=$(du -h "${BACKUP_PATH}" | cut -f1)

echo ""
echo -e "${GREEN}✅ Backup complete!${NC}"
echo "File: ${BACKUP_PATH}"
echo "Size: ${BACKUP_SIZE}"
echo ""

# Compress backup (optional but recommended)
echo -e "${YELLOW}🔄 Compressing backup...${NC}"
gzip "${BACKUP_PATH}"
COMPRESSED_PATH="${BACKUP_PATH}.gz"
COMPRESSED_SIZE=$(du -h "${COMPRESSED_PATH}" | cut -f1)

echo -e "${GREEN}✅ Compression complete!${NC}"
echo "File: ${COMPRESSED_PATH}"
echo "Size: ${COMPRESSED_SIZE}"
echo ""

# Upload to cloud storage (example for AWS S3)
if [ -n "${AWS_S3_BACKUP_BUCKET}" ]; then
  echo -e "${YELLOW}🔄 Uploading to S3...${NC}"

  if command -v aws &> /dev/null; then
    aws s3 cp "${COMPRESSED_PATH}" "s3://${AWS_S3_BACKUP_BUCKET}/backups/${BACKUP_FILE}.gz" \
      --storage-class STANDARD_IA \
      --metadata "created=$(date -u +%Y-%m-%dT%H:%M:%SZ),database=${DB_NAME},host=${DB_HOST}"

    echo -e "${GREEN}✅ Upload complete!${NC}"
    echo "S3 URI: s3://${AWS_S3_BACKUP_BUCKET}/backups/${BACKUP_FILE}.gz"
    echo ""
  else
    echo -e "${YELLOW}⚠️  AWS CLI not found, skipping S3 upload${NC}"
  fi
fi

# Cleanup old local backups (keep last 30 days)
echo -e "${YELLOW}🔄 Cleaning up old backups (older than 30 days)...${NC}"
DELETED_COUNT=$(find "${BACKUP_DIR}" -name "tripsync_backup_*.sql.gz" -mtime +30 -delete -print | wc -l | tr -d ' ')
echo -e "${GREEN}✅ Deleted ${DELETED_COUNT} old backup(s)${NC}"
echo ""

# List recent backups
echo "Recent backups:"
ls -lh "${BACKUP_DIR}" | tail -5

echo ""
echo -e "${GREEN}🎉 Backup process finished successfully!${NC}"
echo "Backup file: ${COMPRESSED_PATH}"
echo "Size: ${COMPRESSED_SIZE}"

# Return success
exit 0
