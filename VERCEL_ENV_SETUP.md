# 🔧 Vercel Environment Variables Setup Guide

## Quick Fix for Deployment

The deployment error occurred because Vercel was looking for secret references that don't exist. I've fixed this by removing the `@secret` references from `vercel.json`.

## 📋 Step-by-Step Environment Setup

### Option 1: Via Vercel Dashboard (Recommended)

1. **Go to your Vercel project**: https://vercel.com/dashboard
2. **Click on your project**: `medical-devices-marketplace`
3. **Navigate to**: Settings → Environment Variables
4. **Add these variables ONE BY ONE**:

#### Minimum Required Variables (To Get Started):

```bash
# These are the absolute minimum to get the app running
DATABASE_URL = postgresql://dummy:dummy@localhost/dummy
REDIS_URL = redis://localhost:6379
JWT_SECRET = temporary-secret-change-this-later-32chars
JWT_REFRESH_SECRET = temporary-refresh-change-this-later-32
SESSION_SECRET = temporary-session-change-this-later-32
EMAIL_HOST = smtp.gmail.com
EMAIL_PORT = 587
EMAIL_USER = test@example.com
EMAIL_PASSWORD = dummy
EMAIL_FROM = noreply@example.com
PAYPAL_CLIENT_ID = dummy
PAYPAL_CLIENT_SECRET = dummy
PAYPAL_MODE = sandbox
```

#### Public Variables (Client-side):

```bash
NEXT_PUBLIC_API_URL = /api
NEXT_PUBLIC_APP_URL = https://your-project.vercel.app
NEXT_PUBLIC_SITE_NAME = Medical Devices Marketplace
```

### Option 2: Via Vercel CLI

```bash
# First, create a .env.local file with your values
cp .env.example .env.local
# Edit .env.local with your actual values

# Then push to Vercel
vercel env add DATABASE_URL production < .env.local
vercel env add REDIS_URL production < .env.local
# ... repeat for each variable

# Or use the bulk method
vercel env pull .env.production.local
```

## 🚀 Quick Deployment After Fix

```bash
# Deploy with the fixed configuration
vercel --prod
```

## 🆓 Free Service Setup (5 Minutes)

### 1. Database - Neon (Free 3GB)
1. Go to https://neon.tech
2. Sign up with GitHub
3. Create database
4. Copy connection string → paste as `DATABASE_URL`

### 2. Redis - Upstash (Free 10k commands/day)
1. Go to https://upstash.com
2. Sign up
3. Create Redis database
4. Copy Redis URL → paste as `REDIS_URL`

### 3. Generate Secrets (Terminal)
```bash
# Generate secure secrets
openssl rand -base64 32  # Use this 3 times for JWT_SECRET, JWT_REFRESH_SECRET, SESSION_SECRET
```

### 4. Email - Gmail
1. Go to https://myaccount.google.com/apppasswords
2. Generate app password
3. Use your Gmail as `EMAIL_USER`
4. Use app password as `EMAIL_PASSWORD`

### 5. PayPal Sandbox
1. Go to https://developer.paypal.com
2. Create sandbox app
3. Copy Client ID → `PAYPAL_CLIENT_ID`
4. Copy Secret → `PAYPAL_CLIENT_SECRET`

## ✅ Verification Checklist

After adding environment variables:

1. **Redeploy**: Click "Redeploy" in Vercel dashboard
2. **Check Functions tab**: Should show your API routes
3. **Visit your site**: Should load without errors
4. **Check `/api/auth/login`**: Should return 405 (method not allowed for GET)

## 🎯 Working Deployment URLs

Once deployed successfully, you'll have:
- Main site: `https://[your-project].vercel.app`
- API: `https://[your-project].vercel.app/api`
- Admin: `https://[your-project].vercel.app/admin`

## 🔴 Common Issues

### "Environment variable not found"
- Make sure to add ALL required variables
- Redeploy after adding variables

### "Database connection failed"
- Ensure `DATABASE_URL` includes `?sslmode=require`
- Check if database allows external connections

### "Build failed"
- Check build logs in Vercel dashboard
- Ensure all dependencies are in package.json

## 📝 Next Steps After Deployment

1. **Set up real database**: 
   ```bash
   npx prisma db push
   ```

2. **Create admin user**:
   ```bash
   npx tsx scripts/create-admin.ts
   ```

3. **Test the platform**:
   - Visit homepage
   - Try registration
   - Access admin panel

---

**Status**: Environment variables issue FIXED ✅
**Action Required**: Add environment variables in Vercel Dashboard
**Time Needed**: ~5 minutes