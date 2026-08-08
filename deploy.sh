#!/bin/bash
set -e

# Configuration
PROJECT_ID="digim-496018"
REGION="us-central1"
BACKEND_IMAGE="us-central1-docker.pkg.dev/$PROJECT_ID/marketflow-repo/backend"
FRONTEND_IMAGE="us-central1-docker.pkg.dev/$PROJECT_ID/marketflow-repo/frontend"

# Git commit message from argument or default
COMMIT_MSG=${1:-"Update campaign dashboard presets and admin know-how"}

echo "=== 1. Git Status & Push ==="
git status

if ! git diff-index --quiet HEAD --; then
  echo "Changes detected, staging and committing..."
  git add .
  git commit -m "$COMMIT_MSG"
  git push origin main
else
  echo "No uncommitted local changes."
fi

echo "=== 2. Building & Deploying Backend ==="
gcloud builds submit --tag "$BACKEND_IMAGE" ./backend --project="$PROJECT_ID"
gcloud run deploy backend \
  --image "$BACKEND_IMAGE" \
  --region "$REGION" \
  --project "$PROJECT_ID" \
  --set-env-vars GCS_BUCKET_NAME="marketflow-assets-digim-496018" \
  --allow-unauthenticated

# Retrieve the backend URL dynamically to bake it into the frontend
BACKEND_URL=$(gcloud run services describe backend --region="$REGION" --project="$PROJECT_ID" --format='value(status.url)')
echo "Backend service is live at: $BACKEND_URL"

echo "=== 3. Building & Deploying Frontend ==="
gcloud builds submit --config ./frontend/cloudbuild.yaml \
  --substitutions _NEXT_PUBLIC_META_APP_ID="3531281670380966",_NEXT_PUBLIC_GOOGLE_CLIENT_ID="980545668366-1bbf1cipl6eps71rog3riakp60jvrium.apps.googleusercontent.com",_BACKEND_URL="$BACKEND_URL" \
  ./frontend \
  --project="$PROJECT_ID"

gcloud run deploy frontend \
  --image "$FRONTEND_IMAGE" \
  --region "$REGION" \
  --project "$PROJECT_ID" \
  --port 8080 \
  --allow-unauthenticated

# Complete URLs
FRONTEND_URL=$(gcloud run services describe frontend --region="$REGION" --project="$PROJECT_ID" --format='value(status.url)')
echo "============================================="
echo "Deployment Successful!"
echo "Backend URL:  $BACKEND_URL"
echo "Frontend URL: $FRONTEND_URL"
echo "============================================="
