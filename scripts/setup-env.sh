#!/bin/bash

# Environment Setup Script for Medical Devices Marketplace
# This script helps set up the environment configuration

set -e

echo "🚀 Medical Devices Marketplace - Environment Setup"
echo "================================================="
echo ""

# Check if .env exists
if [ -f .env ]; then
    echo "⚠️  .env file already exists!"
    read -p "Do you want to overwrite it? (y/N): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Setup cancelled."
        exit 0
    fi
fi

# Copy .env.example to .env
cp .env.example .env
echo "✅ Created .env file from .env.example"

# Generate secure secrets
echo ""
echo "🔐 Generating secure secrets..."

# Function to generate random string
generate_secret() {
    openssl rand -base64 32 | tr -d "=+/" | cut -c1-32
}

# Generate NextAuth secret
NEXTAUTH_SECRET=$(generate_secret)
sed -i.bak "s/your-nextauth-secret-here/$NEXTAUTH_SECRET/g" .env

# Generate Auth secret
AUTH_SECRET=$(generate_secret)
sed -i.bak "s/your-auth-secret-here/$AUTH_SECRET/g" .env

echo "✅ Generated secure authentication secrets"

# Database setup
echo ""
echo "📊 Database Configuration"
read -p "Enter PostgreSQL connection string (or press Enter for default): " DB_URL
if [ -z "$DB_URL" ]; then
    DB_URL="postgresql://postgres:postgres@localhost:5432/medical_devices_db"
fi
sed -i.bak "s|postgresql://user:password@localhost:5432/medical_devices_db|$DB_URL|g" .env

# Email configuration
echo ""
echo "📧 Email Configuration (SMTP)"
echo "For Gmail, use app-specific password: https://support.google.com/accounts/answer/185833"
read -p "Configure email now? (y/N): " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    read -p "SMTP Host (default: smtp.gmail.com): " SMTP_HOST
    SMTP_HOST=${SMTP_HOST:-smtp.gmail.com}
    
    read -p "SMTP Port (default: 587): " SMTP_PORT
    SMTP_PORT=${SMTP_PORT:-587}
    
    read -p "SMTP User (your email): " SMTP_USER
    read -sp "SMTP Password: " SMTP_PASS
    echo ""
    
    sed -i.bak "s/smtp.gmail.com/$SMTP_HOST/g" .env
    sed -i.bak "s/587/$SMTP_PORT/g" .env
    sed -i.bak "s/your-email@gmail.com/$SMTP_USER/g" .env
    sed -i.bak "s/your-app-password/$SMTP_PASS/g" .env
fi

# Payment configuration
echo ""
echo "💳 Payment Gateway Configuration"
read -p "Configure Stripe? (y/N): " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Get your keys from: https://dashboard.stripe.com/test/apikeys"
    read -p "Stripe Secret Key: " STRIPE_SECRET
    read -p "Stripe Publishable Key: " STRIPE_PUBLIC
    
    sed -i.bak "s/sk_test_your_stripe_secret_key/$STRIPE_SECRET/g" .env
    sed -i.bak "s/pk_test_your_stripe_publishable_key/$STRIPE_PUBLIC/g" .env
fi

# Application URL
echo ""
echo "🌐 Application Configuration"
read -p "Enter your application URL (default: http://localhost:3000): " APP_URL
APP_URL=${APP_URL:-http://localhost:3000}
sed -i.bak "s|http://localhost:3000|$APP_URL|g" .env

# Clean up backup files
rm -f .env.bak

echo ""
echo "✅ Environment setup complete!"
echo ""
echo "📝 Next steps:"
echo "1. Review and update .env file with any remaining configurations"
echo "2. Run 'npm run db:setup' to set up the database"
echo "3. Run 'npm run dev' to start the development server"
echo ""
echo "🔒 Security reminder:"
echo "- Never commit .env file to version control"
echo "- Use strong, unique passwords for production"
echo "- Rotate secrets regularly"
echo ""
echo "Happy coding! 🚀"