#!/bin/bash

# GitHub Repository Setup Script (CMMS)
# This is a utility script to create/configure the CMMS repository on GitHub
# 
# IMPORTANT: This script requires a valid GitHub Personal Access Token
# Set your token via environment variable before running:
#   export GITHUB_TOKEN="your-github-pat-here"
#
# GitHub PAT should have these scopes:
#   - repo (full control of repositories)
#   - delete_repo (if you want to delete repos)

if [ -z "$GITHUB_TOKEN" ]; then
  echo "❌ Error: GITHUB_TOKEN environment variable not set"
  echo "Please set your GitHub Personal Access Token:"
  echo "  export GITHUB_TOKEN=\"your-github-pat-here\""
  exit 1
fi

echo "========================================================================"
echo "  CMMS GitHub Repository Setup"
echo "========================================================================"
echo ""

# Check if repo exists
echo "🔍 Checking for existing repository..."
REPO_CHECK=$(curl -s -H "Authorization: Bearer ${GITHUB_TOKEN}" \
  https://api.github.com/repos/KhobaitUddinSimran/cmms)

if echo "$REPO_CHECK" | grep -q '"id":'; then
  REPO_ID=$(echo "$REPO_CHECK" | grep -o '"id":[0-9]*' | head -1 | grep -o '[0-9]*')
  echo "✅ Repository already exists (ID: $REPO_ID)"
  echo ""
  echo "Repository Details:"
  echo "  URL: https://github.com/KhobaitUddinSimran/CMMS"
  echo "  Clone: git clone https://github.com/KhobaitUddinSimran/CMMS.git"
else
  echo "📝 Repository not found, attempting to create..."
  # Create repository
  CREATE_RESPONSE=$(curl -s -X POST \
    -H "Authorization: Bearer ${GITHUB_TOKEN}" \
    -H "Accept: application/vnd.github+json" \
    https://api.github.com/user/repos \
    -d '{"name":"CMMS","description":"Carry Mark Management System","private":false,"is_template":false}')
  
  if echo "$CREATE_RESPONSE" | grep -q '"id":'; then
    echo "✅ Repository created successfully!"
    REPO_URL=$(echo "$CREATE_RESPONSE" | grep -o '"clone_url":"[^"]*' | cut -d'"' -f4)
    echo "  URL: $REPO_URL"
  else
    echo "❌ Failed to create repository"
    echo "$CREATE_RESPONSE"
    exit 1
  fi
fi

echo ""
echo "========================================================================"
echo "✅ GitHub setup complete!"
echo "========================================================================"
