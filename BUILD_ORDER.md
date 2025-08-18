# 📱💻 End-to-End Build Order Documentation

## Medical Devices Marketplace Platform - Complete Build & Deployment Guide

This document provides a comprehensive, step-by-step guide for building and deploying the Medical Devices Marketplace platform for both web and mobile environments.

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Web Application Build](#web-application-build)
4. [Mobile Application Build](#mobile-application-build)
5. [Deployment Process](#deployment-process)
6. [Post-Deployment](#post-deployment)
7. [Troubleshooting](#troubleshooting)

---

## 🔧 Prerequisites

### System Requirements
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **Git**: Latest version
- **Docker**: v20.10 or higher (for containerized deployment)
- **PostgreSQL**: v14+ (for database)
- **Redis**: v6+ (optional, for caching)

### Development Tools
```bash
# Install required global packages
npm install -g typescript@latest
npm install -g @vercel/cli
npm install -g expo-cli  # For mobile development
npm install -g eas-cli   # For Expo Application Services
```

### Required Accounts
- GitHub account (for version control)
- Vercel account (for web deployment)
- Expo account (for mobile builds)
- Apple Developer account (for iOS deployment)
- Google Play Console account (for Android deployment)
- PostgreSQL database hosting (e.g., Supabase, Neon, Railway)

---

## 🌍 Environment Setup

### 1. Clone Repository
```bash
git clone https://github.com/your-org/medical-platform.git
cd medical-platform
```

### 2. Install Dependencies
```bash
# Install all dependencies
npm install

# Verify installation
npm run type-check
```

### 3. Configure Environment Variables
```bash
# Copy environment template
cp .env.example .env

# Edit .env file with your configurations
nano .env
```

**Required Environment Variables:**
```env
# Database
DATABASE_URL=postgresql://user:password@host:5432/dbname?sslmode=require
REDIS_URL=redis://default:password@host:port

# Authentication
JWT_SECRET=<generate-with-openssl-rand-base64-32>
JWT_REFRESH_SECRET=<generate-with-openssl-rand-base64-32>
SESSION_SECRET=<generate-with-openssl-rand-base64-32>

# Email Service
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=app-specific-password

# Payment Gateways
PAYPAL_CLIENT_ID=your-paypal-client-id
PAYPAL_CLIENT_SECRET=your-paypal-client-secret

# Public URLs
NEXT_PUBLIC_API_URL=https://your-domain.com/api
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

### 4. Database Setup
```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate deploy

# Seed initial data (optional)
npm run db:seed

# Verify database connection
npx prisma studio
```

---

## 🌐 Web Application Build

### Development Build
```bash
# Start development server
npm run dev

# Access at http://localhost:3000
```

### Production Build

#### Step 1: Pre-build Checks
```bash
# Run linting
npm run lint

# Run type checking
npm run type-check

# Run tests
npm test

# Check bundle size
npm run analyze
```

#### Step 2: Build Application
```bash
# Clean previous builds
npm run clean

# Build for production
npm run build

# Output will be in .next/ directory
```

#### Step 3: Test Production Build Locally
```bash
# Start production server
npm start

# Test at http://localhost:3000
```

### Docker Build (Alternative)
```bash
# Build Docker image
docker build -t medical-platform:latest .

# Run container
docker run -p 3000:3000 --env-file .env medical-platform:latest

# Or use Docker Compose
docker-compose up -d
```

---

## 📱 Mobile Application Build

### Initial Setup

#### Step 1: Create Expo/React Native Project
```bash
# Create mobile directory
mkdir mobile
cd mobile

# Initialize Expo project
npx create-expo-app medical-marketplace-mobile --template

# Install additional dependencies
npm install @react-navigation/native
npm install @react-navigation/stack
npm install react-native-safe-area-context
npm install react-native-screens
npm install axios
npm install @tanstack/react-query
npm install react-native-async-storage
```

#### Step 2: Configure Mobile App
```javascript
// app.json
{
  "expo": {
    "name": "Medical Marketplace",
    "slug": "medical-marketplace",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.yourcompany.medicalmarketplace",
      "buildNumber": "1.0.0"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      },
      "package": "com.yourcompany.medicalmarketplace",
      "versionCode": 1
    },
    "extra": {
      "apiUrl": "https://your-domain.com/api",
      "eas": {
        "projectId": "your-project-id"
      }
    }
  }
}
```

### iOS Build

#### Step 1: Configure iOS Certificates
```bash
# Login to Expo
expo login

# Configure iOS credentials
eas credentials:configure --platform ios
```

#### Step 2: Build iOS App
```bash
# Development build
eas build --platform ios --profile development

# Production build
eas build --platform ios --profile production

# Download .ipa file when ready
```

#### Step 3: Submit to App Store
```bash
# Submit to App Store Connect
eas submit --platform ios

# Or manually upload via Transporter app
```

### Android Build

#### Step 1: Configure Android Signing
```bash
# Generate keystore (first time only)
keytool -genkeypair -v -keystore medical-marketplace.keystore -alias medical-marketplace -keyalg RSA -keysize 2048 -validity 10000

# Configure in eas.json
```

#### Step 2: Build Android App
```bash
# Development build (.apk)
eas build --platform android --profile development

# Production build (.aab for Play Store)
eas build --platform android --profile production

# Download .aab/.apk file when ready
```

#### Step 3: Submit to Google Play
```bash
# Submit to Google Play Console
eas submit --platform android

# Or manually upload via Play Console
```

---

## 🚀 Deployment Process

### Web Deployment - Vercel

#### Automatic Deployment (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy to Vercel
vercel --prod

# Follow prompts to configure project
```

#### Manual Deployment via GitHub
1. Push code to GitHub repository
2. Connect repository to Vercel dashboard
3. Configure environment variables in Vercel
4. Deploy with automatic CI/CD

### Web Deployment - Custom Server

#### Step 1: Prepare Server
```bash
# SSH into server
ssh user@your-server.com

# Install Node.js and npm
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 for process management
sudo npm install -g pm2

# Install Nginx
sudo apt-get install nginx
```

#### Step 2: Deploy Application
```bash
# Clone repository
git clone https://github.com/your-org/medical-platform.git
cd medical-platform

# Install dependencies
npm ci --only=production

# Build application
npm run build

# Start with PM2
pm2 start npm --name "medical-platform" -- start
pm2 save
pm2 startup
```

#### Step 3: Configure Nginx
```nginx
# /etc/nginx/sites-available/medical-platform
server {
    listen 80;
    server_name your-domain.com;

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
}
```

#### Step 4: Enable SSL
```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal
sudo certbot renew --dry-run
```

### Database Deployment

#### PostgreSQL Setup
```bash
# Using Supabase (Recommended)
1. Create project at supabase.com
2. Copy connection string
3. Update DATABASE_URL in .env

# Or self-hosted PostgreSQL
sudo apt-get install postgresql postgresql-contrib
sudo -u postgres createdb medical_marketplace
sudo -u postgres createuser medical_user
```

#### Run Migrations
```bash
# Production migrations
npx prisma migrate deploy

# Verify migrations
npx prisma migrate status
```

---

## 📊 Post-Deployment

### 1. Health Checks
```bash
# Check application health
curl https://your-domain.com/api/health

# Check database connection
npx prisma db pull

# Monitor logs
pm2 logs medical-platform
```

### 2. Performance Monitoring
```javascript
// Configure monitoring in next.config.js
module.exports = {
  // Enable analytics
  analytics: {
    enabled: true,
  },
  
  // Sentry for error tracking
  sentry: {
    hideSourceMaps: true,
  },
};
```

### 3. Set Up Monitoring
- **Uptime Monitoring**: UptimeRobot, Pingdom
- **Error Tracking**: Sentry, LogRocket
- **Analytics**: Google Analytics, Vercel Analytics
- **Performance**: Lighthouse CI, WebPageTest

### 4. Configure Backups
```bash
# Database backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump $DATABASE_URL > backup_$DATE.sql
aws s3 cp backup_$DATE.sql s3://your-backup-bucket/
```

### 5. Set Up CI/CD Pipeline
```yaml
# .github/workflows/deploy.yml
name: Deploy
on:
  push:
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
      - run: npm run build
      - run: npm test
      - uses: vercel/action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
```

---

## 🔍 Troubleshooting

### Common Issues and Solutions

#### Build Failures
```bash
# Clear cache and rebuild
rm -rf .next node_modules package-lock.json
npm install
npm run build
```

#### Database Connection Issues
```bash
# Test connection
npx prisma db pull

# Reset database
npx prisma migrate reset
```

#### Memory Issues
```bash
# Increase Node memory limit
NODE_OPTIONS="--max-old-space-size=4096" npm run build
```

#### Port Conflicts
```bash
# Find process using port 3000
lsof -i :3000

# Kill process
kill -9 <PID>
```

### Performance Optimization

#### 1. Enable Caching
```javascript
// next.config.js
module.exports = {
  headers: async () => [
    {
      source: '/:all*(svg|jpg|jpeg|png|gif|ico|webp)',
      headers: [
        {
          key: 'Cache-Control',
          value: 'public, max-age=31536000, immutable',
        },
      ],
    },
  ],
};
```

#### 2. Optimize Images
```bash
# Install sharp for image optimization
npm install sharp

# Configure in next.config.js
module.exports = {
  images: {
    formats: ['image/avif', 'image/webp'],
  },
};
```

#### 3. Enable Compression
```javascript
// server/index.js
import compression from 'compression';
app.use(compression());
```

---

## 📝 Build Checklist

### Pre-Build
- [ ] All tests passing
- [ ] No linting errors
- [ ] Environment variables configured
- [ ] Database migrations up to date
- [ ] Dependencies updated
- [ ] Security vulnerabilities patched

### Build Process
- [ ] Clean previous builds
- [ ] Run production build
- [ ] Test build locally
- [ ] Check bundle size
- [ ] Verify all features working

### Deployment
- [ ] Deploy to staging first
- [ ] Run smoke tests
- [ ] Check monitoring dashboards
- [ ] Deploy to production
- [ ] Verify production deployment
- [ ] Update DNS if needed

### Post-Deployment
- [ ] Monitor error rates
- [ ] Check performance metrics
- [ ] Verify backups running
- [ ] Update documentation
- [ ] Notify team of deployment

---

## 🆘 Support

For deployment issues or questions:
- **Documentation**: Check `/docs` folder
- **Issues**: Open issue on GitHub
- **Email**: devops@medical-devices.com
- **Slack**: #deployment-help channel

---

**Last Updated**: December 2024  
**Version**: 1.0.0  
**Maintained by**: DevOps Team