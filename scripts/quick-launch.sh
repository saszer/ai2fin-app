#!/bin/bash

# 🚀 AI2 Platform Quick Launch Script
# embracingearth.space - Automated deployment setup

set -e  # Exit on any error

echo "🚀 Starting AI2 Platform Launch..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required tools are installed
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js 18+"
        exit 1
    fi
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed"
        exit 1
    fi
    
    # Check flyctl
    if ! command -v flyctl &> /dev/null; then
        print_warning "flyctl not found. Installing..."
        curl -L https://fly.io/install.sh | sh
    fi
    
    # Check gcloud
    if ! command -v gcloud &> /dev/null; then
        print_warning "gcloud not found. Please install Google Cloud SDK"
        print_status "Visit: https://cloud.google.com/sdk/docs/install"
    fi
    
    print_success "Prerequisites check completed"
}

# Install dependencies
install_dependencies() {
    print_status "Installing dependencies..."
    
    # Install root dependencies
    npm install
    
    # Install service dependencies
    cd ai2-core-app && npm install && cd ..
    cd ai2-ai-modules && npm install && cd ..
    cd ai2-connectors && npm install && cd ..
    cd ai2-analytics && npm install && cd ..
    cd ai2-notifications && npm install && cd ..
    cd ai2-subscription-service && npm install && cd ..
    
    print_success "Dependencies installed"
}

# Setup Fly.io apps
setup_fly_apps() {
    print_status "Setting up Fly.io applications..."
    
    # Create staging app
    if ! flyctl apps list | grep -q "ai2-staging"; then
        flyctl launch --name ai2-staging --no-deploy --copy-config fly.staging.toml
        print_success "Created ai2-staging app"
    else
        print_status "ai2-staging app already exists"
    fi
    
    # Create production app
    if ! flyctl apps list | grep -q "ai2-production"; then
        flyctl launch --name ai2-production --no-deploy --copy-config fly.toml
        print_success "Created ai2-production app"
    else
        print_status "ai2-production app already exists"
    fi
}

# Setup GCP project
setup_gcp() {
    print_status "Setting up GCP project..."
    
    # Create project if it doesn't exist
    if ! gcloud projects describe ai2-production &> /dev/null; then
        gcloud projects create ai2-production --name="AI2 Production"
        print_success "Created GCP project: ai2-production"
    else
        print_status "GCP project ai2-production already exists"
    fi
    
    # Set project
    gcloud config set project ai2-production
    
    # Enable required APIs
    gcloud services enable cloudsql.googleapis.com
    gcloud services enable secretmanager.googleapis.com
    gcloud services enable storage.googleapis.com
    gcloud services enable redis.googleapis.com
    
    print_success "GCP setup completed"
}

# Create database
create_database() {
    print_status "Creating production database..."
    
    # Create Cloud SQL instance
    if ! gcloud sql instances describe ai2-main &> /dev/null; then
        gcloud sql instances create ai2-main \
            --database-version=POSTGRES_15 \
            --tier=db-f1-micro \
            --region=us-central1 \
            --root-password="$(openssl rand -base64 32)" \
            --storage-type=SSD \
            --storage-size=10GB \
            --backup-start-time=23:00 \
            --maintenance-window-day=SUN \
            --maintenance-window-hour=02
        
        print_success "Created Cloud SQL instance: ai2-main"
    else
        print_status "Cloud SQL instance ai2-main already exists"
    fi
    
    # Create database
    gcloud sql databases create ai2_production --instance=ai2-main || true
    
    # Create user
    gcloud sql users create ai2_user --instance=ai2-main --password="$(openssl rand -base64 32)" || true
    
    print_success "Database setup completed"
}

# Deploy to staging
deploy_staging() {
    print_status "Deploying to staging..."
    
    # Build and deploy
    npm run build:all
    flyctl deploy --app ai2-staging
    
    # Wait for deployment
    sleep 30
    
    # Test health endpoint
    if curl -f https://ai2-staging.fly.dev/health &> /dev/null; then
        print_success "Staging deployment successful"
        print_status "Staging URL: https://ai2-staging.fly.dev"
    else
        print_error "Staging deployment failed"
        exit 1
    fi
}

# Deploy to production
deploy_production() {
    print_status "Deploying to production..."
    
    # Build and deploy
    npm run build:all
    flyctl deploy --app ai2-production
    
    # Wait for deployment
    sleep 30
    
    # Test health endpoint
    if curl -f https://ai2-production.fly.dev/health &> /dev/null; then
        print_success "Production deployment successful"
        print_status "Production URL: https://ai2-production.fly.dev"
    else
        print_error "Production deployment failed"
        exit 1
    fi
}

# Setup monitoring
setup_monitoring() {
    print_status "Setting up monitoring..."
    
    # Create status page directory
    mkdir -p infrastructure/status-page
    
    # Deploy status page
    cd infrastructure/status-page
    docker-compose up -d || print_warning "Status page deployment skipped (Docker not available)"
    cd ../..
    
    print_success "Monitoring setup completed"
}

# Main execution
main() {
    echo "🎯 AI2 Platform Quick Launch"
    echo "================================"
    
    # Check prerequisites
    check_prerequisites
    
    # Install dependencies
    install_dependencies
    
    # Setup infrastructure
    setup_fly_apps
    setup_gcp
    create_database
    
    # Deploy applications
    deploy_staging
    deploy_production
    
    # Setup monitoring
    setup_monitoring
    
    echo ""
    echo "🎉 Launch completed successfully!"
    echo "================================"
    echo "📱 Staging: https://ai2-staging.fly.dev"
    echo "🚀 Production: https://ai2-production.fly.dev"
    echo "📊 Status Page: http://localhost:3001 (if deployed)"
    echo ""
    echo "📋 Next steps:"
    echo "1. Configure domain: app.embracingearth.space"
    echo "2. Set up Cloudflare DNS and SSL"
    echo "3. Configure GitHub secrets for CI/CD"
    echo "4. Test all features on staging"
    echo "5. Monitor production deployment"
    echo ""
    echo "📚 Documentation:"
    echo "- Launch Checklist: LAUNCH_CHECKLIST.md"
    echo "- Deployment Guide: DEPLOYMENT_CHECKLIST.md"
    echo "- PWA Guide: PWA_APP_STORE_INTEGRATION.md"
}

# Run main function
main "$@" 