#!/bin/bash

# MCP Integration Verification Script
# Verifies GitHub and Jira connections are working

set -e

echo "🔍 MCP Integration Verification"
echo "======================================"
echo ""

# Check if .mcp.env exists
if [ ! -f .mcp.env ]; then
    echo "❌ .mcp.env not found"
    echo "   Please copy .mcp.env.example to .mcp.env and add your credentials"
    exit 1
fi

# Load environment variables
source .mcp.env

# ============================================================================
# Check GitHub Configuration
# ============================================================================
echo "📦 Checking GitHub Configuration..."

if [ -z "$GITHUB_TOKEN" ]; then
    echo "❌ GITHUB_TOKEN not set in .mcp.env"
    exit 1
fi

if [ -z "$GITHUB_REPOSITORY" ]; then
    echo "❌ GITHUB_REPOSITORY not set in .mcp.env"
    exit 1
fi

echo "✓ GitHub token configured"
echo "✓ Repository: $GITHUB_REPOSITORY"

# Test GitHub API
echo ""
echo "Testing GitHub API connection..."
GITHUB_USER=$(curl -s -H "Authorization: token $GITHUB_TOKEN" https://api.github.com/user | grep -o '"login":"[^"]*' | cut -d'"' -f4)

if [ -z "$GITHUB_USER" ]; then
    echo "❌ GitHub API test failed - invalid token"
    exit 1
fi

echo "✅ GitHub API connection successful"
echo "   Authenticated as: $GITHUB_USER"

# Test repository access
echo ""
echo "Testing repository access..."
REPO_NAME=$(curl -s -H "Authorization: token $GITHUB_TOKEN" https://api.github.com/repos/$GITHUB_REPOSITORY | grep -o '"name":"[^"]*' | cut -d'"' -f4)

if [ -z "$REPO_NAME" ]; then
    echo "❌ Repository not found: $GITHUB_REPOSITORY"
    exit 1
fi

echo "✅ Repository access successful"
echo "   Repository: $REPO_NAME"

# ============================================================================
# Check Jira Configuration
# ============================================================================
echo ""
echo "📋 Checking Jira Configuration..."

if [ -z "$JIRA_HOST" ]; then
    echo "❌ JIRA_HOST not set in .mcp.env"
    exit 1
fi

if [ -z "$JIRA_EMAIL" ]; then
    echo "❌ JIRA_EMAIL not set in .mcp.env"
    exit 1
fi

if [ -z "$JIRA_API_TOKEN" ]; then
    echo "❌ JIRA_API_TOKEN not set in .mcp.env"
    exit 1
fi

if [ -z "$JIRA_PROJECT_KEY" ]; then
    echo "❌ JIRA_PROJECT_KEY not set in .mcp.env"
    exit 1
fi

echo "✓ Jira host: $JIRA_HOST"
echo "✓ Jira email: $JIRA_EMAIL"
echo "✓ Project key: $JIRA_PROJECT_KEY"

# Test Jira API
echo ""
echo "Testing Jira API connection..."
AUTH_HEADER=$(echo -n "$JIRA_EMAIL:$JIRA_API_TOKEN" | base64)

JIRA_USER=$(curl -s -H "Authorization: Basic $AUTH_HEADER" \
    "$JIRA_HOST/rest/api/3/myself" | grep -o '"displayName":"[^"]*' | cut -d'"' -f4)

if [ -z "$JIRA_USER" ]; then
    echo "❌ Jira API test failed - invalid credentials"
    exit 1
fi

echo "✅ Jira API connection successful"
echo "   Authenticated as: $JIRA_USER"

# Test project access
echo ""
echo "Testing project access..."
PROJECT_NAME=$(curl -s -H "Authorization: Basic $AUTH_HEADER" \
    "$JIRA_HOST/rest/api/3/project/$JIRA_PROJECT_KEY" | grep -o '"name":"[^"]*' | cut -d'"' -f4)

if [ -z "$PROJECT_NAME" ]; then
    echo "❌ Project not found: $JIRA_PROJECT_KEY"
    exit 1
fi

echo "✅ Project access successful"
echo "   Project: $PROJECT_NAME"

# ============================================================================
# Get Project Statistics
# ============================================================================
echo ""
echo "📊 Project Statistics"
echo "======================================"

# GitHub stats
ISSUES_COUNT=$(curl -s -H "Authorization: token $GITHUB_TOKEN" \
    "https://api.github.com/repos/$GITHUB_REPOSITORY/issues?state=all&per_page=1" \
    -I | grep -i "link:" | wc -l)

echo "GitHub:"
echo "  Repository: $REPO_NAME"
echo "  URL: https://github.com/$GITHUB_REPOSITORY"

# Jira stats
ISSUES_COUNT=$(curl -s -H "Authorization: Basic $AUTH_HEADER" \
    "$JIRA_HOST/rest/api/3/search?jql=project=$JIRA_PROJECT_KEY&maxResults=1" \
    | grep -o '"total":[0-9]*' | cut -d':' -f2)

echo ""
echo "Jira:"
echo "  Project: $PROJECT_NAME ($JIRA_PROJECT_KEY)"
echo "  Total Issues: ${ISSUES_COUNT:-0}"
echo "  URL: $JIRA_HOST/browse/$JIRA_PROJECT_KEY"

# ============================================================================
# Summary
# ============================================================================
echo ""
echo "======================================"
echo "✅ MCP Integration Verification Complete"
echo ""
echo "Next steps:"
echo "1. Configure GitHub Actions secrets"
echo "2. Set up webhook integrations"
echo "3. Test MCP tools in Cline/Claude"
echo ""
