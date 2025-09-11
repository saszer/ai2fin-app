#!/bin/bash
# Deploy Sydney Region Configuration - embracingearth.space
# This script updates your Fly.io app to use Sydney as the primary region

set -e

echo "🚀 Deploying Sydney Region Configuration for embracingearth.space"
echo "================================================================"

# Check if flyctl is installed
if ! command -v flyctl &> /dev/null; then
    echo "❌ flyctl is not installed. Please install it first:"
    echo "   https://fly.io/docs/hands-on/install-flyctl/"
    exit 1
fi

# Check if user is logged in
if ! flyctl auth whoami &> /dev/null; then
    echo "❌ Please log in to Fly.io first:"
    echo "   flyctl auth login"
    exit 1
fi

echo "✅ Fly.io CLI is ready"

# Backup current configuration
echo "📋 Creating backup of current configuration..."
cp fly.toml fly.toml.backup.$(date +%Y%m%d_%H%M%S)
echo "✅ Backup created"

# Verify the configuration change
echo "🔍 Verifying configuration changes..."
if grep -q 'primary_region = "syd"' fly.toml; then
    echo "✅ Sydney region configuration found"
else
    echo "❌ Sydney region configuration not found. Please check fly.toml"
    exit 1
fi

# Deploy to Fly.io
echo "🚀 Deploying to Fly.io..."
echo "   App: ai2-production"
echo "   Region: Sydney (syd)"
echo "   This may take a few minutes..."

flyctl deploy --app ai2-production

if [ $? -eq 0 ]; then
    echo "✅ Deployment successful!"
    echo ""
    echo "🌍 Your app is now running in Sydney region"
    echo "📊 Monitor data flow metrics at:"
    echo "   GET /api/data-flow/metrics"
    echo "   GET /api/data-flow/regions"
    echo "   GET /api/data-flow/health"
    echo ""
    echo "🔧 Next steps:"
    echo "   1. Update Cloudflare configuration (see CLOUDFLARE_OPTIMIZATION_GUIDE.md)"
    echo "   2. Monitor data out metrics for improvements"
    echo "   3. Verify origin lock is working correctly"
    echo ""
    echo "📈 Expected improvements:"
    echo "   - Reduced latency for Australian users"
    echo "   - Better data out distribution"
    echo "   - Improved performance metrics"
else
    echo "❌ Deployment failed!"
    echo "   Check the error messages above and try again"
    exit 1
fi

echo ""
echo "🎉 Sydney region deployment complete!"
echo "   embracingearth.space is now optimized for Australian operations"
