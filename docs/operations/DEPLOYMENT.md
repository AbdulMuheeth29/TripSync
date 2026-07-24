# TripSync Deployment Guide

This guide covers deploying TripSync to production using Docker Compose.

## Prerequisites

- Docker and Docker Compose installed
- Production server with at least 2GB RAM
- Domain name configured (optional but recommended)
- SSL certificates (for HTTPS)

## Quick Start

### 1. Prepare Environment Variables

Copy the example environment file and configure it:

```bash
cp .env.example .env.production
```

Edit `.env.production` and set all required variables:

**Required:**

- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Generate with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- `POSTGRES_PASSWORD` - Strong database password
- `REDIS_PASSWORD` - Strong Redis password

**Recommended:**

- `VAPID_PUBLIC_KEY` & `VAPID_PRIVATE_KEY` - Generate with: `npx web-push generate-vapid-keys`
- `SENTRY_DSN` - Error tracking
- `REDIS_URL` - Redis connection (improves performance)

**Optional:**

- `AI_INTEGRATIONS_ANTHROPIC_API_KEY` - For AI features
- `STRIPE_SECRET_KEY` - For billing
- `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_S3_BUCKET` - For file uploads

### 2. Deploy

Run the deployment script:

```bash
./deploy.sh
```

This script will:

1. Validate environment variables
2. Backup the database (if exists)
3. Build Docker images
4. Start all services
5. Run database migrations
6. Verify service health

### 3. Access the Application

The application will be available at:

- Development: `http://localhost:3000`
- Production: `https://yourdomain.com` (if Nginx is configured)

## Docker Compose Commands

### Start Services

```bash
# Development
docker-compose up -d

# Production
docker-compose -f docker-compose.prod.yml up -d
```

### View Logs

```bash
# All services
docker-compose -f docker-compose.prod.yml logs -f

# Specific service
docker-compose -f docker-compose.prod.yml logs -f app
```

### Stop Services

```bash
docker-compose -f docker-compose.prod.yml down
```

### Restart Services

```bash
docker-compose -f docker-compose.prod.yml restart
```

### Run Migrations

```bash
docker-compose -f docker-compose.prod.yml exec app npm run db:migrate
```

### Backup Database

```bash
mkdir -p backups
docker exec tripsync-postgres-prod pg_dump -U tripsync tripsync > backups/backup-$(date +%Y%m%d).sql
```

### Restore Database

```bash
cat backups/backup-20240101.sql | docker exec -i tripsync-postgres-prod psql -U tripsync tripsync
```

## SSL/HTTPS Configuration

### Option 1: Let's Encrypt (Recommended)

1. Install Certbot:

```bash
sudo apt-get install certbot
```

2. Generate certificates:

```bash
sudo certbot certonly --standalone -d yourdomain.com
```

3. Copy certificates to project:

```bash
sudo mkdir -p ssl
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem ssl/cert.pem
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem ssl/key.pem
```

4. Enable Nginx in `docker-compose.prod.yml` and restart services

### Option 2: Self-Signed (Development Only)

```bash
mkdir -p ssl
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout ssl/key.pem -out ssl/cert.pem
```

## Monitoring

### Health Check

```bash
curl http://localhost:3000/api/health
```

### View Container Status

```bash
docker-compose -f docker-compose.prod.yml ps
```

### Resource Usage

```bash
docker stats tripsync-app-prod
```

## Troubleshooting

### Application Won't Start

1. Check logs: `docker-compose -f docker-compose.prod.yml logs app`
2. Verify environment variables: `docker-compose -f docker-compose.prod.yml config`
3. Check database connection: `docker exec tripsync-postgres-prod pg_isready`

### Database Connection Issues

```bash
# Check database is running
docker ps | grep postgres

# Check connection from app container
docker-compose -f docker-compose.prod.yml exec app ping postgres
```

### Redis Connection Issues

```bash
# Check Redis is running
docker ps | grep redis

# Test connection
docker exec tripsync-redis-prod redis-cli ping
```

### Port Already in Use

Change the port mapping in `docker-compose.prod.yml`:

```yaml
ports:
  - '8080:3000' # Change 3000 to 8080
```

## Scaling

To run multiple app instances:

```yaml
services:
  app:
    deploy:
      replicas: 3
```

Then use Nginx load balancing:

```nginx
upstream tripsync_backend {
    server app:3000;
    server app:3001;
    server app:3002;
}
```

## Security Checklist

- [ ] Strong `JWT_SECRET` (min 32 characters)
- [ ] Strong database password
- [ ] Strong Redis password
- [ ] SSL/HTTPS enabled
- [ ] Firewall configured (only ports 80/443 exposed)
- [ ] Regular database backups
- [ ] Sentry error tracking enabled
- [ ] Rate limiting configured (via Nginx)
- [ ] Environment variables not committed to git

## Hosting Providers

See `docs/DEPLOYMENT-GUIDE.md` for detailed instructions on:

- DigitalOcean
- AWS
- Railway
- Render
- Fly.io

## Support

For issues or questions:

- GitHub Issues: https://github.com/yourusername/tripsync/issues
- Documentation: `docs/` directory
