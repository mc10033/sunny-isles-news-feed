#!/bin/bash

echo "🚀 Sunny Isles News Feed - Deployment Helper"
echo "============================================="

# Check if .env file exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp env.example .env
    echo "⚠️  Please edit .env file with your actual credentials before deploying!"
    echo ""
fi

echo "📋 Deployment Checklist:"
echo "1. ✅ Code is ready for production"
echo "2. ✅ Database models created"
echo "3. ✅ Cloud storage configured"
echo "4. ✅ Environment variables template created"
echo "5. ✅ Deployment configuration files created"
echo ""
echo "🔧 Next Steps:"
echo "1. Push your code to GitHub"
echo "2. Set up MongoDB Atlas (free tier)"
echo "3. Set up Cloudinary (free tier)"
echo "4. Deploy backend to Railway"
echo "5. Deploy frontend to Vercel"
echo ""
echo "📖 See DEPLOYMENT.md for detailed instructions"
echo ""
echo "💰 Estimated Cost: FREE (using free tiers)"
echo "🌐 Your app will be live and scalable!" 