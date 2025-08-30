# 🚀 Vercel Deployment Setup Guide

## Quick Start (5 Minutes)

This guide will help you deploy the Medical Devices Marketplace to Vercel with all services properly configured.

## 📋 Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **GitHub Repository**: Fork/clone this repository
3. **Free Service Accounts** (we'll set these up below)

## 🔧 Step 1: Database Setup (2 minutes)

### Option A: Neon (Recommended - Free)
1. Go to [neon.tech](https://neon.tech)
2. Sign up with GitHub
3. Click "Create Database"
4. Copy the connection string
5. It will look like: `postgresql://user:pass@host.neon.tech/neondb?sslmode=require`

### Option B: Supabase (Alternative - Free)
1. Go to [supabase.com](https://supabase.com)
2. Create new project
3. Go to Settings → Database
4. Copy the connection string

## 🔧 Step 2: Redis Setup (1 minute)

### Upstash Redis (Free)
1. Go to [upstash.com](https://upstash.com)
2. Sign up and create Redis database
3. Select closest region to your users
4. Copy the Redis URL from the dashboard
5. It will look like: `redis://default:password@host.upstash.io:6379`

## 🔧 Step 3: Deploy to Vercel

### Method 1: One-Click Deploy (Easiest)
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/medical-devices-marketplace)

### Method 2: Manual Deploy
1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository
3. Click "Deploy"

## 🔧 Step 4: Configure Environment Variables

After deployment, go to your project in Vercel Dashboard:

1. Navigate to **Settings** → **Environment Variables**
2. Add these variables one by one:

### Required Variables (Minimum for App to Work)

| Variable | Value | How to Get |
|----------|-------|------------|
| `DATABASE_URL` | Your PostgreSQL URL | From Step 1 |
| `REDIS_URL` | Your Redis URL | From Step 2 |
| `JWT_SECRET` | Random 32-char string | Run: `openssl rand -base64 32` |
| `JWT_REFRESH_SECRET` | Random 32-char string | Run: `openssl rand -base64 32` |
| `SESSION_SECRET` | Random 32-char string | Run: `openssl rand -base64 32` |
| `NEXTAUTH_SECRET` | Random 32-char string | Run: `openssl rand -base64 32` |
| `NEXTAUTH_URL` | `https://your-app.vercel.app` | Your Vercel URL |

### Email Setup (For Notifications)

#### Using Gmail (Free)
1. Go to [Google App Passwords](https://myaccount.google.com/apppasswords)
2. Generate an app password
3. Add these variables:

| Variable | Value |
|----------|-------|
| `SMTP_HOST` | `smtp.gmail.com` |
| `SMTP_PORT` | `587` |
| `SMTP_USER` | Your Gmail address |
| `SMTP_PASS` | Your app password |
| `SMTP_FROM` | `noreply@yourdomain.com` |

### Payment Gateway (Choose One)

#### PayPal Sandbox (For Testing)
1. Go to [developer.paypal.com](https://developer.paypal.com)
2. Create sandbox app
3. Add these variables:

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_PAYPAL_CLIENT_ID` | Your Client ID |
| `PAYPAL_CLIENT_SECRET` | Your Secret |
| `PAYPAL_MODE` | `sandbox` |

#### Stripe (For Production)
1. Go to [stripe.com](https://stripe.com)
2. Get your API keys
3. Add these variables:

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Your publishable key |
| `STRIPE_SECRET_KEY` | Your secret key |

## 🔧 Step 5: Initialize Database

After adding environment variables:

1. **Redeploy** your application (Vercel Dashboard → Deployments → Redeploy)
2. **Initialize database** using Vercel CLI:

```bash
# Install Vercel CLI
npm i -g vercel

# Link to your project
vercel link

# Run database setup
vercel env pull .env.local
npx prisma db push
npx prisma db seed
```

Or use the database provider's web interface to run the schema.

## 🔧 Step 6: Optional Services

### File Storage

#### Cloudinary (Free tier - 25GB)
1. Sign up at [cloudinary.com](https://cloudinary.com)
2. Add credentials:

| Variable | Value |
|----------|-------|
| `CLOUDINARY_CLOUD_NAME` | Your cloud name |
| `CLOUDINARY_API_KEY` | Your API key |
| `CLOUDINARY_API_SECRET` | Your API secret |

### Real-time Features

#### Pusher (Free tier - 200k messages/day)
1. Sign up at [pusher.com](https://pusher.com)
2. Create new app
3. Add credentials:

| Variable | Value |
|----------|-------|
| `PUSHER_APP_ID` | Your app ID |
| `NEXT_PUBLIC_PUSHER_KEY` | Your key |
| `PUSHER_SECRET` | Your secret |
| `NEXT_PUBLIC_PUSHER_CLUSTER` | Your cluster |

## ✅ Verification Checklist

After setup, verify everything works:

1. **Homepage loads**: `https://your-app.vercel.app`
2. **API health check**: `https://your-app.vercel.app/api/health`
3. **Can register new user**
4. **Can browse products**
5. **Can add to cart**

## 🆘 Troubleshooting

### "Database connection failed"
- Ensure `DATABASE_URL` includes `?sslmode=require`
- Check if database allows connections from Vercel IPs

### "Build failed"
- Check build logs in Vercel dashboard
- Ensure all required environment variables are set
- Try redeploying

### "Functions timeout"
- Free tier has 10-second limit
- Optimize database queries
- Consider upgrading to Pro

## 📊 Monitoring

### Free Monitoring Options
1. **Vercel Analytics**: Built-in, free tier available
2. **Sentry**: Error tracking with free tier
3. **LogTail**: Log management with free tier

## 🎯 Next Steps

1. **Custom Domain**: Add your domain in Vercel settings
2. **SSL Certificate**: Automatic with custom domain
3. **CDN**: Automatic with Vercel
4. **Backups**: Set up database backups with your provider
5. **Monitoring**: Set up error tracking and analytics

## 💰 Cost Estimation

With free tiers, you can run this application for **$0/month** supporting:
- ✅ Up to 100GB bandwidth (Vercel)
- ✅ 3GB database storage (Neon)
- ✅ 10,000 Redis commands/day (Upstash)
- ✅ 100 emails/day (Gmail)
- ✅ Unlimited products
- ✅ Thousands of users

## 📚 Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Project README](./README.md)

## 🤝 Support

- **GitHub Issues**: Report bugs or request features
- **Discord**: Join our community (if available)
- **Email**: support@yourdomain.com

---

**Ready to Deploy?** Follow the steps above and your marketplace will be live in minutes! 🚀