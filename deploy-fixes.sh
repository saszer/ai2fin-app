#!/bin/bash

# Deploy Connection Leak Fixes - embracingearth.space
echo "🚀 Deploying Connection Leak Fixes..."

# Build the core app
echo "📦 Building core app..."
cd ai2-core-app
npm run build:local
if [ $? -ne 0 ]; then
    echo "❌ Core app build failed"
    exit 1
fi

# Build the client
echo "📦 Building client..."
npm run build:client
if [ $? -ne 0 ]; then
    echo "❌ Client build failed"
    exit 1
fi

# Build analytics service
echo "📦 Building analytics service..."
cd ../ai2-analytics
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Analytics build failed"
    exit 1
fi

# Deploy to Fly.io
echo "🚀 Deploying to Fly.io..."
cd ../ai2-core-app
fly deploy --app ai2-core-api --region syd

if [ $? -eq 0 ]; then
    echo "✅ Deployment successful!"
    echo "🔍 Monitor logs with: fly logs --app ai2-core-api --region syd"
    echo "📊 Run monitoring script: node ../monitor-fly-logs.js"
else
    echo "❌ Deployment failed"
    exit 1
fi

