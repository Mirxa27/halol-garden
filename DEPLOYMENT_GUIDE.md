# 🚀 Complete Deployment Guide
## Medical Devices Marketplace - Production Deployment

### Table of Contents
1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Vercel Deployment](#vercel-deployment)
4. [Custom Server Deployment](#custom-server-deployment)
5. [Database Setup](#database-setup)
6. [Post-Deployment](#post-deployment)
7. [Monitoring](#monitoring)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Tools
- Node.js 18+ and npm 9+
- Git
- Vercel CLI: `npm i -g vercel`
- Docker & Docker Compose (for custom deployment)
- PostgreSQL client
- Redis client

### Required Accounts
- Vercel account (for Vercel deployment)
- PostgreSQL database (Supabase, Neon, or self-hosted)
- Redis instance (Upstash or self-hosted)
- Elasticsearch cluster (optional)
- AWS S3 or similar for file storage
- Sentry for error tracking
- Email service (SendGrid, AWS SES, etc.)

---

## Environment Setup

### 1. Clone Repository
```bash
git clone https://github.com/your-org/medical-devices-marketplace.git
cd medical-devices-marketplace
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Variables
Create `.env.production` file:

```env
# Application
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-domain.com
NEXT_PUBLIC_API_URL=https://api.your-domain.com
NEXT_PUBLIC_WS_URL=wss://ws.your-domain.com

# Database
DATABASE_URL=postgresql://user:password@host:5432/medical_devices?schema=public&sslmode=require

# Redis
REDIS_URL=redis://default:password@host:6379

# Elasticsearch (optional)
ELASTICSEARCH_URL=https://elastic:password@host:9200

# Authentication
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
SESSION_SECRET=your-super-secret-session-key-min-32-chars
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=your-nextauth-secret-key
ENCRYPTION_KEY=your-encryption-key-for-backups

# Payment Providers
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
PAYPAL_CLIENT_SECRET=...
NEXT_PUBLIC_PAYPAL_CLIENT_ID=...
MYFATOORAH_API_SECRET=...
NEXT_PUBLIC_MYFATOORAH_API_KEY=...

# Email
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=SG.xxx
SMTP_FROM=noreply@your-domain.com

# Storage
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-east-1
S3_BUCKET=medical-devices-uploads

# Monitoring
SENTRY_DSN=https://xxx@sentry.io/xxx
SENTRY_AUTH_TOKEN=...
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX

# Notifications
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
NOTIFICATION_EMAIL=admin@your-domain.com

# Cron Jobs
CRON_SECRET=your-cron-secret-key
```

---

## Vercel Deployment

### 1. Initial Setup
```bash
# Login to Vercel
vercel login

# Link project
vercel link
```

### 2. Configure Environment Variables
```bash
# Add all environment variables
vercel env add DATABASE_URL production
vercel env add REDIS_URL production
# ... add all other variables
```

### 3. Deploy to Production
```bash
# Automatic deployment
npm run deploy:production

# Or manual deployment
vercel --prod
```

### 4. Configure Domain
1. Go to Vercel Dashboard → Settings → Domains
2. Add your domain: `your-domain.com`
3. Configure DNS records as instructed

### 5. Enable Cron Jobs
Cron jobs are configured in `vercel.json`:
- Daily backup at 2 AM
- Daily cleanup at 3 AM
- Weekly reports on Monday at 8 AM
- Health checks every 5 minutes

---

## Custom Server Deployment

### 1. Build Application
```bash
# Build for production
npm run build:full

# Or use Docker
docker build -t medical-devices:latest .
```

### 2. Using Docker Compose
```bash
# Start all services
docker-compose up -d

# Check logs
docker-compose logs -f

# Scale web service
docker-compose up -d --scale web=3
```

### 3. Using PM2
```bash
# Install PM2 globally
npm install -g pm2

# Start application
pm2 start ecosystem.config.js --env production

# Save PM2 configuration
pm2 save
pm2 startup

# Monitor
pm2 monit
```

### 4. Nginx Configuration
```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com; style-src 'self' 'unsafe-inline';" always;

    # Proxy to Next.js
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket proxy
    location /ws {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Static files
    location /_next/static {
        alias /var/www/medical-devices/.next/static;
        expires 365d;
        add_header Cache-Control "public, immutable";
    }
}
```

### 5. SSL Certificate
```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Auto-renewal
sudo certbot renew --dry-run
```

---

## Database Setup

### 1. Initialize Database
```bash
# Run migrations
npm run migrate:deploy

# Seed initial data (optional)
npm run db:seed
```

### 2. Database Backup
```bash
# Manual backup
npm run db:backup

# Restore from backup
./scripts/backup-automation.sh restore database /path/to/backup.sql.gz
```

### 3. Database Optimization
```sql
-- Create indexes for performance
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_supplier ON products(supplier_id);
CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);

-- Analyze tables
ANALYZE products;
ANALYZE orders;
ANALYZE users;
```

---

## Post-Deployment

### 1. Health Check
```bash
# Check application health
curl https://your-domain.com/api/health

# Expected response:
{
  "status": "healthy",
  "services": {
    "database": { "status": "up" },
    "redis": { "status": "up" },
    "elasticsearch": { "status": "up" }
  }
}
```

### 2. Performance Testing
```bash
# Run Lighthouse audit
npm run performance:lighthouse

# Load testing with k6
k6 run tests/load-test.js

# Check bundle size
npm run analyze:bundle
```

### 3. Security Audit
```bash
# Check for vulnerabilities
npm run security:audit

# Run security headers test
curl -I https://your-domain.com | grep -E "X-Frame-Options|X-XSS-Protection|X-Content-Type-Options"
```

### 4. Configure Monitoring
1. **Sentry**: Verify error tracking at https://sentry.io
2. **Google Analytics**: Check real-time data
3. **Uptime Monitoring**: Set up with UptimeRobot or similar
4. **Log Aggregation**: Configure CloudWatch, Datadog, or similar

---

## Monitoring

### 1. Application Metrics
Access the performance dashboard at:
```
https://your-domain.com/admin/dashboard/performance
```

### 2. Log Monitoring
```bash
# PM2 logs
pm2 logs

# Docker logs
docker-compose logs -f web

# Vercel logs
vercel logs
```

### 3. Database Monitoring
```sql
-- Check active connections
SELECT count(*) FROM pg_stat_activity;

-- Check slow queries
SELECT query, mean_exec_time, calls 
FROM pg_stat_statements 
ORDER BY mean_exec_time DESC 
LIMIT 10;
```

### 4. Redis Monitoring
```bash
# Redis CLI monitoring
redis-cli monitor

# Redis info
redis-cli info stats
```

---

## Troubleshooting

### Common Issues

#### 1. Database Connection Error
```bash
# Test connection
psql $DATABASE_URL -c "SELECT 1"

# Check SSL mode
# Add ?sslmode=require to DATABASE_URL
```

#### 2. Redis Connection Error
```bash
# Test Redis connection
redis-cli -u $REDIS_URL ping
```

#### 3. Build Failures
```bash
# Clear cache and rebuild
rm -rf .next node_modules
npm install
npm run build
```

#### 4. Memory Issues
```bash
# Increase Node memory
NODE_OPTIONS="--max-old-space-size=4096" npm run build
```

#### 5. WebSocket Connection Issues
- Check CORS settings in `socket.server.ts`
- Verify WebSocket URL in environment variables
- Check firewall rules for WebSocket port

### Rollback Procedure
```bash
# Vercel rollback
npm run deploy:rollback

# PM2 rollback
pm2 reload ecosystem.config.js --update-env

# Docker rollback
docker-compose down
docker-compose up -d --force-recreate
```

---

## Maintenance Mode

### Enable Maintenance Mode
```bash
# Create maintenance page
echo "Under Maintenance" > public/maintenance.html

# Update Nginx to serve maintenance page
# Add to server block:
location / {
    if (-f $document_root/maintenance.html) {
        return 503;
    }
    # ... existing proxy config
}

error_page 503 @maintenance;
location @maintenance {
    root /var/www/medical-devices/public;
    rewrite ^.*$ /maintenance.html break;
}
```

### Disable Maintenance Mode
```bash
rm public/maintenance.html
nginx -s reload
```

---

## Performance Optimization

### 1. Enable CDN
- Configure Cloudflare or AWS CloudFront
- Set cache headers for static assets
- Enable image optimization

### 2. Database Optimization
```sql
-- Regular maintenance
VACUUM ANALYZE;
REINDEX DATABASE medical_devices;
```

### 3. Redis Optimization
```bash
# Configure maxmemory policy
redis-cli CONFIG SET maxmemory-policy allkeys-lru
redis-cli CONFIG SET maxmemory 2gb
```

---

## Security Checklist

- [ ] SSL certificate installed and auto-renewal configured
- [ ] Security headers configured
- [ ] Rate limiting enabled
- [ ] CORS properly configured
- [ ] Environment variables secured
- [ ] Database backups automated
- [ ] Monitoring and alerting configured
- [ ] DDoS protection enabled (Cloudflare)
- [ ] Regular security updates scheduled
- [ ] Incident response plan documented

---

## Support

For deployment issues:
1. Check logs: `vercel logs` or `pm2 logs`
2. Review error tracking in Sentry
3. Check system health: `/api/health`
4. Contact DevOps team: devops@your-domain.com

---

**Last Updated**: December 2024  
**Version**: 2.0.0  
**Status**: Production Ready