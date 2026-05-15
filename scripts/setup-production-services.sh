#!/bin/bash

# TripSync Production Services Setup Script
# Helps configure Redis, S3/R2, and Sentry for production

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}╔═══════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  TripSync Production Services Setup      ║${NC}"
echo -e "${GREEN}╔═══════════════════════════════════════════╗${NC}"
echo ""

# Check if .env.production exists
if [ ! -f .env.production ]; then
    echo -e "${YELLOW}Creating .env.production from template...${NC}"
    cp .env.example .env.production
    echo -e "${GREEN}✓ Created .env.production${NC}"
else
    echo -e "${BLUE}ℹ Using existing .env.production${NC}"
fi

echo ""
echo -e "${BLUE}This script will help you configure:${NC}"
echo "  1. Redis Cache"
echo "  2. Cloud Storage (S3 or R2)"
echo "  3. Sentry Error Tracking"
echo ""

# ============================================
# REDIS CONFIGURATION
# ============================================
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}1. Redis Cache Configuration${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "Redis improves performance and enables session management across multiple servers."
echo ""
echo "Choose a Redis provider:"
echo "  1. Local Redis (Development)"
echo "  2. Upstash (Recommended - Free tier, global edge network)"
echo "  3. Redis Cloud (Redis Labs)"
echo "  4. AWS ElastiCache"
echo "  5. Skip Redis setup"
echo ""
read -p "Enter your choice (1-5): " redis_choice

case $redis_choice in
    1)
        echo -e "${YELLOW}Local Redis selected${NC}"
        echo "Make sure Redis is running locally: redis-server"
        REDIS_URL="redis://localhost:6379"
        echo "REDIS_URL=$REDIS_URL" >> .env.production
        echo -e "${GREEN}✓ Added REDIS_URL to .env.production${NC}"
        ;;
    2)
        echo -e "${YELLOW}Upstash selected${NC}"
        echo ""
        echo "Steps to set up Upstash:"
        echo "  1. Go to https://upstash.com/"
        echo "  2. Sign up for free account"
        echo "  3. Click 'Create Database'"
        echo "  4. Choose region closest to your users"
        echo "  5. Copy the Redis URL (starts with rediss://)"
        echo ""
        read -p "Enter your Upstash Redis URL: " redis_url
        if [ ! -z "$redis_url" ]; then
            echo "REDIS_URL=$redis_url" >> .env.production
            echo -e "${GREEN}✓ Added REDIS_URL to .env.production${NC}"
        fi
        ;;
    3)
        echo -e "${YELLOW}Redis Cloud selected${NC}"
        echo ""
        echo "Steps to set up Redis Cloud:"
        echo "  1. Go to https://redis.com/try-free/"
        echo "  2. Sign up for free account (30MB free)"
        echo "  3. Create a new database"
        echo "  4. Copy the connection string"
        echo ""
        read -p "Enter your Redis Cloud URL: " redis_url
        if [ ! -z "$redis_url" ]; then
            echo "REDIS_URL=$redis_url" >> .env.production
            echo -e "${GREEN}✓ Added REDIS_URL to .env.production${NC}"
        fi
        ;;
    4)
        echo -e "${YELLOW}AWS ElastiCache selected${NC}"
        echo ""
        echo "Steps to set up ElastiCache:"
        echo "  1. Go to AWS Console > ElastiCache"
        echo "  2. Create Redis cluster"
        echo "  3. Note the endpoint URL"
        echo "  4. Ensure security group allows connections"
        echo ""
        read -p "Enter your ElastiCache endpoint: " redis_url
        if [ ! -z "$redis_url" ]; then
            echo "REDIS_URL=redis://$redis_url:6379" >> .env.production
            echo -e "${GREEN}✓ Added REDIS_URL to .env.production${NC}"
        fi
        ;;
    5)
        echo -e "${YELLOW}⚠ Skipping Redis setup (will use in-memory cache)${NC}"
        ;;
esac

echo ""

# ============================================
# S3/R2 CONFIGURATION
# ============================================
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}2. Cloud Storage Configuration${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "Cloud storage enables photo and document uploads."
echo ""
echo "Choose a storage provider:"
echo "  1. Cloudflare R2 (Recommended - Free 10GB, no egress fees)"
echo "  2. AWS S3"
echo "  3. Skip storage setup"
echo ""
read -p "Enter your choice (1-3): " storage_choice

case $storage_choice in
    1)
        echo -e "${YELLOW}Cloudflare R2 selected${NC}"
        echo ""
        echo "Steps to set up R2:"
        echo "  1. Go to https://dash.cloudflare.com/"
        echo "  2. Navigate to R2 Object Storage"
        echo "  3. Create a bucket (e.g., 'tripsync-uploads')"
        echo "  4. Go to 'Manage R2 API Tokens'"
        echo "  5. Create an API token with 'Object Read & Write' permissions"
        echo ""
        read -p "Enter R2 Account ID: " r2_account
        read -p "Enter R2 Access Key ID: " r2_key
        read -p "Enter R2 Secret Access Key: " r2_secret
        read -p "Enter R2 Bucket Name: " r2_bucket
        read -p "Enter R2 Public URL (optional, press enter to skip): " r2_public

        if [ ! -z "$r2_account" ]; then
            {
                echo "R2_ACCOUNT_ID=$r2_account"
                echo "R2_ACCESS_KEY_ID=$r2_key"
                echo "R2_SECRET_ACCESS_KEY=$r2_secret"
                echo "R2_BUCKET_NAME=$r2_bucket"
                [ ! -z "$r2_public" ] && echo "R2_PUBLIC_URL=$r2_public"
            } >> .env.production
            echo -e "${GREEN}✓ Added R2 configuration to .env.production${NC}"
        fi
        ;;
    2)
        echo -e "${YELLOW}AWS S3 selected${NC}"
        echo ""
        echo "Steps to set up S3:"
        echo "  1. Go to AWS Console > S3"
        echo "  2. Create a new bucket"
        echo "  3. Configure CORS (see docs/S3-CORS.json)"
        echo "  4. Go to IAM > Users > Create Access Key"
        echo "  5. Attach policy: AmazonS3FullAccess (or custom policy)"
        echo ""
        read -p "Enter AWS Access Key ID: " aws_key
        read -p "Enter AWS Secret Access Key: " aws_secret
        read -p "Enter S3 Bucket Name: " s3_bucket
        read -p "Enter AWS Region (default: us-east-1): " aws_region
        aws_region=${aws_region:-us-east-1}

        if [ ! -z "$aws_key" ]; then
            {
                echo "AWS_ACCESS_KEY_ID=$aws_key"
                echo "AWS_SECRET_ACCESS_KEY=$aws_secret"
                echo "AWS_S3_BUCKET=$s3_bucket"
                echo "AWS_REGION=$aws_region"
            } >> .env.production
            echo -e "${GREEN}✓ Added S3 configuration to .env.production${NC}"
        fi
        ;;
    3)
        echo -e "${YELLOW}⚠ Skipping storage setup (file uploads will be disabled)${NC}"
        ;;
esac

echo ""

# ============================================
# SENTRY CONFIGURATION
# ============================================
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}3. Sentry Error Tracking Configuration${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "Sentry provides error tracking and performance monitoring."
echo ""
echo "Setup Sentry?"
echo "  1. Yes (Recommended)"
echo "  2. Skip"
echo ""
read -p "Enter your choice (1-2): " sentry_choice

case $sentry_choice in
    1)
        echo -e "${YELLOW}Setting up Sentry${NC}"
        echo ""
        echo "Steps to set up Sentry:"
        echo "  1. Go to https://sentry.io/signup/"
        echo "  2. Create a free account (includes 5K errors/month)"
        echo "  3. Create a new project (select Node.js/Express)"
        echo "  4. Copy the DSN (starts with https://...@sentry.io/...)"
        echo ""
        read -p "Enter your Sentry DSN: " sentry_dsn

        if [ ! -z "$sentry_dsn" ]; then
            echo "SENTRY_DSN=$sentry_dsn" >> .env.production
            echo -e "${GREEN}✓ Added SENTRY_DSN to .env.production${NC}"
        fi
        ;;
    2)
        echo -e "${YELLOW}⚠ Skipping Sentry setup (error tracking disabled)${NC}"
        ;;
esac

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}Setup Complete!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${BLUE}Configuration saved to: .env.production${NC}"
echo ""
echo "Next steps:"
echo "  1. Review .env.production and add any missing required variables"
echo "  2. Test services with: npm run test:services"
echo "  3. Deploy with: ./deploy.sh"
echo ""
echo -e "${YELLOW}Important: Keep .env.production secure and never commit it to git!${NC}"
echo ""
