#!/bin/bash

# BC Scanner App - Quick Deployment Script
echo "🚀 Starting BC Scanner App Deployment..."

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    npm install -g vercel
fi

# Check if logged in to Vercel
echo "🔐 Checking Vercel authentication..."
if ! vercel whoami &> /dev/null; then
    echo "⚠️ Please login to Vercel first:"
    echo "   vercel login"
    exit 1
fi

# Deploy to Vercel
echo "📦 Deploying to Vercel..."
vercel --prod

echo "✅ Deployment complete!"
echo ""
echo "📋 Next steps:"
echo "1. Go to https://vercel.com/dashboard"
echo "2. Click on your project"
echo "3. Go to Settings → Environment Variables"
echo "4. Add the following variables:"
echo ""
echo "   GOOGLE_GEMINI_API_KEY=AIzaSyCMvRQsbvP3O51jB3evexSbkxRZS4v2Fno"
echo "   DATABASE_URL=postgresql://postgres:byTrvIfBhecjaxwLJETiQSqeHkVDZgOS@switchback.proxy.rlwy.net:55041/railway"
echo "   DEBUG=False"
echo "   SECRET_KEY=django-insecure-k8#mq3v&x9p7z$w2n5@!c6r1t4y8u9i0o3p6s2a5d8f1g4h7j0k3l6m9"
echo ""
echo "5. Redeploy after adding environment variables"
echo "6. Test your API at: https://your-app.vercel.app/api/business-cards/"
echo ""
echo "🎉 Your BC Scanner App is ready for production!" 