#!/bin/bash

# Medical Devices Marketplace - Deployment Script
# This script automates the deployment process to Vercel

set -e  # Exit on error

echo "🚀 Medical Devices Marketplace - Deployment Script"
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    print_error "Vercel CLI is not installed"
    echo "Installing Vercel CLI..."
    npm i -g vercel
    print_status "Vercel CLI installed"
fi

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Please run this script from the project root."
    exit 1
fi

# Parse command line arguments
ENVIRONMENT="production"
SKIP_BUILD=false
SKIP_TESTS=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --preview)
            ENVIRONMENT="preview"
            shift
            ;;
        --skip-build)
            SKIP_BUILD=true
            shift
            ;;
        --skip-tests)
            SKIP_TESTS=true
            shift
            ;;
        --help)
            echo "Usage: ./deploy.sh [options]"
            echo "Options:"
            echo "  --preview     Deploy to preview environment"
            echo "  --skip-build  Skip the build step"
            echo "  --skip-tests  Skip running tests"
            echo "  --help        Show this help message"
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            exit 1
            ;;
    esac
done

echo ""
echo "Deployment Configuration:"
echo "========================="
echo "Environment: $ENVIRONMENT"
echo "Skip Build: $SKIP_BUILD"
echo "Skip Tests: $SKIP_TESTS"
echo ""

# Step 1: Check for uncommitted changes
if [[ -n $(git status -s) ]]; then
    print_warning "You have uncommitted changes"
    read -p "Do you want to continue? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Step 2: Install dependencies
print_status "Installing dependencies..."
npm ci

# Step 3: Run tests (unless skipped)
if [ "$SKIP_TESTS" = false ]; then
    print_status "Running tests..."
    npm run test || {
        print_error "Tests failed. Aborting deployment."
        exit 1
    }
else
    print_warning "Skipping tests"
fi

# Step 4: Build the project (unless skipped)
if [ "$SKIP_BUILD" = false ]; then
    print_status "Building project..."
    npm run build || {
        print_error "Build failed. Aborting deployment."
        exit 1
    }
else
    print_warning "Skipping build"
fi

# Step 5: Run Prisma migrations
print_status "Generating Prisma client..."
npx prisma generate

# Step 6: Deploy to Vercel
if [ "$ENVIRONMENT" = "production" ]; then
    print_status "Deploying to production..."
    vercel --prod
else
    print_status "Deploying to preview..."
    vercel
fi

# Step 7: Post-deployment tasks
print_status "Running post-deployment tasks..."

# Get the deployment URL
DEPLOYMENT_URL=$(vercel ls --json | jq -r '.deployments[0].url')

if [ -n "$DEPLOYMENT_URL" ]; then
    print_status "Deployment successful!"
    echo ""
    echo "🎉 Your application is deployed at:"
    echo "   https://$DEPLOYMENT_URL"
    echo ""
    
    # Open in browser
    read -p "Open in browser? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        open "https://$DEPLOYMENT_URL" || xdg-open "https://$DEPLOYMENT_URL" || echo "Please open https://$DEPLOYMENT_URL in your browser"
    fi
else
    print_warning "Could not retrieve deployment URL"
fi

# Step 8: Show next steps
echo ""
echo "Next Steps:"
echo "==========="
echo "1. Verify the deployment at https://$DEPLOYMENT_URL"
echo "2. Run database migrations if needed:"
echo "   npx prisma migrate deploy"
echo "3. Check the admin panel at https://$DEPLOYMENT_URL/admin"
echo "4. Test provider connections in the admin panel"
echo ""

print_status "Deployment complete!"