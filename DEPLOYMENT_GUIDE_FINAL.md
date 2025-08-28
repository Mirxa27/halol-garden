# 🚀 Medical Devices Marketplace - Production Deployment Guide

## Overview
This guide provides complete instructions for deploying the Medical Devices Marketplace to production using Vercel with all necessary services.

## Prerequisites
- Vercel Account
- Database (PostgreSQL) - Supabase, Railway, or Neon recommended
- Redis instance - Upstash or Railway
- Email service - Gmail SMTP or SendGrid
- Payment gateways accounts (Stripe, MyFatoorah)

## 1. Database Setup

### Option A: Supabase (Recommended)
1. Create a new project at [supabase.com](https://supabase.com)
2. Get your connection string from Settings > Database
3. Format: `postgresql://[user]:[password]@[host]:[port]/[database]?schema=public`

### Option B: Railway
1. Create account at [railway.app](https://railway.app)
2. Create new PostgreSQL database
3. Copy connection string from Connect tab

### Option C: Neon
1. Create account at [neon.tech](https://neon.tech)
2. Create new database
3. Copy connection string

## 2. Redis Setup

### Upstash Redis
1. Create account at [upstash.com](https://upstash.com)
2. Create new Redis database
3. Copy connection string

## 3. Environment Variables Setup

Create these environment variables in your Vercel project:

### Core Application
```bash
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
NEXT_PUBLIC_API_URL=https://your-domain.vercel.app/api
NEXT_PUBLIC_SITE_NAME=Medical Devices Marketplace
NEXT_PUBLIC_SUPPORT_EMAIL=support@your-domain.com
```

### Database
```bash
DATABASE_URL=postgresql://user:password@host:port/database?schema=public
DIRECT_URL=postgresql://user:password@host:port/database?schema=public
```

### Redis
```bash
REDIS_URL=redis://default:password@host:port
```

### Authentication
```bash
JWT_SECRET=your-super-secret-jwt-key-min-32-chars-long-production
SESSION_SECRET=your-session-secret-key-min-32-chars-long-production
NEXTAUTH_URL=https://your-domain.vercel.app
NEXTAUTH_SECRET=your-nextauth-secret-key-min-32-chars-long-production
ENCRYPTION_KEY=your-encryption-key-32-chars-long-production
```

### Payment Gateways

#### Stripe
```bash
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_publishable_key
STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_stripe_webhook_secret
```

#### PayPal
```bash
NEXT_PUBLIC_PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_client_secret
```

#### MyFatoorah
```bash
NEXT_PUBLIC_MYFATOORAH_API_KEY=your_myfatoorah_api_key
MYFATOORAH_API_SECRET=your_myfatoorah_api_secret
MYFATOORAH_COUNTRY_ISO=KWT
```

### Email Configuration
```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-specific-password
SMTP_FROM=Medical Devices Marketplace <noreply@your-domain.com>
EMAIL_FROM=Medical Devices Marketplace <noreply@your-domain.com>
```

### File Storage (Cloudinary)
```bash
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

### Optional Services

#### Google Maps
```bash
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

#### OpenAI
```bash
OPENAI_API_KEY=sk-your_openai_api_key
OPENAI_ORG_ID=org-your_openai_org_id
```

#### Monitoring
```bash
NEXT_PUBLIC_SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
SENTRY_AUTH_TOKEN=your_sentry_auth_token
```

### Super Admin Configuration
```bash
SUPER_ADMIN_EMAIL=admin@your-domain.com
SUPER_ADMIN_PASSWORD=YourSecureAdminPassword123!
SUPER_ADMIN_FIRST_NAME=Super
SUPER_ADMIN_LAST_NAME=Administrator
```

## 4. Deployment Steps

### Step 1: Deploy to Vercel
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod
```

### Step 2: Database Migration
After deployment, run database migrations:

```bash
# Generate Prisma client
npx prisma generate

# Deploy migrations
npx prisma migrate deploy

# Seed database (creates super admin and sample data)
npx prisma db seed
```

### Step 3: Initialize System Settings
1. Access admin panel: `https://your-domain.vercel.app/admin`
2. Login with super admin credentials
3. Go to Settings and click "Initialize Defaults"
4. Configure payment gateways and email templates

## 5. Domain Configuration

### Custom Domain Setup
1. In Vercel dashboard, go to your project
2. Click "Domains" tab
3. Add your custom domain
4. Configure DNS records as instructed

### SSL Certificate
Vercel automatically provides SSL certificates for all domains.

## 6. Post-Deployment Configuration

### Payment Gateway Configuration

#### Stripe Webhooks
1. In Stripe dashboard, go to Webhooks
2. Add endpoint: `https://your-domain.vercel.app/api/webhooks/stripe`
3. Select events: `payment_intent.succeeded`, `payment_intent.payment_failed`
4. Copy webhook secret to environment variables

#### MyFatoorah Callbacks
Configure callback URLs in MyFatoorah dashboard:
- Success URL: `https://your-domain.vercel.app/payment/success`
- Error URL: `https://your-domain.vercel.app/payment/error`

### Email Template Customization
1. Access admin panel
2. Go to Email Templates
3. Customize templates with your branding

## 7. Performance Optimization

### Caching Strategy
- Static files: Cached at edge locations
- API responses: Redis caching implemented
- Database queries: Connection pooling enabled

### CDN Configuration
Vercel automatically provides global CDN for static assets.

### Image Optimization
- Next.js Image component used throughout
- Cloudinary for dynamic image processing

## 8. Monitoring & Analytics

### Error Tracking
- Sentry configured for error monitoring
- Detailed error logging in production

### Performance Monitoring
- Vercel Analytics enabled
- Real User Monitoring (RUM) available

### Uptime Monitoring
- Health check endpoint: `/api/health`
- Automated cron jobs for system maintenance

## 9. Security Measures

### Implemented Security Features
- ✅ HTTPS enforcement
- ✅ CSP headers configured
- ✅ XSS protection
- ✅ CSRF protection ready
- ✅ Rate limiting implemented
- ✅ Input validation and sanitization
- ✅ Password hashing (bcrypt)
- ✅ JWT token authentication
- ✅ SQL injection prevention

### Additional Security Setup
1. Configure firewall rules if needed
2. Set up DDoS protection
3. Regular security audits

## 10. Backup & Recovery

### Database Backups
- Automated daily backups via cron job
- Point-in-time recovery available with most providers

### File Storage Backups
- Cloudinary provides redundant storage
- Regular exports recommended

## 11. Scaling Considerations

### Vertical Scaling
- Vercel automatically scales based on traffic
- Database connection pooling prevents bottlenecks

### Horizontal Scaling
- Stateless architecture allows easy scaling
- Redis for session management across instances

## 12. Maintenance

### Regular Tasks
- Database maintenance: Automated via cron
- Security updates: Dependabot configured
- Performance monitoring: Weekly reviews

### Upgrade Procedures
1. Test changes in staging environment
2. Deploy during low-traffic periods
3. Monitor metrics post-deployment
4. Rollback plan available

## 13. Support & Documentation

### Admin Features
- Complete admin dashboard
- System settings management
- User management
- Order management
- Email template management
- Analytics and reporting

### API Documentation
- Swagger documentation available at `/api/docs`
- Comprehensive API reference
- Rate limiting information

## 14. Go-Live Checklist

- [ ] Environment variables configured
- [ ] Database migrated and seeded
- [ ] Super admin account created
- [ ] Payment gateways configured
- [ ] Email templates customized
- [ ] Domain and SSL configured
- [ ] Webhooks configured
- [ ] Monitoring setup
- [ ] Backup procedures tested
- [ ] Performance tested
- [ ] Security audit completed

## 15. Support Contacts

For deployment assistance:
- Technical Support: technical@medical-devices.com
- Emergency Hotline: +966 XXX XXX XXXX
- Documentation: https://docs.medical-devices.com

---

## Quick Start Commands

```bash
# Clone and setup
git clone <your-repo>
cd medical-devices-marketplace
npm install

# Setup environment
cp .env.example .env
# Fill in your environment variables

# Database setup
npx prisma generate
npx prisma migrate deploy
npx prisma db seed

# Deploy to Vercel
vercel --prod
```

Your Medical Devices Marketplace is now ready for production! 🎉