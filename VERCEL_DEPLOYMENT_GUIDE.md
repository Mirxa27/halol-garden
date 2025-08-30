# 🚀 Vercel Deployment Guide - Medical Devices Marketplace

## Prerequisites

Before deploying to Vercel, ensure you have:

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **PostgreSQL Database**: Set up with Neon, Supabase, or Railway
3. **Payment Gateway Accounts**: Stripe and/or MyFatoorah
4. **SMTP Service**: Gmail, SendGrid, or similar
5. **Redis Instance** (Optional): Upstash or Railway

## 📋 Step-by-Step Deployment

### 1. Database Setup

#### Using Neon (Recommended)
```bash
# 1. Create account at neon.tech
# 2. Create new project
# 3. Copy connection string
# Format: postgresql://user:pass@host.neon.tech/dbname?sslmode=require
```

#### Using Supabase
```bash
# 1. Create project at supabase.com
# 2. Go to Settings > Database
# 3. Copy connection string (use pooling connection for Vercel)
```

### 2. Prepare Environment Variables

Create a `.env.production` file locally (DO NOT commit):

```env
# Database
DATABASE_URL=your_production_database_url

# Authentication
JWT_SECRET=generate_with_openssl_rand_base64_32
JWT_REFRESH_SECRET=generate_another_secret
NEXTAUTH_SECRET=generate_another_secret

# Super Admin (change after first login!)
SUPER_ADMIN_EMAIL=admin@yourdomain.com
SUPER_ADMIN_PASSWORD=SecurePassword123!

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Stripe
NEXT_PUBLIC_STRIPE_PUBLIC_KEY=pk_live_xxx
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# MyFatoorah
MYFATOORAH_API_KEY=your_api_key
MYFATOORAH_BASE_URL=https://api.myfatoorah.com

# Application
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
```

### 3. Deploy via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy (first time)
vercel

# Follow prompts:
# - Set up and deploy: Y
# - Which scope: Select your account
# - Link to existing project: N
# - Project name: medical-devices-marketplace
# - Directory: ./
# - Override settings: N

# Deploy to production
vercel --prod
```

### 4. Configure Environment Variables in Vercel Dashboard

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to Settings → Environment Variables
4. Add all variables from `.env.production`
5. Select appropriate environments (Production/Preview/Development)

### 5. Set Up Database

```bash
# Run migrations
npx prisma migrate deploy

# Seed initial data (including super admin)
npm run db:seed
```

### 6. Configure Domain (Optional)

1. In Vercel Dashboard → Settings → Domains
2. Add your custom domain
3. Follow DNS configuration instructions
4. Wait for SSL certificate (automatic)

## 🔧 Post-Deployment Configuration

### 1. Access Admin Panel

```
https://your-domain.vercel.app/admin
```

Login with super admin credentials and:
- Change the default password immediately
- Configure system settings
- Set up email templates
- Configure payment gateways

### 2. Configure Webhooks

#### Stripe Webhook
1. Go to Stripe Dashboard → Webhooks
2. Add endpoint: `https://your-domain/api/payments/stripe/webhook`
3. Select events: `payment_intent.succeeded`, `payment_intent.payment_failed`
4. Copy webhook secret to Vercel env vars

#### MyFatoorah Webhook
1. Configure in MyFatoorah dashboard
2. Set callback URL: `https://your-domain/api/payments/myfatoorah/callback`

### 3. Test Critical Paths

- [ ] User registration and email verification
- [ ] Product browsing and search
- [ ] Add to cart and checkout
- [ ] Payment processing
- [ ] Order confirmation email
- [ ] Admin dashboard access

## 🔍 Monitoring & Maintenance

### Enable Monitoring

1. **Vercel Analytics**
   ```bash
   npm install @vercel/analytics
   ```
   Enable in Vercel Dashboard

2. **Error Tracking (Sentry)**
   ```bash
   npm install @sentry/nextjs
   npx @sentry/wizard@latest -i nextjs
   ```

3. **Uptime Monitoring**
   - Use Vercel's built-in monitoring
   - Or set up external monitoring (UptimeRobot, Pingdom)

### Regular Maintenance Tasks

- **Daily**: Check error logs, monitor performance
- **Weekly**: Review analytics, update dependencies
- **Monthly**: Database optimization, security updates

## 🚨 Troubleshooting

### Common Issues

#### 1. Database Connection Errors
```
Error: Can't reach database server
```
**Solution**: 
- Check DATABASE_URL format
- Ensure IP whitelisting (if required)
- Use pooling connection for serverless

#### 2. Build Failures
```
Error: Build failed
```
**Solution**:
- Check build logs in Vercel
- Run `npm run build` locally
- Ensure all dependencies are in package.json

#### 3. Environment Variable Issues
```
Error: Missing required environment variable
```
**Solution**:
- Verify all env vars are set in Vercel Dashboard
- Check variable names match exactly
- Redeploy after adding variables

#### 4. Payment Gateway Errors
**Solution**:
- Verify API keys are correct
- Check webhook configuration
- Ensure proper HTTPS for callbacks

## 📊 Performance Optimization

### 1. Enable Caching
```javascript
// In your API routes
export const revalidate = 60; // Cache for 60 seconds
```

### 2. Optimize Images
```javascript
import Image from 'next/image';
// Use Next.js Image component for automatic optimization
```

### 3. Enable ISR (Incremental Static Regeneration)
```javascript
export const revalidate = 3600; // Revalidate every hour
```

## 🔐 Security Checklist

- [ ] Change default super admin password
- [ ] Enable 2FA for admin accounts
- [ ] Set up rate limiting
- [ ] Configure CORS properly
- [ ] Enable security headers
- [ ] Regular security updates
- [ ] Backup database regularly

## 📱 Mobile Optimization

The platform is fully responsive. Test on:
- [ ] iPhone (Safari)
- [ ] Android (Chrome)
- [ ] iPad/Tablets
- [ ] Desktop (various browsers)

## 🆘 Support & Resources

- **Vercel Documentation**: [vercel.com/docs](https://vercel.com/docs)
- **Next.js Documentation**: [nextjs.org/docs](https://nextjs.org/docs)
- **Prisma Documentation**: [prisma.io/docs](https://prisma.io/docs)
- **Support Email**: support@medical-devices.com

## 📝 Deployment Checklist

Before going live:

- [ ] All environment variables configured
- [ ] Database migrated and seeded
- [ ] Email service tested
- [ ] Payment processing tested
- [ ] SSL certificate active
- [ ] Admin panel accessible
- [ ] Mobile responsiveness verified
- [ ] Performance optimized
- [ ] Security headers configured
- [ ] Monitoring enabled
- [ ] Backup strategy in place
- [ ] Documentation updated

## 🎉 Launch!

Once everything is configured and tested:

1. Update DNS to point to Vercel
2. Monitor closely for first 24 hours
3. Be ready to rollback if needed
4. Celebrate your successful deployment! 🚀

---

**Need Help?** Contact the development team or check the troubleshooting section above.