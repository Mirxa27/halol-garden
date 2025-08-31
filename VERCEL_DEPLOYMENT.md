# Halol Garden - Vercel Deployment Guide

## 🚀 Production Deployment Checklist

### 1. Environment Variables (Required for Vercel)

Set these in Vercel Dashboard → Project Settings → Environment Variables:

#### Database & Core
```
DATABASE_URL=postgres://7450b05d2e4722a8da3bd01e04a15e9e63000bebcc794d7267b6e1dd33b0afa9:sk_tUUylaGaYFpQCzkm4CTtU@db.prisma.io:5432/postgres?sslmode=require
```

#### Authentication & Security
```
JWT_SECRET=NQ5oBXN8olz5o9v7raQ2zQ0tWUocXm
NEXTAUTH_SECRET=xo0VtbP4IYNmiVpiqrVCiGnweBR56b
ENCRYPTION_KEY=93b4fac179039113589e0229017e078f
NEXTAUTH_URL=https://halol-garden.vercel.app
NEXT_PUBLIC_APP_URL=https://halol-garden.vercel.app
NODE_ENV=production
```

#### Email (SMTP) - Configure with real provider
```
SMTP_HOST=smtp.resend.com
SMTP_PORT=587
SMTP_USER=resend
SMTP_PASS=[YOUR_API_KEY]
FROM_EMAIL=noreply@halol-garden.com
```

#### Payment Gateways - Add real credentials
```
STRIPE_PUBLISHABLE_KEY=[YOUR_STRIPE_PUBLIC_KEY]
STRIPE_SECRET_KEY=[YOUR_STRIPE_SECRET_KEY]
PAYPAL_CLIENT_ID=[YOUR_PAYPAL_CLIENT_ID]
PAYPAL_CLIENT_SECRET=[YOUR_PAYPAL_CLIENT_SECRET]
MYFATOORAH_API_KEY=[YOUR_MYFATOORAH_KEY]
```

#### Optional Services
```
REDIS_URL=[YOUR_REDIS_URL_IF_USING_CACHING]
OPENAI_API_KEY=[YOUR_OPENAI_KEY_IF_USING_AI_FEATURES]
AWS_ACCESS_KEY_ID=[FOR_S3_FILE_UPLOADS]
AWS_SECRET_ACCESS_KEY=[FOR_S3_FILE_UPLOADS]
AWS_S3_BUCKET=[YOUR_S3_BUCKET_NAME]
```

### 2. Admin Credentials (Already Created)

**Super Admin Login:**
- Email: `admin+auto1756570033@halol-garden.com`
- Password: `9MZCho5uthbT0uDKAMLU`

⚠️ **IMPORTANT:** Change this password after first login!

### 3. Database Status

✅ **Production Database:** Schema applied and ready
✅ **Admin User:** Created and verified
✅ **Models:** All missing models added (SalesDetails, RentalDetails, Shipping, etc.)

### 4. Deployment Commands

#### Option A: Vercel CLI
```bash
npm install -g vercel
vercel login
vercel --prod
```

#### Option B: GitHub Integration
1. Connect Vercel to this GitHub repository
2. Set environment variables in Vercel dashboard
3. Push to main branch or create PR to trigger deployment

### 5. Post-Deployment Verification

After deployment, test these endpoints:

#### Health Check
```
GET https://halol-garden.vercel.app/api/health
```

#### Admin Login
```
POST https://halol-garden.vercel.app/api/auth/login
{
  "email": "admin+auto1756570033@halol-garden.com",
  "password": "9MZCho5uthbT0uDKAMLU"
}
```

#### Products API
```
GET https://halol-garden.vercel.app/api/products
```

#### Database Connection
```
GET https://halol-garden.vercel.app/api/admin/dashboard
```

### 6. Expected Functionality

✅ **Working Features:**
- User registration/login
- Admin dashboard
- Product browsing and search
- Shopping cart functionality
- Order creation
- Product management
- File uploads
- Email notifications (with SMTP configured)
- Payment processing (with keys configured)

### 7. Known Issues & Limitations

- Payment gateways need real API keys for live transactions
- Email requires SMTP configuration for notifications
- File uploads default to local storage (configure AWS S3 for production)
- Redis caching is optional but recommended for performance

### 8. Security Headers

All security headers are configured in `vercel.json`:
- CORS policies
- CSP directives
- XSS protection
- HSTS enforcement

### 9. Performance Optimizations

- Static assets cached for 1 year
- API routes have appropriate timeout settings
- Database connection pooling via Prisma
- Image optimization via Next.js

### 10. Monitoring & Analytics

Ready for integration with:
- Vercel Analytics (built-in)
- Sentry error tracking (add SENTRY_DSN)
- Custom monitoring endpoints

---

## 🔧 Troubleshooting

### Build Failures
1. Check environment variables are set correctly
2. Verify DATABASE_URL is accessible from Vercel
3. Run `npm run build` locally to test

### Runtime Errors
1. Check Vercel function logs
2. Verify Prisma Client generation
3. Test database connectivity

### API Issues
1. Verify all imports use default prisma import
2. Check API route handlers are properly structured
3. Test with Postman/curl before deployment

---

## 📞 Support

The application is fully configured and ready for production deployment. All database schema issues have been resolved and the admin user is created.