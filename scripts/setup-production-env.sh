#!/bin/bash

# TripSync Production Environment Setup Wizard
# This script helps you configure all required environment variables for production

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

ENV_FILE=".env"

echo ""
echo "======================================"
echo "🚀 TripSync Production Setup Wizard"
echo "======================================"
echo ""
echo "This wizard will help you configure your production environment."
echo "You'll need:"
echo "  - PostgreSQL database URL"
echo "  - Email/SMTP credentials"
echo "  - (Optional) Redis, AI API keys, Stripe, etc."
echo ""

# Check if .env already exists
if [ -f "$ENV_FILE" ]; then
  echo -e "${YELLOW}⚠${NC}  Warning: $ENV_FILE already exists!"
  read -p "Do you want to overwrite it? (y/N): " overwrite
  if [[ ! $overwrite =~ ^[Yy]$ ]]; then
    echo "Exiting without changes."
    exit 0
  fi
  # Backup existing .env
  cp "$ENV_FILE" "$ENV_FILE.backup.$(date +%Y%m%d-%H%M%S)"
  echo -e "${GREEN}✓${NC} Backed up existing .env"
fi

# Start building .env file
cat > "$ENV_FILE" <<EOF
# TripSync Production Environment
# Generated: $(date)

# ============ Server Configuration ============
NODE_ENV=production
PORT=3000
HOST=0.0.0.0

EOF

echo ""
echo "======================================"
echo "📊 1. Database Configuration"
echo "======================================"
echo ""
echo "You need a PostgreSQL database. Popular options:"
echo "  - Supabase (free tier, easy setup)"
echo "  - Neon (free tier, serverless)"
echo "  - Railway (easy deployment)"
echo "  - AWS RDS (production-grade)"
echo ""

read -p "Do you have a PostgreSQL database URL? (y/N): " has_db
if [[ $has_db =~ ^[Yy]$ ]]; then
  read -p "Enter your DATABASE_URL: " database_url
  echo "DATABASE_URL=$database_url" >> "$ENV_FILE"
  echo -e "${GREEN}✓${NC} Database URL configured"
else
  echo "DATABASE_URL=postgresql://user:password@host:5432/tripsync" >> "$ENV_FILE"
  echo -e "${YELLOW}⚠${NC}  Placeholder added - YOU MUST UPDATE THIS!"
fi

echo "" >> "$ENV_FILE"
echo "# ============ Authentication ============" >> "$ENV_FILE"

echo ""
echo "======================================"
echo "🔐 2. JWT Secret (Required)"
echo "======================================"
echo ""
echo "Generating secure JWT secret..."

# Generate JWT secret
jwt_secret=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
echo "JWT_SECRET=$jwt_secret" >> "$ENV_FILE"
echo -e "${GREEN}✓${NC} JWT secret generated (64 characters)"

echo ""
echo "======================================"
echo "🔔 3. Push Notifications (Recommended)"
echo "======================================"
echo ""

read -p "Generate VAPID keys for push notifications? (Y/n): " gen_vapid
if [[ ! $gen_vapid =~ ^[Nn]$ ]]; then
  echo "Generating VAPID keys..."
  if command -v npx &> /dev/null; then
    vapid_output=$(npx web-push generate-vapid-keys)
    vapid_public=$(echo "$vapid_output" | grep "Public Key:" | cut -d' ' -f3)
    vapid_private=$(echo "$vapid_output" | grep "Private Key:" | cut -d' ' -f3)

    if [ -n "$vapid_public" ] && [ -n "$vapid_private" ]; then
      echo "VAPID_PUBLIC_KEY=$vapid_public" >> "$ENV_FILE"
      echo "VAPID_PRIVATE_KEY=$vapid_private" >> "$ENV_FILE"
      echo -e "${GREEN}✓${NC} VAPID keys generated"
    else
      echo -e "${RED}✗${NC} Failed to generate VAPID keys"
      echo "VAPID_PUBLIC_KEY=your-vapid-public-key" >> "$ENV_FILE"
      echo "VAPID_PRIVATE_KEY=your-vapid-private-key" >> "$ENV_FILE"
      echo -e "${YELLOW}⚠${NC}  Run: npx web-push generate-vapid-keys"
    fi
  else
    echo "VAPID_PUBLIC_KEY=your-vapid-public-key" >> "$ENV_FILE"
    echo "VAPID_PRIVATE_KEY=your-vapid-private-key" >> "$ENV_FILE"
    echo -e "${YELLOW}⚠${NC}  Run: npx web-push generate-vapid-keys"
  fi
else
  echo "VAPID_PUBLIC_KEY=your-vapid-public-key" >> "$ENV_FILE"
  echo "VAPID_PRIVATE_KEY=your-vapid-private-key" >> "$ENV_FILE"
  echo -e "${YELLOW}⚠${NC}  Skipped - add later for push notifications"
fi

echo "" >> "$ENV_FILE"
echo "# ============ Email Configuration (REQUIRED) ============" >> "$ENV_FILE"

echo ""
echo "======================================"
echo "📧 4. Email/SMTP Configuration"
echo "======================================"
echo ""
echo "Email is REQUIRED for:"
echo "  - Password resets"
echo "  - Trip invitations"
echo "  - User notifications"
echo ""
echo "Choose your email provider:"
echo "  1. Gmail (easy for testing)"
echo "  2. SendGrid (recommended for production)"
echo "  3. AWS SES (best for high volume)"
echo "  4. Custom SMTP"
echo "  5. Skip (configure later)"
echo ""

read -p "Enter choice (1-5): " email_choice

case $email_choice in
  1)
    echo "# Gmail SMTP" >> "$ENV_FILE"
    read -p "Enter your Gmail address: " gmail_user
    echo "SMTP_HOST=smtp.gmail.com" >> "$ENV_FILE"
    echo "SMTP_PORT=587" >> "$ENV_FILE"
    echo "SMTP_USER=$gmail_user" >> "$ENV_FILE"
    echo ""
    echo "For Gmail, you need an 'App Password':"
    echo "1. Go to: https://myaccount.google.com/apppasswords"
    echo "2. Generate a new app password"
    echo "3. Enter it below"
    echo ""
    read -p "Enter Gmail app password: " gmail_pass
    echo "SMTP_PASS=$gmail_pass" >> "$ENV_FILE"
    echo "SMTP_FROM=$gmail_user" >> "$ENV_FILE"
    echo -e "${GREEN}✓${NC} Gmail SMTP configured"
    ;;
  2)
    echo "# SendGrid SMTP" >> "$ENV_FILE"
    echo "SMTP_HOST=smtp.sendgrid.net" >> "$ENV_FILE"
    echo "SMTP_PORT=587" >> "$ENV_FILE"
    echo "SMTP_USER=apikey" >> "$ENV_FILE"
    read -p "Enter SendGrid API key: " sendgrid_key
    echo "SMTP_PASS=$sendgrid_key" >> "$ENV_FILE"
    read -p "Enter FROM email address: " from_email
    echo "SMTP_FROM=$from_email" >> "$ENV_FILE"
    echo -e "${GREEN}✓${NC} SendGrid configured"
    ;;
  3)
    echo "# AWS SES SMTP" >> "$ENV_FILE"
    read -p "Enter AWS region (e.g., us-east-1): " aws_region
    echo "SMTP_HOST=email-smtp.$aws_region.amazonaws.com" >> "$ENV_FILE"
    echo "SMTP_PORT=587" >> "$ENV_FILE"
    read -p "Enter SMTP username: " smtp_user
    echo "SMTP_USER=$smtp_user" >> "$ENV_FILE"
    read -p "Enter SMTP password: " smtp_pass
    echo "SMTP_PASS=$smtp_pass" >> "$ENV_FILE"
    read -p "Enter FROM email address: " from_email
    echo "SMTP_FROM=$from_email" >> "$ENV_FILE"
    echo -e "${GREEN}✓${NC} AWS SES configured"
    ;;
  4)
    echo "# Custom SMTP" >> "$ENV_FILE"
    read -p "Enter SMTP host: " smtp_host
    echo "SMTP_HOST=$smtp_host" >> "$ENV_FILE"
    read -p "Enter SMTP port (587): " smtp_port
    smtp_port=${smtp_port:-587}
    echo "SMTP_PORT=$smtp_port" >> "$ENV_FILE"
    read -p "Enter SMTP username: " smtp_user
    echo "SMTP_USER=$smtp_user" >> "$ENV_FILE"
    read -p "Enter SMTP password: " smtp_pass
    echo "SMTP_PASS=$smtp_pass" >> "$ENV_FILE"
    read -p "Enter FROM email address: " from_email
    echo "SMTP_FROM=$from_email" >> "$ENV_FILE"
    echo -e "${GREEN}✓${NC} Custom SMTP configured"
    ;;
  *)
    echo "SMTP_HOST=smtp.gmail.com" >> "$ENV_FILE"
    echo "SMTP_PORT=587" >> "$ENV_FILE"
    echo "SMTP_USER=your-email@gmail.com" >> "$ENV_FILE"
    echo "SMTP_PASS=your-app-password" >> "$ENV_FILE"
    echo "SMTP_FROM=noreply@tripsync.app" >> "$ENV_FILE"
    echo -e "${YELLOW}⚠${NC}  Skipped - YOU MUST CONFIGURE EMAIL!"
    ;;
esac

echo "" >> "$ENV_FILE"
echo "# ============ Admin Access ============" >> "$ENV_FILE"

echo ""
echo "======================================"
echo "👤 5. Admin Email"
echo "======================================"
echo ""

read -p "Enter admin email address: " admin_email
admin_email=${admin_email:-abdulmuheethmd29@gmail.com}
echo "ADMIN_EMAILS=$admin_email" >> "$ENV_FILE"
echo -e "${GREEN}✓${NC} Admin email configured"

echo "" >> "$ENV_FILE"
echo "# ============ Optional Services ============" >> "$ENV_FILE"

echo ""
echo "======================================"
echo "⚡ 6. Redis Cache (Optional)"
echo "======================================"
echo ""
echo "Redis improves performance and enables features like:"
echo "  - Token blacklist (logout)"
echo "  - Session management"
echo "  - API response caching"
echo ""

read -p "Do you have a Redis URL? (y/N): " has_redis
if [[ $has_redis =~ ^[Yy]$ ]]; then
  read -p "Enter REDIS_URL: " redis_url
  echo "REDIS_URL=$redis_url" >> "$ENV_FILE"
  echo -e "${GREEN}✓${NC} Redis configured"
else
  echo "# REDIS_URL=redis://localhost:6379" >> "$ENV_FILE"
  echo -e "${YELLOW}⚠${NC}  Skipped - using in-memory storage"
fi

echo ""
echo "======================================"
echo "🤖 7. AI Features (Optional)"
echo "======================================"
echo ""
echo "Anthropic Claude enables:"
echo "  - AI trip itinerary generation"
echo "  - Atlas AI travel assistant"
echo ""

read -p "Do you have an Anthropic API key? (y/N): " has_ai
if [[ $has_ai =~ ^[Yy]$ ]]; then
  read -p "Enter Anthropic API key: " ai_key
  echo "AI_INTEGRATIONS_ANTHROPIC_API_KEY=$ai_key" >> "$ENV_FILE"
  echo -e "${GREEN}✓${NC} AI features enabled"
else
  echo "# AI_INTEGRATIONS_ANTHROPIC_API_KEY=sk-ant-..." >> "$ENV_FILE"
  echo -e "${YELLOW}⚠${NC}  Skipped - AI features disabled"
fi

echo ""
echo "======================================"
echo "📁 8. File Storage (Optional)"
echo "======================================"
echo ""
echo "File storage enables:"
echo "  - Photo uploads"
echo "  - Document uploads"
echo "  - Receipt images"
echo ""
echo "Choose provider:"
echo "  1. Cloudflare R2 (recommended, cheaper)"
echo "  2. AWS S3"
echo "  3. Skip"
echo ""

read -p "Enter choice (1-3): " storage_choice

case $storage_choice in
  1)
    echo "# Cloudflare R2 Storage" >> "$ENV_FILE"
    read -p "Enter R2 Account ID: " r2_account
    echo "R2_ACCOUNT_ID=$r2_account" >> "$ENV_FILE"
    read -p "Enter R2 Access Key ID: " r2_key
    echo "R2_ACCESS_KEY_ID=$r2_key" >> "$ENV_FILE"
    read -p "Enter R2 Secret Access Key: " r2_secret
    echo "R2_SECRET_ACCESS_KEY=$r2_secret" >> "$ENV_FILE"
    read -p "Enter R2 Bucket Name: " r2_bucket
    echo "R2_BUCKET_NAME=$r2_bucket" >> "$ENV_FILE"
    echo -e "${GREEN}✓${NC} R2 storage configured"
    ;;
  2)
    echo "# AWS S3 Storage" >> "$ENV_FILE"
    read -p "Enter AWS Access Key ID: " aws_key
    echo "AWS_ACCESS_KEY_ID=$aws_key" >> "$ENV_FILE"
    read -p "Enter AWS Secret Access Key: " aws_secret
    echo "AWS_SECRET_ACCESS_KEY=$aws_secret" >> "$ENV_FILE"
    read -p "Enter S3 Bucket Name: " s3_bucket
    echo "AWS_S3_BUCKET=$s3_bucket" >> "$ENV_FILE"
    read -p "Enter AWS Region (us-east-1): " aws_region
    aws_region=${aws_region:-us-east-1}
    echo "AWS_REGION=$aws_region" >> "$ENV_FILE"
    echo -e "${GREEN}✓${NC} S3 storage configured"
    ;;
  *)
    echo "# R2_ACCOUNT_ID=your-account-id" >> "$ENV_FILE"
    echo "# R2_ACCESS_KEY_ID=..." >> "$ENV_FILE"
    echo "# R2_SECRET_ACCESS_KEY=..." >> "$ENV_FILE"
    echo "# R2_BUCKET_NAME=tripsync-uploads" >> "$ENV_FILE"
    echo -e "${YELLOW}⚠${NC}  Skipped - file uploads disabled"
    ;;
esac

echo ""
echo "======================================"
echo "📊 9. Monitoring (Optional)"
echo "======================================"
echo ""

read -p "Do you have a Sentry DSN for error tracking? (y/N): " has_sentry
if [[ $has_sentry =~ ^[Yy]$ ]]; then
  read -p "Enter Sentry DSN: " sentry_dsn
  echo "SENTRY_DSN=$sentry_dsn" >> "$ENV_FILE"
  echo -e "${GREEN}✓${NC} Sentry configured"
else
  echo "# SENTRY_DSN=https://...@sentry.io/..." >> "$ENV_FILE"
  echo -e "${YELLOW}⚠${NC}  Skipped - error tracking disabled"
fi

echo ""
echo "======================================"
echo "💳 10. Stripe Billing (Optional)"
echo "======================================"
echo ""

read -p "Do you want to enable Stripe billing? (y/N): " has_stripe
if [[ $has_stripe =~ ^[Yy]$ ]]; then
  read -p "Enter Stripe Secret Key: " stripe_key
  echo "STRIPE_SECRET_KEY=$stripe_key" >> "$ENV_FILE"
  read -p "Enter Stripe Webhook Secret: " stripe_webhook
  echo "STRIPE_WEBHOOK_SECRET=$stripe_webhook" >> "$ENV_FILE"
  echo -e "${GREEN}✓${NC} Stripe configured"
  echo -e "${YELLOW}⚠${NC}  Don't forget to add price IDs for plans!"
else
  echo "# STRIPE_SECRET_KEY=sk_live_..." >> "$ENV_FILE"
  echo "# STRIPE_WEBHOOK_SECRET=whsec_..." >> "$ENV_FILE"
  echo -e "${YELLOW}⚠${NC}  Skipped - billing disabled"
fi

echo "" >> "$ENV_FILE"
echo "# App URL (for redirects, emails, etc.)" >> "$ENV_FILE"
read -p "Enter your app URL (e.g., https://tripsync.app): " app_url
if [ -n "$app_url" ]; then
  echo "APP_URL=$app_url" >> "$ENV_FILE"
else
  echo "APP_URL=http://localhost:3000" >> "$ENV_FILE"
fi

# Summary
echo ""
echo "======================================"
echo "✅ Configuration Complete!"
echo "======================================"
echo ""
echo "Your .env file has been created with the following:"
echo ""

# Check what's configured
configured=()
needs_config=()

if grep -q "postgresql://" "$ENV_FILE" && ! grep -q "user:password" "$ENV_FILE"; then
  configured+=("✅ Database")
else
  needs_config+=("❌ Database - REQUIRED")
fi

if grep -q "JWT_SECRET=" "$ENV_FILE" && ! grep -q "your-" "$ENV_FILE" | head -1; then
  configured+=("✅ JWT Secret")
fi

if grep -q "VAPID_PUBLIC_KEY=" "$ENV_FILE" && ! grep -q "your-vapid" "$ENV_FILE"; then
  configured+=("✅ Push Notifications")
fi

if grep -q "SMTP_HOST=" "$ENV_FILE" && ! grep -q "your-email" "$ENV_FILE"; then
  configured+=("✅ Email/SMTP")
else
  needs_config+=("❌ Email/SMTP - REQUIRED")
fi

if grep -q "REDIS_URL=redis://" "$ENV_FILE"; then
  configured+=("✅ Redis Cache")
fi

if grep -q "AI_INTEGRATIONS_ANTHROPIC_API_KEY=sk-" "$ENV_FILE"; then
  configured+=("✅ AI Features")
fi

if grep -q "R2_ACCOUNT_ID=" "$ENV_FILE" && ! grep -q "your-account" "$ENV_FILE"; then
  configured+=("✅ File Storage (R2)")
elif grep -q "AWS_ACCESS_KEY_ID=" "$ENV_FILE" && ! grep -q "# AWS" "$ENV_FILE"; then
  configured+=("✅ File Storage (S3)")
fi

if grep -q "SENTRY_DSN=https://" "$ENV_FILE"; then
  configured+=("✅ Error Monitoring")
fi

if grep -q "STRIPE_SECRET_KEY=sk_" "$ENV_FILE"; then
  configured+=("✅ Stripe Billing")
fi

for item in "${configured[@]}"; do
  echo "$item"
done

if [ ${#needs_config[@]} -gt 0 ]; then
  echo ""
  echo -e "${YELLOW}⚠  Still needs configuration:${NC}"
  for item in "${needs_config[@]}"; do
    echo "$item"
  done
fi

echo ""
echo "======================================"
echo "📋 Next Steps"
echo "======================================"
echo ""
echo "1. Review and edit .env file:"
echo "   nano .env"
echo ""
echo "2. Test email configuration:"
echo "   npm run test:email"
echo ""
echo "3. Run database migrations:"
echo "   npm run db:migrate"
echo ""
echo "4. Test the application:"
echo "   npm run build && npm start"
echo ""
echo "5. Establish performance baselines:"
echo "   ./scripts/establish-baseline.sh production"
echo ""
echo "6. Deploy to production!"
echo ""

# Protect .env file
chmod 600 "$ENV_FILE"
echo -e "${GREEN}✓${NC} .env file protected (chmod 600)"
echo ""
