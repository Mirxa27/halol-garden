# Vercel Environment Variables Setup

## Important: Vercel Deployment Configuration

The deployment is failing because environment variables need to be configured in the Vercel dashboard, not in `vercel.json`.

## Steps to Fix Deployment:

1. **Go to your Vercel project dashboard**
   - Visit: https://vercel.com/dashboard
   - Select your project: `halol-garden`

2. **Navigate to Settings → Environment Variables**

3. **Add the following environment variables:**

### Required Variables:
```
DATABASE_URL=postgres://7450b05d2e4722a8da3bd01e04a15e9e63000bebcc794d7267b6e1dd33b0afa9:sk_sLa4_EqyI3xz6Tgrz4Fdg@db.prisma.io:5432/postgres?sslmode=require
NEXTAUTH_SECRET=your-secret-here-generate-with-openssl-rand-base64-32
NEXTAUTH_URL=https://your-project.vercel.app
```

### Optional Variables (add as needed):
```
# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
EMAIL_FROM=noreply@yourdomain.com

# Payment Gateways
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Other Services
ENCRYPTION_KEY=32-character-key-here
REDIS_URL=redis://default:password@host:6379
```

## Generate NEXTAUTH_SECRET:

Run this command locally:
```bash
openssl rand -base64 32
```

## After Setting Environment Variables:

1. **Redeploy your project**
   - Click "Redeploy" in Vercel dashboard
   - Or push a new commit to trigger deployment

2. **Update NEXTAUTH_URL**
   - After first deployment, update NEXTAUTH_URL with your actual Vercel URL
   - Example: `https://halol-garden.vercel.app`

## Notes:

- Environment variables are automatically encrypted by Vercel
- Different values can be set for Production, Preview, and Development
- Changes to environment variables require redeployment