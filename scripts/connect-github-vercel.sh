#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

REPO_NAME="${1:-grandeflix}"

echo "→ GRANDEFLIX — GitHub + Vercel setup"
echo "   Project: $ROOT"
echo ""

if ! command -v gh >/dev/null 2>&1; then
  echo "Install GitHub CLI: brew install gh"
  exit 1
fi

if ! command -v vercel >/dev/null 2>&1; then
  echo "Install Vercel CLI: npm i -g vercel"
  exit 1
fi

if ! gh auth status >/dev/null 2>&1; then
  echo "Log in to GitHub (browser will open)…"
  gh auth login -h github.com -p https -w
fi

if [ ! -d .git ]; then
  git init -b main
fi

if ! git rev-parse HEAD >/dev/null 2>&1; then
  git add .
  git commit -m "Initial commit — GRANDEFLIX streaming platform"
fi

if git remote get-url origin >/dev/null 2>&1; then
  echo "→ Remote origin already set: $(git remote get-url origin)"
else
  echo "→ Creating GitHub repo: $REPO_NAME"
  gh repo create "$REPO_NAME" --source=. --public --remote=origin --push --description "GRANDEFLIX — free fan-made cinema streaming"
fi

echo ""
echo "→ GitHub done. Connect Vercel for auto-deploy on every push:"
echo ""
echo "  Option 1 (recommended): https://vercel.com/new"
echo "    • Import the repo: $(gh repo view --json nameWithOwner -q .nameWithOwner 2>/dev/null || echo "YOUR_USER/$REPO_NAME")"
echo "    • Add env vars: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, NEXT_PUBLIC_SITE_URL"
echo "    • Deploy — future pushes to main auto-deploy"
echo ""
echo "  Option 2 (CLI):"
echo "    vercel login"
echo "    vercel link"
echo "    vercel env add NEXT_PUBLIC_SUPABASE_URL"
echo "    vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY"
echo "    vercel env add NEXT_PUBLIC_SITE_URL"
echo "    vercel --prod"
echo ""
echo "  Supabase → Auth → URL Configuration:"
echo "    Site URL: https://YOUR-APP.vercel.app"
echo "    Redirect: https://YOUR-APP.vercel.app/auth/callback"
echo ""

if vercel whoami >/dev/null 2>&1; then
  read -r -p "Link this folder to Vercel now? [y/N] " LINK
  if [[ "${LINK,,}" == "y" ]]; then
    vercel link
    echo "Open Vercel dashboard → Project → Git → Connect Git Repository if not already linked."
  fi
else
  echo "Run 'vercel login' when ready to link the CLI."
fi

echo "Done."
