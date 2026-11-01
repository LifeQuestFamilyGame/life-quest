#!/usr/bin/env bash
# Build the site and publish dist/ to the gh-pages branch.
set -euo pipefail
cd "$(dirname "$0")"
npm test --silent
npx vite build
REMOTE=$(git remote get-url origin)
TMP=$(mktemp -d)
cp -r dist/. "$TMP"/
cd "$TMP"
git init -q -b gh-pages
git add -A
git -c user.name="Claude" -c user.email="noreply@anthropic.com" commit -q -m "Publish Life Quest $(date -u +%Y-%m-%dT%H:%MZ)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
git push -q -f "$REMOTE" gh-pages
echo "Published to gh-pages"
