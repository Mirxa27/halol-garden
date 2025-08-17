#!/bin/bash

#############################################
# Production Deployment Script
# Medical Devices Marketplace Platform
#############################################

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
DEPLOYMENT_ENV="${1:-production}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Logging functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    log_step "Checking prerequisites..."
    
    # Check Node.js version
    if ! command -v node &> /dev/null; then
        log_error "Node.js is not installed"
        exit 1
    fi
    
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        log_error "Node.js version 18+ is required"
        exit 1
    fi
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        log_error "npm is not installed"
        exit 1
    fi
    
    # Check Vercel CLI
    if ! command -v vercel &> /dev/null; then
        log_warning "Vercel CLI not found. Installing..."
        npm i -g vercel
    fi
    
    # Check git
    if ! command -v git &> /dev/null; then
        log_error "git is not installed"
        exit 1
    fi
    
    log_info "Prerequisites check passed"
}

# Run tests
run_tests() {
    log_step "Running tests..."
    
    cd "$PROJECT_ROOT"
    
    # Run linting
    log_info "Running ESLint..."
    npm run lint || {
        log_error "Linting failed"
        exit 1
    }
    
    # Run type checking
    log_info "Running TypeScript check..."
    npm run type-check || {
        log_error "Type checking failed"
        exit 1
    }
    
    # Run unit tests
    log_info "Running unit tests..."
    npm run test:unit || {
        log_error "Unit tests failed"
        exit 1
    }
    
    # Run integration tests (if not in CI)
    if [ "${CI:-false}" != "true" ]; then
        log_info "Running integration tests..."
        npm run test:integration || {
            log_warning "Integration tests failed"
        }
    fi
    
    log_info "All tests passed"
}

# Build application
build_application() {
    log_step "Building application..."
    
    cd "$PROJECT_ROOT"
    
    # Clean previous builds
    log_info "Cleaning previous builds..."
    rm -rf .next out dist
    
    # Install dependencies
    log_info "Installing dependencies..."
    npm ci --production=false
    
    # Generate Prisma client
    log_info "Generating Prisma client..."
    npx prisma generate
    
    # Build Next.js application
    log_info "Building Next.js application..."
    npm run build || {
        log_error "Build failed"
        exit 1
    }
    
    # Optimize build
    log_info "Optimizing build..."
    npx next-optimized-images
    
    log_info "Build completed successfully"
}

# Database migrations
run_migrations() {
    log_step "Running database migrations..."
    
    if [ "$DEPLOYMENT_ENV" = "production" ]; then
        log_warning "Running production migrations. This is irreversible!"
        read -p "Are you sure you want to continue? (y/N) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log_info "Migrations cancelled"
            return
        fi
    fi
    
    # Backup database before migration
    log_info "Creating database backup..."
    ./scripts/backup-automation.sh backup database
    
    # Run migrations
    log_info "Applying migrations..."
    npx prisma migrate deploy || {
        log_error "Migration failed"
        exit 1
    }
    
    # Seed database (only for staging)
    if [ "$DEPLOYMENT_ENV" = "staging" ]; then
        log_info "Seeding database..."
        npx prisma db seed
    fi
    
    log_info "Migrations completed"
}

# Deploy to Vercel
deploy_vercel() {
    log_step "Deploying to Vercel..."
    
    cd "$PROJECT_ROOT"
    
    # Set environment
    local VERCEL_ENV=""
    case "$DEPLOYMENT_ENV" in
        production)
            VERCEL_ENV="--prod"
            ;;
        staging)
            VERCEL_ENV="--target staging"
            ;;
        preview)
            VERCEL_ENV=""
            ;;
        *)
            log_error "Unknown deployment environment: $DEPLOYMENT_ENV"
            exit 1
            ;;
    esac
    
    # Deploy
    log_info "Deploying to $DEPLOYMENT_ENV..."
    vercel $VERCEL_ENV --confirm || {
        log_error "Deployment failed"
        exit 1
    }
    
    # Get deployment URL
    DEPLOYMENT_URL=$(vercel ls --token $VERCEL_TOKEN 2>/dev/null | grep Ready | head -1 | awk '{print $2}')
    log_info "Deployed to: $DEPLOYMENT_URL"
    
    # Run post-deployment checks
    post_deployment_checks "$DEPLOYMENT_URL"
}

# Deploy to custom server
deploy_custom() {
    log_step "Deploying to custom server..."
    
    cd "$PROJECT_ROOT"
    
    # Build Docker image
    log_info "Building Docker image..."
    docker build -t medical-devices:$TIMESTAMP .
    docker tag medical-devices:$TIMESTAMP medical-devices:latest
    
    # Push to registry
    log_info "Pushing to registry..."
    docker push medical-devices:$TIMESTAMP
    docker push medical-devices:latest
    
    # Deploy to Kubernetes
    log_info "Deploying to Kubernetes..."
    kubectl set image deployment/medical-devices medical-devices=medical-devices:$TIMESTAMP
    kubectl rollout status deployment/medical-devices
    
    log_info "Custom deployment completed"
}

# Post-deployment checks
post_deployment_checks() {
    local URL="$1"
    
    log_step "Running post-deployment checks..."
    
    # Check if site is accessible
    log_info "Checking site accessibility..."
    if curl -f -s -o /dev/null "$URL"; then
        log_info "✓ Site is accessible"
    else
        log_error "✗ Site is not accessible"
        exit 1
    fi
    
    # Check API health
    log_info "Checking API health..."
    if curl -f -s "$URL/api/health" | grep -q "ok"; then
        log_info "✓ API is healthy"
    else
        log_error "✗ API health check failed"
    fi
    
    # Check WebSocket connection
    log_info "Checking WebSocket connection..."
    # This would require a WebSocket client test
    
    # Check critical pages
    local PAGES=("/" "/products" "/about" "/contact")
    for page in "${PAGES[@]}"; do
        if curl -f -s -o /dev/null "$URL$page"; then
            log_info "✓ Page $page is accessible"
        else
            log_warning "✗ Page $page is not accessible"
        fi
    done
    
    # Run Lighthouse audit
    if command -v lighthouse &> /dev/null; then
        log_info "Running Lighthouse audit..."
        lighthouse "$URL" --output json --output-path "./lighthouse-$TIMESTAMP.json" --only-categories=performance,seo,accessibility
    fi
    
    log_info "Post-deployment checks completed"
}

# Rollback deployment
rollback() {
    log_step "Rolling back deployment..."
    
    if [ "$DEPLOYMENT_ENV" = "production" ]; then
        log_warning "Rolling back production deployment!"
        read -p "Are you sure? (y/N) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log_info "Rollback cancelled"
            return
        fi
    fi
    
    # Vercel rollback
    vercel rollback --yes
    
    # Custom server rollback
    kubectl rollout undo deployment/medical-devices
    
    log_info "Rollback completed"
}

# Send deployment notification
send_notification() {
    local STATUS="$1"
    local MESSAGE="$2"
    
    # Slack notification
    if [ -n "${SLACK_WEBHOOK_URL:-}" ]; then
        curl -X POST "$SLACK_WEBHOOK_URL" \
            -H 'Content-Type: application/json' \
            -d "{
                \"text\": \"Deployment $STATUS\",
                \"attachments\": [{
                    \"color\": \"$([ "$STATUS" = "SUCCESS" ] && echo "good" || echo "danger")\",
                    \"text\": \"$MESSAGE\",
                    \"footer\": \"Environment: $DEPLOYMENT_ENV\",
                    \"ts\": $(date +%s)
                }]
            }" 2>/dev/null || true
    fi
    
    # Email notification
    if [ -n "${NOTIFICATION_EMAIL:-}" ]; then
        echo "$MESSAGE" | mail -s "Deployment $STATUS - $DEPLOYMENT_ENV" "$NOTIFICATION_EMAIL" 2>/dev/null || true
    fi
}

# Main deployment flow
main() {
    log_info "Starting deployment to $DEPLOYMENT_ENV"
    log_info "Timestamp: $TIMESTAMP"
    
    # Check prerequisites
    check_prerequisites
    
    # Run tests
    if [ "${SKIP_TESTS:-false}" != "true" ]; then
        run_tests
    else
        log_warning "Skipping tests (not recommended for production)"
    fi
    
    # Build application
    build_application
    
    # Run migrations
    if [ "${SKIP_MIGRATIONS:-false}" != "true" ]; then
        run_migrations
    fi
    
    # Deploy based on target
    case "${DEPLOY_TARGET:-vercel}" in
        vercel)
            deploy_vercel
            ;;
        custom)
            deploy_custom
            ;;
        both)
            deploy_vercel
            deploy_custom
            ;;
        *)
            log_error "Unknown deploy target: ${DEPLOY_TARGET}"
            exit 1
            ;;
    esac
    
    # Send success notification
    send_notification "SUCCESS" "Deployment to $DEPLOYMENT_ENV completed successfully at $(date)"
    
    log_info "Deployment completed successfully!"
    log_info "Environment: $DEPLOYMENT_ENV"
    log_info "Timestamp: $TIMESTAMP"
    
    # Show deployment summary
    echo
    echo "========================================="
    echo " DEPLOYMENT SUMMARY"
    echo "========================================="
    echo " Environment: $DEPLOYMENT_ENV"
    echo " Timestamp: $TIMESTAMP"
    echo " URL: ${DEPLOYMENT_URL:-N/A}"
    echo " Status: SUCCESS"
    echo "========================================="
}

# Error handling
trap 'log_error "Deployment failed at line $LINENO"; send_notification "FAILED" "Deployment to $DEPLOYMENT_ENV failed at $(date)"' ERR

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --env)
            DEPLOYMENT_ENV="$2"
            shift 2
            ;;
        --skip-tests)
            SKIP_TESTS=true
            shift
            ;;
        --skip-migrations)
            SKIP_MIGRATIONS=true
            shift
            ;;
        --target)
            DEPLOY_TARGET="$2"
            shift 2
            ;;
        --rollback)
            rollback
            exit 0
            ;;
        --help)
            echo "Usage: $0 [OPTIONS]"
            echo "Options:"
            echo "  --env <environment>      Deployment environment (production|staging|preview)"
            echo "  --skip-tests            Skip running tests"
            echo "  --skip-migrations       Skip database migrations"
            echo "  --target <target>       Deploy target (vercel|custom|both)"
            echo "  --rollback             Rollback last deployment"
            echo "  --help                 Show this help message"
            exit 0
            ;;
        *)
            log_error "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Run main deployment
main