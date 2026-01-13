#!/usr/bin/env bash
# Quick Setup Script Guide
# Run after updating .env.local with your credentials

echo "🚀 Starting Project001..."
echo ""

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "❌ .env.local not found!"
    echo "📋 Please create .env.local with your Supabase credentials:"
    echo ""
    echo "   NEXT_PUBLIC_SUPABASE_URL=your_url_here"
    echo "   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key_here"
    echo ""
    echo "📖 See README_QUICK_START.md for details"
    exit 1
fi

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    pnpm install
    echo ""
fi

# Start development server
echo "✅ Starting development server..."
echo "🌐 Open http://localhost:3000 in your browser"
echo ""
pnpm dev

echo ""
echo "✨ Done!"
