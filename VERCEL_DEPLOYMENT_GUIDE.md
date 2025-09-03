# Vercel Deployment Guide

## Prerequisites

1. A Vercel account (sign up at vercel.com)
2. Vercel CLI installed: `npm i -g vercel`
3. All environment variables ready

## Environment Variables Required

Create the following environment variables in your Vercel project settings:

### Database
- `DATABASE_URL`: Your PostgreSQL connection string
  ```
  postgres://7450b05d2e4722a8da3bd01e04a15e9e63000bebcc794d7267b6e1dd33b0afa9:sk_sLa4_EqyI3xz6Tgrz4Fdg@db.prisma.io:5432/postgres?sslmode=require
  ```

### Authentication
- `NEXTAUTH_SECRET`: Generate with `openssl rand -base64 32`
- `NEXTAUTH_URL`: Your production URL (e.g., https://your-app.vercel.app)
- `AUTH_SECRET`: Same as NEXTAUTH_SECRET

### Email (Required for notifications)
- `SMTP_HOST`: Your SMTP host (e.g., smtp.gmail.com)
- `SMTP_PORT`: SMTP port (e.g., 587)
- `SMTP_USER`: Your email address
- `SMTP_PASS`: Your email password or app password
- `EMAIL_FROM`: Sender email (e.g., noreply@your-domain.com)

### Payment (Optional, can add later)
- `STRIPE_SECRET_KEY`: Your Stripe secret key
- `STRIPE_PUBLISHABLE_KEY`: Your Stripe publishable key

### Redis (Optional for caching)
- `REDIS_URL`: Your Redis connection URL (can use Upstash Redis)

## Deployment Steps

### Option 1: Deploy via Vercel CLI

1. Login to Vercel:
   ```bash
   vercel login
   ```

2. From the project root, run:
   ```bash
   vercel
   ```

3. Follow the prompts:
   - Link to existing project or create new
   - Configure project settings
   - Deploy

4. Set environment variables:
   ```bash
   vercel env add DATABASE_URL production
   vercel env add NEXTAUTH_SECRET production
   vercel env add NEXTAUTH_URL production
   # Add other variables as needed
   ```

### Option 2: Deploy via GitHub Integration

1. Push your code to GitHub

2. Import project in Vercel:
   - Go to vercel.com/new
   - Import your GitHub repository
   - Configure project name

3. Add Environment Variables:
   - Go to Project Settings > Environment Variables
   - Add all required variables
   - Make sure to select "Production" environment

4. Deploy:
   - Click "Deploy"
   - Vercel will automatically build and deploy

## Post-Deployment Steps

1. **Update NEXTAUTH_URL**: 
   - Once deployed, update NEXTAUTH_URL to your production URL
   - Format: https://your-project.vercel.app

2. **Run Database Migrations** (if needed):
   - Connect to your production database
   - Run: `npx prisma migrate deploy`

3. **Seed Initial Data** (optional):
   - For production, you might want to create an admin user
   - Create a production seed script or manually add via database

4. **Configure Domain** (optional):
   - Go to Project Settings > Domains
   - Add your custom domain
   - Update NEXTAUTH_URL accordingly

## Troubleshooting

### Build Errors

1. **Prisma Client Generation**:
   - Already handled in `package.json` with postinstall script
   - Build command includes `prisma generate`

2. **TypeScript Errors**:
   - Ensure all types are properly defined
   - Check `types/next-auth.d.ts` is included

### Runtime Errors

1. **Database Connection**:
   - Verify DATABASE_URL is correct
   - Check if database allows connections from Vercel IPs

2. **Authentication Issues**:
   - Ensure NEXTAUTH_SECRET is set
   - NEXTAUTH_URL matches your deployment URL

3. **Missing Environment Variables**:
   - Check Vercel logs for missing variable errors
   - Add any missing variables in Project Settings

## Performance Optimization

1. **Enable Caching**:
   - Add Redis for better performance
   - Use Vercel Edge Config for feature flags

2. **Image Optimization**:
   - Images are automatically optimized by Next.js
   - Consider using Vercel's Image Optimization

3. **Edge Functions**:
   - Consider moving auth checks to Edge Middleware
   - Use ISR for product pages

## Security Checklist

- [ ] All environment variables are set
- [ ] NEXTAUTH_SECRET is strong and unique
- [ ] Database connection uses SSL
- [ ] CORS is properly configured
- [ ] Rate limiting is enabled
- [ ] Input validation is working

## Monitoring

1. **Vercel Analytics**:
   - Enable in Project Settings
   - Monitor Web Vitals

2. **Error Tracking**:
   - Consider adding Sentry or similar
   - Monitor Vercel Functions logs

3. **Database Monitoring**:
   - Monitor connection pool
   - Track slow queries

## Support

For deployment issues:
1. Check Vercel deployment logs
2. Review Function logs for runtime errors
3. Verify all environment variables are set correctly