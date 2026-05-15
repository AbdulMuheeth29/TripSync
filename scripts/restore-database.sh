#!/bin/bash
# Database Restore Script for Trip-Sync
# Restores a PostgreSQL backup from a compressed or uncompressed file

set -e

# Configuration
BACKUP_FILE=$1
DB_URL="${DATABASE_URL}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check arguments
if [ -z "$BACKUP_FILE" ]; then
  echo -e "${RED}Usage: ./restore-database.sh <backup_file.sql.gz>${NC}"
  echo ""
  echo "Examples:"
  echo "  ./restore-database.sh backups/tripsync_backup_20260514_020000.sql.gz"
  echo "  ./restore-database.sh backups/tripsync_backup_20260514_020000.sql"
  exit 1
fi

if [ ! -f "$BACKUP_FILE" ]; then
  echo -e "${RED}Error: Backup file not found: $BACKUP_FILE${NC}"
  exit 1
fi

if [ -z "$DB_URL" ]; then
  echo -e "${RED}Error: DATABASE_URL environment variable is not set${NC}"
  exit 1
fi

# Extract database connection details
DB_HOST=$(echo $DB_URL | sed -n 's/.*@\(.*\):.*/\1/p')
DB_PORT=$(echo $DB_URL | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
DB_NAME=$(echo $DB_URL | sed -n 's/.*\/\(.*\)?.*/\1/p' | sed 's/?.*//g')
DB_USER=$(echo $DB_URL | sed -n 's/.*\/\/\(.*\):.*/\1/p')
DB_PASS=$(echo $DB_URL | sed -n 's/.*:\/\/.*:\(.*\)@.*/\1/p')

echo -e "${RED}⚠️  WARNING: This will OVERWRITE the current database!${NC}"
echo ""
echo "Database: ${DB_NAME}"
echo "Host: ${DB_HOST}:${DB_PORT}"
echo "User: ${DB_USER}"
echo "Backup file: ${BACKUP_FILE}"
echo ""
echo -e "${YELLOW}All existing data will be PERMANENTLY DELETED!${NC}"
echo ""
read -p "Are you sure you want to continue? (type 'yes' to confirm): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
  echo "Restore cancelled."
  exit 0
fi

export PGPASSWORD="${DB_PASS}"

echo ""
echo -e "${YELLOW}🔄 Terminating active connections...${NC}"
psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d postgres -c \
  "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '${DB_NAME}' AND pid <> pg_backend_pid();" \
  2>/dev/null || true

echo -e "${YELLOW}🔄 Dropping existing database...${NC}"
dropdb -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" --if-exists "${DB_NAME}"

echo -e "${YELLOW}🔄 Creating new database...${NC}"
createdb -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" "${DB_NAME}"

echo -e "${YELLOW}🔄 Restoring from backup...${NC}"
echo ""

# Decompress if needed and restore
if [[ $BACKUP_FILE == *.gz ]]; then
  gunzip -c "${BACKUP_FILE}" | pg_restore -h "${DB_HOST}" \
                                           -p "${DB_PORT}" \
                                           -U "${DB_USER}" \
                                           -d "${DB_NAME}" \
                                           --verbose \
                                           --no-owner \
                                           --no-acl \
                                           2>&1 | grep -v "^pg_restore: creating" | grep -v "^pg_restore: processing"
else
  pg_restore -h "${DB_HOST}" \
             -p "${DB_PORT}" \
             -U "${DB_USER}" \
             -d "${DB_NAME}" \
             -F c \
             --verbose \
             --no-owner \
             --no-acl \
             "${BACKUP_FILE}" \
             2>&1 | grep -v "^pg_restore: creating" | grep -v "^pg_restore: processing"
fi

unset PGPASSWORD

echo ""
echo -e "${GREEN}✅ Database restored successfully!${NC}"
echo ""
echo -e "${YELLOW}🔄 Running post-restore verification...${NC}"

export PGPASSWORD="${DB_PASS}"

# Verify restore
echo ""
echo "Table counts:"
psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" -c "SELECT COUNT(*) as user_count FROM users;"
psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" -c "SELECT COUNT(*) as trip_count FROM trips;"
psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" -c "SELECT COUNT(*) as item_count FROM itinerary_items;"
psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" -c "SELECT COUNT(*) as expense_count FROM expenses;"

echo ""
echo "Database size:"
psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" -c "SELECT pg_size_pretty(pg_database_size('${DB_NAME}'));"

unset PGPASSWORD

echo ""
echo -e "${GREEN}✅ Restore complete and verified!${NC}"
echo ""
echo -e "${YELLOW}⚠️  Remember to restart your application servers${NC}"

exit 0
