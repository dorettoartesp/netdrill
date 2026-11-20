#!/usr/bin/env bash
set -euo pipefail

# ==============================================================================
# NetDrill Zero-Touch Automated Production Deployment Script
# Provisions serverless database on Turso and deploys Next.js app to Vercel.
# ==============================================================================

echo "=== [1/5] Checking Tooling and CLI Prerequisites ==="

# Check Turso CLI
TURSO_BIN="turso"
if ! command -v turso >/dev/null 2>&1; then
  if [[ -x "${HOME}/.turso/turso" ]]; then
    TURSO_BIN="${HOME}/.turso/turso"
  else
    echo "Turso CLI not found in PATH or ${HOME}/.turso. Installing..."
    curl -sSfL https://get.tur.so/install.sh | bash
    TURSO_BIN="${HOME}/.turso/turso"
  fi
fi

# Check Turso authentication
if "${TURSO_BIN}" auth whoami 2>&1 | grep -qi "not logged in"; then
  echo ""
  echo "⚠️  Turso CLI is not authenticated."
  echo "Please run: ${TURSO_BIN} auth login (or '${TURSO_BIN} auth login --headless' if running remotely)"
  echo "Or set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN directly in your environment."
  exit 1
fi

# Check Vercel CLI authentication
if ! npx -y vercel whoami >/dev/null 2>&1; then
  echo ""
  echo "⚠️  Vercel CLI is not authenticated."
  echo "Please run: npx vercel login"
  echo "Or set VERCEL_TOKEN in your environment."
  exit 1
fi

echo "✓ Turso and Vercel CLIs authenticated successfully."

echo "=== [2/5] Provisioning Turso Serverless Database ==="
DB_NAME="netdrill-prd"

# Create database if it does not already exist
if ! "${TURSO_BIN}" db show "${DB_NAME}" >/dev/null 2>&1; then
  echo "Creating Turso database '${DB_NAME}'..."
  "${TURSO_BIN}" db create "${DB_NAME}"
else
  echo "Turso database '${DB_NAME}' already exists."
fi

REMOTE_TURSO_URL=$("${TURSO_BIN}" db show "${DB_NAME}" --url)
REMOTE_TURSO_TOKEN=$("${TURSO_BIN}" db tokens create "${DB_NAME}")

echo "✓ Turso Database URL: ${REMOTE_TURSO_URL}"

echo "=== [3/5] Applying Schema Migrations & Seeding Remote Database ==="
TURSO_DATABASE_URL="${REMOTE_TURSO_URL}" TURSO_AUTH_TOKEN="${REMOTE_TURSO_TOKEN}" npm run db:seed

echo "=== [4/5] Configuring Vercel Project & Environment Variables ==="
# Link project non-interactively
npx -y vercel link --yes

# Set Production Environment Variables
APP_PASS="${APP_PASSWORD:-havaianas}"
GEN_SECRET=$(openssl rand -hex 32 2>/dev/null || date +%s%N | sha256sum | awk '{print $1}')

echo "Setting TURSO_DATABASE_URL..."
npx -y vercel env add TURSO_DATABASE_URL production "${REMOTE_TURSO_URL}" --force 2>/dev/null || \
  echo "${REMOTE_TURSO_URL}" | npx -y vercel env add TURSO_DATABASE_URL production

echo "Setting TURSO_AUTH_TOKEN..."
npx -y vercel env add TURSO_AUTH_TOKEN production "${REMOTE_TURSO_TOKEN}" --force 2>/dev/null || \
  echo "${REMOTE_TURSO_TOKEN}" | npx -y vercel env add TURSO_AUTH_TOKEN production

echo "Setting APP_PASSWORD..."
npx -y vercel env add APP_PASSWORD production "${APP_PASS}" --force 2>/dev/null || \
  echo "${APP_PASS}" | npx -y vercel env add APP_PASSWORD production

echo "Setting SESSION_SECRET..."
npx -y vercel env add SESSION_SECRET production "${GEN_SECRET}" --force 2>/dev/null || \
  echo "${GEN_SECRET}" | npx -y vercel env add SESSION_SECRET production

echo "=== [5/5] Deploying to Vercel Production ==="
DEPLOY_OUTPUT=$(npx -y vercel --prod --yes)
echo "${DEPLOY_OUTPUT}"

PROD_URL=$(echo "${DEPLOY_OUTPUT}" | grep -Eo 'https://[^ ]+\.vercel\.app' | tail -n 1)

if [[ -n "${PROD_URL}" ]]; then
  echo ""
  echo "================================================================================"
  echo "🚀 NetDrill successfully deployed to production!"
  echo "Live URL: ${PROD_URL}"
  echo "Login Password: ${APP_PASS}"
  echo "================================================================================"

  echo "Performing smoke test on ${PROD_URL}..."
  HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "${PROD_URL}")
  echo "HTTP Response Status: ${HTTP_STATUS}"
  if [[ "${HTTP_STATUS}" == "200" || "${HTTP_STATUS}" == "307" || "${HTTP_STATUS}" == "308" ]]; then
    echo "✓ Smoke test passed! Application is responsive."
  else
    echo "⚠️ Smoke test returned HTTP status: ${HTTP_STATUS}"
  fi
else
  echo "⚠️ Deployment succeeded, but failed to extract the production URL automatically."
fi
