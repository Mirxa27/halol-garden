#!/bin/bash

# Medical Devices Marketplace - Vercel Deployment Script
# This script handles the complete deployment process to Vercel

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="medical-devices-marketplace"
ENVIRONMENT=${1:-production}

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Medical Devices Marketplace Deployment${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo -e "${YELLOW}Vercel CLI not found. Installing...${NC}"
    npm install -g vercel
fi

# Check environment
echo -e "${YELLOW}Deploying to: ${ENVIRONMENT}${NC}"

# Run pre-deployment checks
echo -e "${YELLOW}Running pre-deployment checks...${NC}"

# 1. Check for required environment variables
echo "Checking environment variables..."
required_vars=(
    "DATABASE_URL"
    "JWT_SECRET"
    "NEXT_PUBLIC_APP_URL"
    "STRIPE_SECRET_KEY"
    "SMTP_HOST"
    "SMTP_USER"
)

missing_vars=()
for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        missing_vars+=($var)
    fi
done

if [ ${#missing_vars[@]} -ne 0 ]; then
    echo -e "${RED}Missing required environment variables:${NC}"
    printf '%s\n' "${missing_vars[@]}"
    echo -e "${YELLOW}Please set these in Vercel Dashboard or .env file${NC}"
    exit 1
fi

# 2. Run tests
echo "Running tests..."
npm run test:unit || {
    echo -e "${RED}Tests failed! Fix issues before deploying.${NC}"
    exit 1
}

# 3. Type checking
echo "Running type check..."
npm run type-check:strict || {
    echo -e "${RED}Type checking failed! Fix TypeScript errors before deploying.${NC}"
    exit 1
}

# 4. Linting
echo "Running linter..."
npm run lint:strict || {
    echo -e "${RED}Linting failed! Fix linting errors before deploying.${NC}"
    exit 1
}

# 5. Build test
echo "Testing build..."
npm run build || {
    echo -e "${RED}Build failed! Fix build errors before deploying.${NC}"
    exit 1
}

echo -e "${GREEN}✓ All pre-deployment checks passed${NC}"

# Database migrations
echo -e "${YELLOW}Running database migrations...${NC}"
npx prisma migrate deploy || {
    echo -e "${RED}Database migration failed!${NC}"
    exit 1
}

# Seed database (only for staging)
if [ "$ENVIRONMENT" = "staging" ]; then
    echo -e "${YELLOW}Seeding database...${NC}"
    npm run db:seed
fi

# Deploy to Vercel
echo -e "${YELLOW}Deploying to Vercel...${NC}"

if [ "$ENVIRONMENT" = "production" ]; then
    # Production deployment
    vercel --prod --yes || {
        echo -e "${RED}Deployment failed!${NC}"
        exit 1
    }
    
    # Get deployment URL
    DEPLOYMENT_URL=$(vercel ls --json | jq -r '.deployments[0].url')
    
    # Run post-deployment checks
    echo -e "${YELLOW}Running post-deployment checks...${NC}"
    
    # Health check
    echo "Checking health endpoint..."
    curl -f "https://${DEPLOYMENT_URL}/api/health" || {
        echo -e "${RED}Health check failed!${NC}"
        exit 1
    }
    
    # Invalidate cache if using CDN
    # Add your CDN cache invalidation logic here
    
else
    # Preview/Staging deployment
    vercel --yes || {
        echo -e "${RED}Deployment failed!${NC}"
        exit 1
    }
    
    DEPLOYMENT_URL=$(vercel ls --json | jq -r '.deployments[0].url')
fi

# Output deployment information
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Deployment Successful!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "Environment: ${ENVIRONMENT}"
echo -e "URL: https://${DEPLOYMENT_URL}"
echo ""

# Send notification (optional)
if [ ! -z "$SLACK_WEBHOOK_URL" ]; then
    curl -X POST -H 'Content-type: application/json' \
        --data "{\"text\":\"Medical Devices Marketplace deployed to ${ENVIRONMENT}: https://${DEPLOYMENT_URL}\"}" \
        "$SLACK_WEBHOOK_URL"
fi

# Create deployment tag in git
if [ "$ENVIRONMENT" = "production" ]; then
    TAG="v$(date +%Y%m%d-%H%M%S)"
    git tag -a "$TAG" -m "Production deployment $TAG"
    git push origin "$TAG"
    echo -e "${GREEN}Created deployment tag: $TAG${NC}"
fi

echo -e "${GREEN}Deployment complete!${NC}"