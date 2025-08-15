# 🚀 Medical Devices Marketplace - Vercel Deployment Guide

## Prerequisites

Before deploying to Vercel, ensure you have:

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **GitHub Account**: Your code should be in a GitHub repository
3. **Database Setup**: PostgreSQL database (we recommend [Neon](https://neon.tech) or [Supabase](https://supabase.com))
4. **Redis Instance**: Redis database (we recommend [Upstash](https://upstash.com))
5. **Email Service**: SMTP credentials (Gmail, SendGrid, or similar)
6. **Payment Accounts**: PayPal developer account (and optionally MyFatoorah)

## 📋 Step-by-Step Deployment

### Step 1: Prepare Your Database

1. **Create PostgreSQL Database**
   ```bash
   # If using Neon:
   # 1. Sign up at neon.tech
   # 2. Create a new project
   # 3. Copy the connection string
   ```

2. **Create Redis Instance**
   ```bash
   # If using Upstash:
   # 1. Sign up at upstash.com
   # 2. Create a new Redis database
   # 3. Copy the connection URL
   ```

### Step 2: Install Vercel CLI

```bash
npm i -g vercel
```

### Step 3: Initialize Vercel Project

```bash
# In your project root directory
vercel

# Follow the prompts:
# - Set up and deploy: Y
# - Which scope: Select your account
# - Link to existing project: N
# - Project name: medical-devices-marketplace
# - Directory: ./
# - Override settings: N
```

### Step 4: Configure Environment Variables

1. **Via Vercel Dashboard**:
   - Go to your project on [vercel.com](https://vercel.com)
   - Navigate to Settings → Environment Variables
   - Add the following variables:

```env
# Database
DATABASE_URL="postgresql://user:password@host:5432/dbname?sslmode=require"
REDIS_URL="redis://default:password@host:port"

# Authentication (Generate secure random strings)
JWT_SECRET="your-32-character-secret-key-here"
JWT_REFRESH_SECRET="another-32-character-secret-key"
SESSION_SECRET="yet-another-32-character-secret"
ENV_ENCRYPTION_KEY="encryption-key-for-env-vars"

# Email Configuration
EMAIL_HOST="smtp.gmail.com"
EMAIL_PORT="587"
EMAIL_USER="your-email@gmail.com"
EMAIL_PASSWORD="your-app-specific-password"
EMAIL_FROM="Medical Devices <noreply@yourdomain.com>"

# Payment - PayPal
PAYPAL_CLIENT_ID="your-paypal-client-id"
PAYPAL_CLIENT_SECRET="your-paypal-client-secret"
PAYPAL_MODE="sandbox"

# Site Configuration
SITE_NAME="Medical Devices Marketplace"
SITE_URL="https://your-domain.vercel.app"
UPLOAD_DIR="/tmp/uploads"
MAX_FILE_SIZE="10485760"

# Optional: AI Providers
OPENAI_API_KEY="sk-..."
GEMINI_API_KEY="..."

# Optional: Vercel Integration (for admin panel)
VERCEL_API_TOKEN="your-vercel-api-token"
VERCEL_PROJECT_ID="your-project-id"
```

2. **Via CLI**:
```bash
# Set environment variables via CLI
vercel env add DATABASE_URL production
# Paste your database URL when prompted

# Repeat for each variable
```

### Step 5: Deploy to Production

```bash
# Deploy to production
vercel --prod

# Or push to GitHub (if connected)
git push origin main
```

### Step 6: Run Database Migrations

After deployment, run migrations:

```bash
# Connect to your Vercel project
vercel env pull .env.production.local

# Run migrations
npx prisma migrate deploy

# Seed initial data (optional)
npx tsx prisma/seed.ts
```

### Step 7: Configure Domain (Optional)

1. Go to your Vercel project dashboard
2. Navigate to Settings → Domains
3. Add your custom domain
4. Follow DNS configuration instructions

## 🔧 Post-Deployment Setup

### 1. Access Admin Panel

1. Navigate to `https://your-domain.vercel.app/admin`
2. Use the Environment Configuration Manager
3. Complete the Initial Configuration Wizard

### 2. Test Provider Connections

In the admin panel:
1. Go to Environment Configuration
2. Test each provider connection
3. Verify all integrations are working

### 3. Create Admin User

```bash
# Run this script to create an admin user
npx tsx scripts/create-admin.ts
```

### 4. Configure Webhooks

For payment providers:
1. **PayPal**: Add webhook URL `https://your-domain.vercel.app/api/webhooks/paypal`
2. **MyFatoorah**: Add webhook URL `https://your-domain.vercel.app/api/webhooks/myfatoorah`

## 📊 Monitoring & Maintenance

### Analytics Setup

1. **Vercel Analytics**: Automatically included
2. **Google Analytics**: Add GA ID in environment variables
3. **Sentry**: Add DSN for error tracking

### Database Backups

```bash
# Create backup
pg_dump $DATABASE_URL > backup.sql

# Schedule automatic backups via cron
0 2 * * * pg_dump $DATABASE_URL > backup-$(date +\%Y\%m\%d).sql
```

### Performance Monitoring

- Monitor via Vercel Dashboard
- Set up alerts for errors
- Track API response times
- Monitor database performance

## 🐛 Troubleshooting

### Common Issues

1. **Build Failures**
   ```bash
   # Check build logs
   vercel logs

   # Clear cache and rebuild
   vercel --force
   ```

2. **Database Connection Issues**
   - Verify DATABASE_URL is correct
   - Check SSL mode settings
   - Ensure IP whitelisting if required

3. **Environment Variables Not Loading**
   ```bash
   # Pull latest env vars
   vercel env pull

   # Redeploy
   vercel --prod
   ```

4. **Prisma Issues**
   ```bash
   # Regenerate Prisma client
   npx prisma generate

   # Reset database (careful!)
   npx prisma migrate reset
   ```

## 🔄 Continuous Deployment

### GitHub Integration

1. Connect GitHub repository in Vercel dashboard
2. Enable automatic deployments
3. Configure branch deployments:
   - `main` → Production
   - `develop` → Preview
   - Pull Requests → Preview

### Deployment Workflow

```yaml
# .github/workflows/deploy.yml
name: Deploy to Vercel

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test
      - run: npm run build
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
```

## 🎯 Production Checklist

- [ ] All environment variables configured
- [ ] Database migrations completed
- [ ] Redis connection verified
- [ ] Email service tested
- [ ] Payment providers configured
- [ ] SSL certificate active
- [ ] Custom domain configured
- [ ] Admin user created
- [ ] Backup strategy in place
- [ ] Monitoring configured
- [ ] Error tracking enabled
- [ ] Rate limiting configured
- [ ] Security headers verified
- [ ] PWA manifest updated
- [ ] SEO meta tags configured
- [ ] Sitemap generated
- [ ] Robots.txt configured
- [ ] Analytics tracking enabled
- [ ] Initial data seeded
- [ ] Provider connections tested

## 📞 Support

For deployment issues:
1. Check [Vercel Documentation](https://vercel.com/docs)
2. Review [Deployment Logs](https://vercel.com/dashboard)
3. Contact support at support@yourdomain.com

## 🔐 Security Notes

1. **Never commit .env files** to version control
2. **Rotate secrets regularly** (every 90 days)
3. **Use strong passwords** for all services
4. **Enable 2FA** on Vercel account
5. **Restrict API access** with proper CORS
6. **Monitor for vulnerabilities** with npm audit
7. **Keep dependencies updated**
8. **Use environment-specific** configurations

---

**Last Updated**: December 2024
**Version**: 1.0.0