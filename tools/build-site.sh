#!/usr/bin/env bash
# Builds the Vite storefront into public/site and copies static assets next to it.
set -e
cd "$(dirname "$0")/.."
npx vite build
for f in favicon.svg karambo.png elzoghbi-emblem.webp elzoghbi-logo-full.webp robots.txt; do
  [ -f "public/$f" ] && cp "public/$f" "public/site/$f"
done
echo '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>https://elzoghbi.market-h.com/</loc></url></urlset>' > public/site/sitemap.xml
