#!/bin/bash
# Deploy Play Store proxy to Cloudflare Workers (free tier)
# Usage: cd worker && bash deploy.sh

set -e

echo "→ Installing wrangler..."
npm install

echo ""
echo "→ Deploying to Cloudflare Workers..."
npx wrangler deploy

echo ""
echo "✓ Done! Your worker URL will be shown above."
echo "  Copy it and paste into script.js → PLAY_STORE_WORKER constant"
