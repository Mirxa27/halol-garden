# Environment Variables Configuration

This document describes all environment variables used in the Medical Devices Marketplace application.

## Quick Setup

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Run the setup script for guided configuration:
   ```bash
   ./scripts/setup-env.sh
   ```

## Environment Variables Reference

### Core Configuration

| Variable | Description | Required | Default | Example |
|----------|-------------|----------|---------|---------|
| `DATABASE_URL` | PostgreSQL connection string | ✅ | - | `postgresql://user:pass@localhost:5432/dbname` |
| `NEXT_PUBLIC_APP_URL` | Public application URL | ✅ | - | `https://medicaldevices.com` |
| `NEXTAUTH_URL` | NextAuth authentication URL | ✅ | - | `https://medicaldevices.com` |
| `NEXTAUTH_SECRET` | NextAuth encryption secret | ✅ | - | Generate with `openssl rand -base64 32` |
| `NODE_ENV` | Environment mode | ❌ | `development` | `production`, `development`, `test` |

### Authentication

| Variable | Description | Required | Default | Example |
|----------|-------------|----------|---------|---------|
| `AUTH_SECRET` | Authentication secret key | ✅ | - | Generate with `openssl rand -base64 32` |
| `SESSION_MAX_AGE` | Session duration in seconds | ❌ | `86400` | `86400` (24 hours) |

### Email Configuration (SMTP)

| Variable | Description | Required | Default | Example |
|----------|-------------|----------|---------|---------|
| `SMTP_HOST` | SMTP server hostname | ✅ | - | `smtp.gmail.com` |
| `SMTP_PORT` | SMTP server port | ✅ | - | `587` |
| `SMTP_SECURE` | Use TLS/SSL | ❌ | `false` | `true` or `false` |
| `SMTP_USER` | SMTP username | ✅ | - | `noreply@example.com` |
| `SMTP_PASS` | SMTP password | ✅ | - | `app-specific-password` |
| `EMAIL_FROM` | Default sender email | ❌ | `noreply@medicaldevices.com` | `"Medical Devices" <noreply@example.com>` |

### Payment Gateways

#### Stripe
| Variable | Description | Required | Default | Example |
|----------|-------------|----------|---------|---------|
| `STRIPE_SECRET_KEY` | Stripe secret key | ✅* | - | `sk_test_...` |
| `STRIPE_PUBLISHABLE_KEY` | Stripe public key | ✅* | - | `pk_test_...` |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook secret | ❌ | - | `whsec_...` |

#### PayPal
| Variable | Description | Required | Default | Example |
|----------|-------------|----------|---------|---------|
| `PAYPAL_CLIENT_ID` | PayPal client ID | ❌ | - | `AYZ...` |
| `PAYPAL_CLIENT_SECRET` | PayPal client secret | ❌ | - | `EH5...` |
| `PAYPAL_MODE` | PayPal environment | ❌ | `sandbox` | `sandbox` or `live` |

#### MyFatoorah
| Variable | Description | Required | Default | Example |
|----------|-------------|----------|---------|---------|
| `MYFATOORAH_API_KEY` | MyFatoorah API key | ❌ | - | `token_...` |
| `MYFATOORAH_BASE_URL` | MyFatoorah API URL | ❌ | - | `https://apitest.myfatoorah.com` |

#### Bank Transfer
| Variable | Description | Required | Default | Example |
|----------|-------------|----------|---------|---------|
| `BANK_ACCOUNT_NUMBER` | Bank account number | ❌ | - | `SA03 8000 0000 6080 1016 7519` |
| `BANK_NAME` | Bank name | ❌ | - | `Al Rajhi Bank` |
| `BANK_SWIFT_CODE` | SWIFT/BIC code | ❌ | - | `RJHISARI` |

### Caching & Search

| Variable | Description | Required | Default | Example |
|----------|-------------|----------|---------|---------|
| `REDIS_URL` | Redis connection URL | ❌ | - | `redis://localhost:6379` |
| `ELASTICSEARCH_URL` | Elasticsearch URL | ❌ | - | `http://localhost:9200` |

### File Storage

#### AWS S3
| Variable | Description | Required | Default | Example |
|----------|-------------|----------|---------|---------|
| `AWS_ACCESS_KEY_ID` | AWS access key | ❌ | - | `AKIA...` |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key | ❌ | - | `wJal...` |
| `AWS_REGION` | AWS region | ❌ | `us-east-1` | `us-west-2` |
| `AWS_S3_BUCKET` | S3 bucket name | ❌ | - | `medical-devices-uploads` |

#### Local Storage
| Variable | Description | Required | Default | Example |
|----------|-------------|----------|---------|---------|
| `UPLOAD_DIR` | Local upload directory | ❌ | `./uploads` | `./uploads` |
| `MAX_FILE_SIZE` | Max file size in bytes | ❌ | `10485760` | `10485760` (10MB) |
| `ALLOWED_FILE_TYPES` | Allowed MIME types | ❌ | - | `image/jpeg,image/png,application/pdf` |

### AI & Analytics

| Variable | Description | Required | Default | Example |
|----------|-------------|----------|---------|---------|
| `OPENAI_API_KEY` | OpenAI API key | ❌ | - | `sk-...` |
| `GOOGLE_ANALYTICS_ID` | Google Analytics ID | ❌ | - | `GA-XXXXXXXXX` |
| `MIXPANEL_TOKEN` | Mixpanel token | ❌ | - | `your_token` |
| `SENTRY_DSN` | Sentry error tracking | ❌ | - | `https://...@sentry.io/...` |

### Security

| Variable | Description | Required | Default | Example |
|----------|-------------|----------|---------|---------|
| `RATE_LIMIT_MAX` | Max requests per window | ❌ | `100` | `100` |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window (ms) | ❌ | `900000` | `900000` (15 min) |
| `CORS_ORIGINS` | Allowed CORS origins | ❌ | - | `https://app.com,https://api.com` |

### Feature Flags

| Variable | Description | Required | Default | Example |
|----------|-------------|----------|---------|---------|
| `ENABLE_CHAT` | Enable chat feature | ❌ | `true` | `true` or `false` |
| `ENABLE_AI_RECOMMENDATIONS` | Enable AI features | ❌ | `true` | `true` or `false` |
| `ENABLE_ADVANCED_SEARCH` | Enable Elasticsearch | ❌ | `true` | `true` or `false` |

### Localization

| Variable | Description | Required | Default | Example |
|----------|-------------|----------|---------|---------|
| `DEFAULT_LOCALE` | Default language | ❌ | `en` | `en` or `ar` |
| `SUPPORTED_LOCALES` | Supported languages | ❌ | `en,ar` | `en,ar,fr` |

### SMS Configuration (Optional)

| Variable | Description | Required | Default | Example |
|----------|-------------|----------|---------|---------|
| `TWILIO_ACCOUNT_SID` | Twilio account SID | ❌ | - | `AC...` |
| `TWILIO_AUTH_TOKEN` | Twilio auth token | ❌ | - | `token...` |
| `TWILIO_PHONE_NUMBER` | Twilio phone number | ❌ | - | `+1234567890` |

### Push Notifications (Optional)

| Variable | Description | Required | Default | Example |
|----------|-------------|----------|---------|---------|
| `FIREBASE_PROJECT_ID` | Firebase project ID | ❌ | - | `my-project` |
| `FIREBASE_PRIVATE_KEY` | Firebase private key | ❌ | - | `-----BEGIN PRIVATE KEY-----...` |
| `FIREBASE_CLIENT_EMAIL` | Firebase service email | ❌ | - | `firebase-adminsdk@...` |

## Production Deployment

### Required for Production

1. **Security**
   - Generate strong, unique secrets for `NEXTAUTH_SECRET` and `AUTH_SECRET`
   - Set `NODE_ENV=production`
   - Configure proper CORS origins

2. **Database**
   - Use a production PostgreSQL instance
   - Enable SSL for database connections
   - Set up regular backups

3. **Email**
   - Configure a production SMTP service
   - Use app-specific passwords
   - Set up SPF/DKIM records

4. **Payment**
   - Use production API keys
   - Configure webhook endpoints
   - Test payment flows thoroughly

### Environment-Specific Files

- `.env.local` - Local development
- `.env.production` - Production environment
- `.env.test` - Test environment

### Security Best Practices

1. **Never commit `.env` files** to version control
2. **Use environment variables** in CI/CD pipelines
3. **Rotate secrets** regularly
4. **Use least privilege** principle for API keys
5. **Monitor for exposed secrets** using tools like GitGuardian

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
   ```
   Error: P1001: Can't reach database server
   ```
   - Check DATABASE_URL format
   - Verify PostgreSQL is running
   - Check firewall/network settings

2. **Email Sending Failed**
   ```
   Error: Invalid login credentials
   ```
   - Use app-specific password for Gmail
   - Check SMTP settings
   - Verify firewall allows SMTP port

3. **Payment Processing Failed**
   ```
   Error: Invalid API key
   ```
   - Verify API keys are correct
   - Check if using test/production keys correctly
   - Ensure payment method is enabled

### Getting Help

- Check logs: `npm run logs`
- Run diagnostics: `npm run check:env`
- Contact support: support@medicaldevices.com