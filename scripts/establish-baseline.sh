#!/bin/bash

# TripSync Performance Baseline Establishment Script
# Run this before production launch to capture baseline metrics
# Usage: ./scripts/establish-baseline.sh [environment]
# Example: ./scripts/establish-baseline.sh production

set -e

ENVIRONMENT=${1:-development}
BASE_URL=${2:-http://localhost:3000}
OUTPUT_FILE="baselines-${ENVIRONMENT}-$(date +%Y%m%d-%H%M%S).json"

echo "======================================"
echo "📊 TripSync Performance Baseline Test"
echo "======================================"
echo ""
echo "Environment: $ENVIRONMENT"
echo "Base URL: $BASE_URL"
echo "Output: $OUTPUT_FILE"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to measure endpoint response time
measure_endpoint() {
  local endpoint=$1
  local method=${2:-GET}
  local iterations=${3:-10}

  echo -e "${YELLOW}Testing:${NC} $method $endpoint"

  local total=0
  local min=999999
  local max=0
  local failed=0

  for i in $(seq 1 $iterations); do
    if [ "$method" = "GET" ]; then
      response_time=$(curl -o /dev/null -s -w '%{time_total}' "$BASE_URL$endpoint" 2>/dev/null || echo "error")
    else
      response_time=$(curl -X $method -o /dev/null -s -w '%{time_total}' "$BASE_URL$endpoint" 2>/dev/null || echo "error")
    fi

    if [ "$response_time" = "error" ]; then
      failed=$((failed + 1))
      continue
    fi

    # Convert to milliseconds
    response_ms=$(echo "$response_time * 1000" | bc)
    total=$(echo "$total + $response_ms" | bc)

    # Track min/max
    if (( $(echo "$response_ms < $min" | bc -l) )); then
      min=$response_ms
    fi
    if (( $(echo "$response_ms > $max" | bc -l) )); then
      max=$response_ms
    fi

    # Show progress
    printf "."
  done

  echo ""

  local success=$((iterations - failed))
  if [ $success -gt 0 ]; then
    local avg=$(echo "scale=2; $total / $success" | bc)
    echo -e "${GREEN}✓${NC} Average: ${avg}ms | Min: ${min}ms | Max: ${max}ms | Success: $success/$iterations"

    # Return average for JSON output
    echo "$avg"
  else
    echo -e "${RED}✗${NC} All requests failed"
    echo "0"
  fi
}

# Function to test database performance
test_database() {
  echo ""
  echo -e "${YELLOW}🗄️  Testing Database Performance...${NC}"

  if [ "$ENVIRONMENT" = "production" ]; then
    CONTAINER="tripsync-postgres-prod"
  elif [ "$ENVIRONMENT" = "staging" ]; then
    CONTAINER="tripsync-postgres-staging"
  else
    CONTAINER="tripsync-postgres-1"
  fi

  # Check if container exists
  if ! docker ps --format '{{.Names}}' | grep -q "$CONTAINER"; then
    echo -e "${RED}✗${NC} Database container not found: $CONTAINER"
    echo "0"
    return
  fi

  # Test simple query
  echo "Testing simple SELECT..."
  local query_time=$(docker exec $CONTAINER psql -U tripsync -t -c "\timing on" -c "SELECT 1;" 2>&1 | grep "Time:" | awk '{print $2}' || echo "0")
  echo -e "${GREEN}✓${NC} Query time: ${query_time}"

  # Test table count
  echo "Testing table count..."
  docker exec $CONTAINER psql -U tripsync -t -c "SELECT COUNT(*) FROM users;" 2>&1 | head -1 || echo "0"

  echo "$query_time"
}

# Function to test Redis performance
test_redis() {
  echo ""
  echo -e "${YELLOW}⚡ Testing Redis Performance...${NC}"

  if [ "$ENVIRONMENT" = "production" ]; then
    CONTAINER="tripsync-redis-prod"
  elif [ "$ENVIRONMENT" = "staging" ]; then
    CONTAINER="tripsync-redis-staging"
  else
    CONTAINER="tripsync-redis-1"
  fi

  # Check if container exists
  if ! docker ps --format '{{.Names}}' | grep -q "$CONTAINER"; then
    echo -e "${YELLOW}⚠${NC}  Redis container not found: $CONTAINER (optional service)"
    echo "0"
    return
  fi

  # Test PING
  echo "Testing PING..."
  local ping_result=$(docker exec $CONTAINER redis-cli PING 2>&1 || echo "ERROR")
  if [ "$ping_result" = "PONG" ]; then
    echo -e "${GREEN}✓${NC} Redis responding"
  else
    echo -e "${RED}✗${NC} Redis not responding"
  fi

  # Test SET/GET performance
  echo "Testing SET/GET operations..."
  docker exec $CONTAINER redis-cli SET test_key "test_value" > /dev/null 2>&1
  docker exec $CONTAINER redis-cli GET test_key > /dev/null 2>&1
  docker exec $CONTAINER redis-cli DEL test_key > /dev/null 2>&1
  echo -e "${GREEN}✓${NC} Redis operations successful"

  echo "1"
}

# Start baseline tests
echo "======================================"
echo "🚀 Starting Baseline Tests..."
echo "======================================"
echo ""

# Wait for service to be ready
echo "Checking if service is available..."
if ! curl -s "$BASE_URL/api/health" > /dev/null; then
  echo -e "${RED}✗${NC} Service not available at $BASE_URL"
  echo "Please ensure the application is running"
  exit 1
fi
echo -e "${GREEN}✓${NC} Service is available"
echo ""

# Test API endpoints
echo "======================================"
echo "🌐 API Endpoint Performance"
echo "======================================"

api_health=$(measure_endpoint "/api/health" "GET" 20)
api_health_detailed=$(measure_endpoint "/api/health?detailed=true" "GET" 10)

echo ""
echo "Note: Authentication required endpoints can't be tested without credentials"
echo "You'll need to manually test authenticated endpoints after launch"

# Test database
db_query_time=$(test_database)

# Test Redis
redis_available=$(test_redis)

# Check resource usage
echo ""
echo "======================================"
echo "💻 Resource Usage"
echo "======================================"

if [ "$ENVIRONMENT" = "production" ]; then
  APP_CONTAINER="tripsync-app-prod"
  DB_CONTAINER="tripsync-postgres-prod"
  REDIS_CONTAINER="tripsync-redis-prod"
elif [ "$ENVIRONMENT" = "staging" ]; then
  APP_CONTAINER="tripsync-app-staging"
  DB_CONTAINER="tripsync-postgres-staging"
  REDIS_CONTAINER="tripsync-redis-staging"
else
  APP_CONTAINER="tripsync-app-1"
  DB_CONTAINER="tripsync-postgres-1"
  REDIS_CONTAINER="tripsync-redis-1"
fi

# Get memory usage
if docker ps --format '{{.Names}}' | grep -q "$APP_CONTAINER"; then
  app_mem=$(docker stats $APP_CONTAINER --no-stream --format "{{.MemUsage}}" 2>/dev/null | awk '{print $1}' || echo "N/A")
  echo "App Memory: $app_mem"
else
  app_mem="N/A"
  echo "App Memory: N/A (container not running)"
fi

if docker ps --format '{{.Names}}' | grep -q "$DB_CONTAINER"; then
  db_mem=$(docker stats $DB_CONTAINER --no-stream --format "{{.MemUsage}}" 2>/dev/null | awk '{print $1}' || echo "N/A")
  echo "Database Memory: $db_mem"
else
  db_mem="N/A"
  echo "Database Memory: N/A (container not running)"
fi

# Disk usage
echo ""
echo "Disk Usage:"
df -h / | tail -1

# Generate JSON output
echo ""
echo "======================================"
echo "💾 Saving Baselines..."
echo "======================================"

cat > "$OUTPUT_FILE" <<EOF
{
  "environment": "$ENVIRONMENT",
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "base_url": "$BASE_URL",
  "api_response_times_ms": {
    "health": $api_health,
    "health_detailed": $api_health_detailed,
    "note": "Authenticated endpoints require manual testing"
  },
  "database": {
    "query_time_ms": $db_query_time,
    "status": "$([ "$db_query_time" != "0" ] && echo "ok" || echo "unavailable")"
  },
  "redis": {
    "status": "$([ "$redis_available" != "0" ] && echo "ok" || echo "unavailable")"
  },
  "resources": {
    "app_memory": "$app_mem",
    "database_memory": "$db_mem"
  },
  "targets": {
    "api_health_ms": 50,
    "api_health_detailed_ms": 100,
    "api_trips_ms": 200,
    "db_query_ms": 10,
    "error_rate_percent": 0.1
  },
  "thresholds": {
    "warning": {
      "api_response_ms": 500,
      "db_query_ms": 100,
      "error_rate_percent": 1
    },
    "critical": {
      "api_response_ms": 1000,
      "db_query_ms": 500,
      "error_rate_percent": 5
    }
  }
}
EOF

echo -e "${GREEN}✓${NC} Baselines saved to: $OUTPUT_FILE"

# Display summary
echo ""
echo "======================================"
echo "📋 Summary"
echo "======================================"
echo ""
cat "$OUTPUT_FILE"

echo ""
echo "======================================"
echo "✅ Baseline Test Complete!"
echo "======================================"
echo ""
echo "Next steps:"
echo "1. Review the baseline metrics above"
echo "2. Keep this file for comparison after launch"
echo "3. Monitor production metrics against these baselines"
echo "4. Alert if metrics exceed warning thresholds"
echo ""
echo "To run again: ./scripts/establish-baseline.sh $ENVIRONMENT $BASE_URL"
echo ""
