#!/bin/bash

# CMMS Jira Setup Script
# This is a utility script to create/configure the CMMS project in Jira
#
# IMPORTANT: This script requires valid Jira credentials
# Set your credentials via environment variables before running:
#   export JIRA_HOST="https://your-instance.atlassian.net"
#   export JIRA_EMAIL="your-email@example.com"  
#   export JIRA_TOKEN="your-jira-api-token"
#
# To generate a Jira API token:
# 1. Log in to https://id.atlassian.com/manage/api-tokens
# 2. Create new token
# 3. Copy and use in JIRA_TOKEN

if [ -z "$JIRA_HOST" ] || [ -z "$JIRA_EMAIL" ] || [ -z "$JIRA_TOKEN" ]; then
  echo "❌ Error: Jira environment variables not set"
  echo "Please set your Jira credentials:"
  echo "  export JIRA_HOST=\"https://your-instance.atlassian.net\""
  echo "  export JIRA_EMAIL=\"your-email@example.com\""
  echo "  export JIRA_TOKEN=\"your-api-token\""
  exit 1
fi

# Base64 encode credentials for Basic Auth
JIRA_AUTH=$(echo -n "${JIRA_EMAIL}:${JIRA_TOKEN}" | base64)

echo "========================================================================"
echo "  CMMS JIRA Project Setup"
echo "========================================================================"
echo ""

# Check if project exists
echo "📊 Checking for existing CMMS project..."
PROJ_CHECK=$(curl -s -H "Authorization: Basic ${JIRA_AUTH}" \
  "${JIRA_HOST}/rest/api/3/projects/CMMS")

if echo "$PROJ_CHECK" | grep -q '"key":"CMMS"'; then
  PROJ_ID=$(echo "$PROJ_CHECK" | grep -o '"id":"[^"]*' | cut -d'"' -f4)
  echo "✅ Project already exists (ID: $PROJ_ID)"
  echo ""
  echo "Project Details:"
  echo "  Key: CMMS"
  echo "  URL: ${JIRA_HOST}/browse/CMMS"
else
  echo "📝 Project not found. Check JIRA_HOST and credentials."
  echo ""
  echo "Manual Setup Instructions:"
  echo "1. Log in to: ${JIRA_HOST}"
  echo "2. Create new Scrum Project"
  echo "3. Set Project Key to: CMMS"
  echo "4. Configure sprints and stories as needed"
  echo ""
  exit 1
fi

echo ""
echo "========================================================================"
echo "✅ Jira setup verified!"
echo "========================================================================"
