#!/bin/bash

# UptimeRobot Setup Automation Script
# Helps you set up uptime monitoring for TripSync

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  TripSync - Uptime Monitoring Setup"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${NC}"

echo ""
echo -e "${GREEN}This script will guide you through setting up uptime monitoring.${NC}"
echo ""
echo "We'll help you set up:"
echo "  ✓ UptimeRobot (free tier - 50 monitors)"
echo "  ✓ Health check monitoring"
echo "  ✓ Email/SMS/Slack alerts"
echo ""

read -p "Press Enter to continue..."

# Step 1: UptimeRobot Account
echo ""
echo -e "${YELLOW}Step 1: Create UptimeRobot Account${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1. Go to: https://uptimerobot.com"
echo "2. Click 'Sign Up Free'"
echo "3. Verify your email"
echo ""
read -p "Have you created an account? (y/n): " has_account

if [ "$has_account" != "y" ]; then
    echo ""
    echo -e "${RED}Please create an account first, then re-run this script.${NC}"
    exit 0
fi

# Step 2: Get Production URL
echo ""
echo -e "${YELLOW}Step 2: Enter Production URL${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
read -p "Enter your production URL (e.g., https://tripsync.app): " prod_url

if [ -z "$prod_url" ]; then
    echo -e "${RED}Production URL is required.${NC}"
    exit 1
fi

# Remove trailing slash
prod_url=${prod_url%/}

# Step 3: Get Alert Email
echo ""
echo -e "${YELLOW}Step 3: Alert Configuration${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
read -p "Enter email for alerts: " alert_email

if [ -z "$alert_email" ]; then
    echo -e "${RED}Alert email is required.${NC}"
    exit 1
fi

# Step 4: Manual UptimeRobot Setup Instructions
echo ""
echo -e "${GREEN}Step 4: Configure UptimeRobot Monitors${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Now, follow these steps in UptimeRobot:"
echo ""
echo -e "${BLUE}Monitor 1: API Health Check${NC}"
echo "  1. Click '+ Add New Monitor'"
echo "  2. Monitor Type: HTTP(s)"
echo "  3. Friendly Name: TripSync API Health"
echo "  4. URL: ${prod_url}/api/health"
echo "  5. Monitoring Interval: 5 minutes"
echo "  6. Monitor Timeout: 30 seconds"
echo "  7. Keyword Check: Enable"
echo "     - Keyword: \"ok\":true"
echo "     - Keyword Type: Exists"
echo "  8. Alert Contacts: Add ${alert_email}"
echo "  9. Click 'Create Monitor'"
echo ""

read -p "Press Enter when Monitor 1 is created..."

echo ""
echo -e "${BLUE}Monitor 2: Detailed Health Check${NC}"
echo "  1. Click '+ Add New Monitor'"
echo "  2. Monitor Type: HTTP(s)"
echo "  3. Friendly Name: TripSync Services Health"
echo "  4. URL: ${prod_url}/api/health?detailed=true"
echo "  5. Monitoring Interval: 5 minutes"
echo "  6. Monitor Timeout: 30 seconds"
echo "  7. Keyword Check: Enable"
echo "     - Keyword: \"database\":{\"status\":\"ok\"}"
echo "     - Keyword Type: Exists"
echo "  8. Alert Contacts: Use ${alert_email}"
echo "  9. Click 'Create Monitor'"
echo ""

read -p "Press Enter when Monitor 2 is created..."

echo ""
echo -e "${BLUE}Monitor 3: Main App${NC}"
echo "  1. Click '+ Add New Monitor'"
echo "  2. Monitor Type: HTTP(s)"
echo "  3. Friendly Name: TripSync Main App"
echo "  4. URL: ${prod_url}/"
echo "  5. Monitoring Interval: 5 minutes"
echo "  6. Monitor Timeout: 30 seconds"
echo "  7. Alert Contacts: Use ${alert_email}"
echo "  8. Click 'Create Monitor'"
echo ""

read -p "Press Enter when Monitor 3 is created..."

# Step 5: Optional Slack/Discord Integration
echo ""
echo -e "${YELLOW}Step 5: Additional Alert Channels (Optional)${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Would you like to add Slack or Discord alerts?"
echo ""
read -p "Add Slack? (y/n): " add_slack

if [ "$add_slack" = "y" ]; then
    echo ""
    echo "To add Slack alerts:"
    echo "1. In UptimeRobot, go to 'My Settings' → 'Alert Contacts'"
    echo "2. Click 'Add Alert Contact'"
    echo "3. Type: Slack"
    echo "4. Webhook URL: Get from Slack → Apps → Incoming Webhooks"
    echo "5. Save and add to your monitors"
    echo ""
    read -p "Press Enter when Slack is configured..."
fi

read -p "Add Discord? (y/n): " add_discord

if [ "$add_discord" = "y" ]; then
    echo ""
    echo "To add Discord alerts:"
    echo "1. In UptimeRobot, go to 'My Settings' → 'Alert Contacts'"
    echo "2. Click 'Add Alert Contact'"
    echo "3. Type: Webhook"
    echo "4. Webhook URL: Get from Discord → Channel Settings → Integrations → Webhooks"
    echo "   - Format Discord webhook by adding '/slack' at the end"
    echo "5. Save and add to your monitors"
    echo ""
    read -p "Press Enter when Discord is configured..."
fi

# Step 6: Test Monitoring
echo ""
echo -e "${GREEN}Step 6: Test Your Monitoring${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Let's test if monitoring works:"
echo ""
echo "Testing health endpoint..."

if command -v curl &> /dev/null; then
    response=$(curl -s "${prod_url}/api/health")
    if echo "$response" | grep -q '"ok":true'; then
        echo -e "${GREEN}✓ Health endpoint is responding correctly!${NC}"
    else
        echo -e "${YELLOW}⚠ Health endpoint returned unexpected response:${NC}"
        echo "$response"
    fi
else
    echo -e "${YELLOW}curl not found. Please manually test: ${prod_url}/api/health${NC}"
fi

echo ""
echo "In UptimeRobot dashboard, you should see:"
echo "  - All 3 monitors showing 'Up' status (green)"
echo "  - Last check times within the last 5 minutes"
echo ""

read -p "Are all monitors showing 'Up'? (y/n): " monitors_up

if [ "$monitors_up" != "y" ]; then
    echo ""
    echo -e "${YELLOW}Troubleshooting:${NC}"
    echo "  1. Check if your production app is running"
    echo "  2. Verify the URL is correct: ${prod_url}"
    echo "  3. Check if /api/health returns {\"ok\":true}"
    echo "  4. Wait a few minutes for first check to complete"
    echo ""
fi

# Step 7: Summary
echo ""
echo -e "${GREEN}✓ Monitoring Setup Complete!${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "What you've set up:"
echo "  ✓ 3 monitors checking your app every 5 minutes"
echo "  ✓ Email alerts to: ${alert_email}"
if [ "$add_slack" = "y" ]; then
    echo "  ✓ Slack notifications enabled"
fi
if [ "$add_discord" = "y" ]; then
    echo "  ✓ Discord notifications enabled"
fi
echo ""
echo "Next steps:"
echo "  1. Check UptimeRobot dashboard: https://uptimerobot.com/dashboard"
echo "  2. Verify you receive a test alert (you can pause/unpause a monitor)"
echo "  3. Add monitors for other critical endpoints if needed"
echo "  4. Consider upgrading for 1-minute checks (optional)"
echo ""
echo "UptimeRobot will now:"
echo "  • Check your app every 5 minutes"
echo "  • Send alerts when app goes down"
echo "  • Send alerts when app comes back up"
echo "  • Track uptime statistics"
echo ""
echo -e "${BLUE}Monitoring is active! You'll be notified of any issues.${NC}"
echo ""

# Create a monitoring summary file
monitoring_file="$PROJECT_ROOT/MONITORING-SUMMARY.md"
cat > "$monitoring_file" << EOF
# Monitoring Summary

**Setup Date**: $(date +"%Y-%m-%d %H:%M:%S")
**Production URL**: ${prod_url}
**Alert Email**: ${alert_email}

## UptimeRobot Monitors

### Monitor 1: API Health Check
- **URL**: ${prod_url}/api/health
- **Interval**: 5 minutes
- **Keyword**: "ok":true

### Monitor 2: Detailed Health Check
- **URL**: ${prod_url}/api/health?detailed=true
- **Interval**: 5 minutes
- **Keyword**: "database":{"status":"ok"}

### Monitor 3: Main App
- **URL**: ${prod_url}/
- **Interval**: 5 minutes

## Alert Channels
- Email: ${alert_email}
EOF

if [ "$add_slack" = "y" ]; then
    echo "- Slack: Configured" >> "$monitoring_file"
fi

if [ "$add_discord" = "y" ]; then
    echo "- Discord: Configured" >> "$monitoring_file"
fi

cat >> "$monitoring_file" << EOF

## Dashboard
https://uptimerobot.com/dashboard

## Testing
To test alerts:
1. Go to UptimeRobot dashboard
2. Click on a monitor
3. Click "Pause Monitoring"
4. Wait 5-10 minutes for down alert
5. Click "Start Monitoring"
6. Wait for up alert

## Troubleshooting
If monitors show "Down":
1. Check if app is running: ${prod_url}/api/health
2. Check server logs for errors
3. Verify DNS is resolving correctly
4. Check firewall/security group rules

## Upgrading
Free tier includes:
- 50 monitors
- 5-minute checks
- Email alerts
- 2 months of logs

Pro tier ($7/mo) includes:
- 1-minute checks
- SMS alerts
- More integrations
- 1 year of logs
EOF

echo ""
echo -e "${GREEN}Summary saved to: ${monitoring_file}${NC}"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
