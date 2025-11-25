#!/bin/bash

# Mercado Libre NestJS API - Quick Setup Script

echo "🚀 Setting up Mercado Libre NestJS API..."
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js >= 18.x first."
    exit 1
fi

echo "✅ Node.js version: $(node -v)"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ npm version: $(npm -v)"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "✅ Dependencies installed successfully"
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "✅ .env file created"
    echo ""
    echo "⚠️  IMPORTANT: Please edit the .env file and add your Mercado Libre credentials:"
    echo "   - ML_CLIENT_ID"
    echo "   - ML_CLIENT_SECRET"
    echo "   - ML_REDIRECT_URI"
    echo ""
    echo "   Get your credentials at: https://developers.mercadolibre.com/"
    echo ""
else
    echo "✅ .env file already exists"
    echo ""
fi

# Show next steps
echo "🎉 Setup complete!"
echo ""
echo "📚 Next steps:"
echo "   1. Edit .env file with your Mercado Libre credentials"
echo "   2. Run: npm run start:dev"
echo "   3. Visit: http://localhost:3000/docs"
echo "   4. Click 'GET /api/auth/login' to authenticate"
echo ""
echo "📖 For more information, see README.md"
echo ""
