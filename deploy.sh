#!/bin/bash

# TripSync Deployment Script
# This script handles deployment to production using Docker Compose

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== TripSync Deployment Script ===${NC}"

# Check if .env.production exists
if [ ! -f .env.production ]; then
    echo -e "${RED}Error: .env.production file not found${NC}"
    echo "Please create .env.production with your production environment variables"
    echo "See .env.example for reference"
    exit 1
fi

# Load production environment variables
set -a
source .env.production
set +a

# Validate required environment variables
REQUIRED_VARS=("DATABASE_URL" "JWT_SECRET" "REDIS_PASSWORD" "POSTGRES_PASSWORD")
MISSING_VARS=()

for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        MISSING_VARS+=("$var")
    fi
done

if [ ${#MISSING_VARS[@]} -ne 0 ]; then
    echo -e "${RED}Error: Missing required environment variables:${NC}"
    for var in "${MISSING_VARS[@]}"; do
        echo "  - $var"
    done
    exit 1
fi

echo -e "${GREEN}✓ Environment variables validated${NC}"

# Backup database (if running)
if docker ps | grep -q tripsync-postgres-prod; then
    echo -e "${YELLOW}Creating database backup...${NC}"
    BACKUP_FILE="backups/backup-$(date +%Y%m%d-%H%M%S).sql"
    mkdir -p backups
    docker exec tripsync-postgres-prod pg_dump -U ${POSTGRES_USER:-tripsync} ${POSTGRES_DB:-tripsync} > "$BACKUP_FILE"
    echo -e "${GREEN}✓ Backup saved to $BACKUP_FILE${NC}"
fi

# Pull latest code (if in git repository)
if [ -d .git ]; then
    echo -e "${YELLOW}Pulling latest code...${NC}"
    git pull
    echo -e "${GREEN}✓ Code updated${NC}"
fi

# Build and deploy with Docker Compose
echo -e "${YELLOW}Building Docker images...${NC}"
docker-compose -f docker-compose.prod.yml build --no-cache

echo -e "${YELLOW}Stopping existing containers...${NC}"
docker-compose -f docker-compose.prod.yml down

echo -e "${YELLOW}Starting services...${NC}"
docker-compose -f docker-compose.prod.yml up -d

# Wait for services to be healthy
echo -e "${YELLOW}Waiting for services to be healthy...${NC}"
sleep 10

# Run database migrations
echo -e "${YELLOW}Running database migrations...${NC}"
docker-compose -f docker-compose.prod.yml exec -T app npm run db:migrate
echo -e "${GREEN}✓ Migrations completed${NC}"

# Check service health
echo -e "${YELLOW}Checking service health...${NC}"
for i in {1..30}; do
    if curl -f http://localhost:${APP_PORT:-3000}/api/health > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Application is healthy and running${NC}"
        break
    fi
    if [ $i -eq 30 ]; then
        echo -e "${RED}Error: Application failed to start${NC}"
        docker-compose -f docker-compose.prod.yml logs --tail=50 app
        exit 1
    fi
    sleep 2
done

# Display running containers
echo -e "${GREEN}=== Deployment Complete ===${NC}"
docker-compose -f docker-compose.prod.yml ps

echo -e "${GREEN}Application is running at http://localhost:${APP_PORT:-3000}${NC}"
echo -e "${YELLOW}View logs: docker-compose -f docker-compose.prod.yml logs -f${NC}"
echo -e "${YELLOW}Stop services: docker-compose -f docker-compose.prod.yml down${NC}"
