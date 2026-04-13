# MCP (Model Context Protocol) Server Configuration Guide

**Project**: CMMS (Carry Mark Management System)  
**Integrations**: GitHub + Jira

---

## Table of Contents

1. [Overview](#overview)
2. [GitHub Setup](#github-setup)
3. [Jira Setup](#jira-setup)
4. [Configuration Files](#configuration-files)
5. [Testing Integration](#testing-integration)
6. [Available Tools](#available-tools)
7. [Troubleshooting](#troubleshooting)

---

## Overview

MCP servers enable AI tools and agents to interact with external services. This guide configures:
- **GitHub**: Repository management, PR/issue automation
- **Jira**: Project tracking, sprint management

### Benefits

- ✅ Create GitHub issues/PRs programmatically
- ✅ Query Jira stories and sprints
- ✅ Automated workflow between GitHub and Jira
- ✅ Progress tracking and reporting
- ✅ CI/CD automation triggers

---

## GitHub Setup

### Step 1: Create GitHub Personal Access Token

1. Go to **[github.com/settings/tokens](https://github.com/settings/tokens)**
2. Click "Generate new token (classic)"
3. Give it a name: `CMMS-MCP-Token`
4. Set expiration: 90 days (or custom)
5. **Select scopes** (minimum):
   ```
   ✓ repo (full control of repositories)
   ✓ read:org (read organization data)
   ✓ read:user (read user profile)
   ✓ workflow (manage GitHub Actions)
   ```
6. Click "Generate token"
7. **Copy the token immediately** (can't see it again)

### Step 2: Store Token Securely

```bash
# Create .mcp.env from template
cp .mcp.env.example .mcp.env

# Edit and add your GitHub token
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
GITHUB_REPOSITORY=utmcsj/cmms
```

### Step 3: Verify Configuration

```bash
# Test GitHub connection
curl -H "Authorization: token YOUR_TOKEN" https://api.github.com/user
```

Expected response: Your GitHub user profile JSON

---

## Jira Setup

### Step 1: Create Jira API Token

1. Go to **[id.atlassian.com/manage-profile/security/api-tokens](https://id.atlassian.com/manage-profile/security/api-tokens)**
2. Click "Create API token"
3. Give it a label: `CMMS-MCP-Token`
4. Click "Create"
5. **Copy the token immediately**

### Step 2: Get Your Jira Instance URL & Email

- **Jira Host**: `https://your-company.atlassian.net` (from login URL)
- **Email**: Your Atlassian account email

### Step 3: Store Credentials

Edit `.mcp.env`:

```bash
JIRA_HOST=https://your-company.atlassian.net
JIRA_EMAIL=your-email@example.com
JIRA_API_TOKEN=your-api-token-here
JIRA_PROJECT_KEY=CMMS
```

### Step 4: Verify Configuration

```bash
# Test Jira connection
curl -X GET \
  -H "Authorization: Basic $(echo -n 'JIRA_EMAIL:JIRA_API_TOKEN' | base64)" \
  https://your-company.atlassian.net/rest/api/3/myself
```

Expected response: Your Jira profile JSON

---

## Configuration Files

### `.mcp.json` (MCP Server Configuration)

Defines which MCP servers to run and their configuration:

```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["mcp-github"],
      "env": {
        "GITHUB_TOKEN": "${GITHUB_TOKEN}",
        "GITHUB_REPOSITORY": "utmcsj/cmms"
      }
    },
    "jira": {
      "command": "npx",
      "args": ["mcp-jira"],
      "env": {
        "JIRA_HOST": "${JIRA_HOST}",
        "JIRA_EMAIL": "${JIRA_EMAIL}",
        "JIRA_API_TOKEN": "${JIRA_API_TOKEN}",
        "JIRA_PROJECT_KEY": "CMMS"
      }
    }
  }
}
```

### `.mcp.env` (Secrets - NOT in git)

```bash
GITHUB_TOKEN=ghp_xxxx...
GITHUB_REPOSITORY=utmcsj/cmms

JIRA_HOST=https://your-company.atlassian.net
JIRA_EMAIL=your@email.com
JIRA_API_TOKEN=xxxx...
JIRA_PROJECT_KEY=CMMS
```

**⚠️ SECURITY**: Never commit `.mcp.env` to git. It's in `.gitignore`.

---

## Testing Integration

### Test GitHub Connection

```bash
# List repository issues
# (with MCP client configured)
gh_list_issues()  # If using GitHub MCP tool

# Create test issue
gh_create_issue --title "Test MCP Integration" --body "Testing GitHub MCP"

# List pull requests
gh_list_pull_requests()
```

### Test Jira Connection

```bash
# List project issues
jira_get_issues --project CMMS --limit 10

# Get sprint information
jira_get_sprints --project CMMS

# Create test issue  
jira_create_issue \
  --project CMMS \
  --issuetype Task \
  --summary "Test MCP Integration" \
  --description "Testing Jira MCP configuration"
```

---

## Available Tools

### GitHub Tools (via mcp-github)

| Tool | Purpose |
|------|---------|
| `search_repositories` | Search GitHub repositories |
| `search_issues` | Search issues/PRs |
| `get_issue` | Get specific issue details |
| `create_issue` | Create new issue |
| `create_pull_request` | Create new PR |
| `list_pull_requests` | List PRs (open/closed/all) |
| `get_pull_request` | Get PR details |
| `create_review` | Review a PR |
| `search_code` | Search within repository |
| `get_file_contents` | Read file from repo |

### Jira Tools (via mcp-jira)

| Tool | Purpose |
|------|---------|
| `get_issues` | Query issues with JQL |
| `get_issue` | Get specific issue details |
| `create_issue` | Create new issue |
| `update_issue` | Update issue fields |
| `get_sprints` | List project sprints |
| `get_board` | Get board information |
| `get_user` | Get user information |
| `search_users` | Find users in Jira |
| `add_comment` | Add comment to issue |
| `transition_issue` | Move issue to new status |

---

## Workflow Examples

### Example 1: GitHub PR to Jira Story

**Workflow**: When PR is merged, automatically update linked Jira story

```bash
# 1. Create GitHub PR with commit message
git commit -m "CMMS-123: Implement Smart Grid"
git push origin feature/smart-grid

# 2. Create PR and link to Jira
gh_create_pull_request \
  --title "Implement Smart Grid (CMMS-123)" \
  --body "Fixes CMMS-123"

# 3. When PR merged, updated Jira story
jira_transition_issue \
  --issue CMMS-123 \
  --transition "Done"
```

### Example 2: Create GitHub Issues from Jira Stories

```bash
# Get all Jira stories in current sprint
jira_get_issues \
  --project CMMS \
  --sprint "Sprint 1" \
  --status "To Do"

# For each story, create GitHub issue
gh_create_issue \
  --title "CMMS-123: Implement authentication" \
  --body "Jira: https://jira.atlassian.net/browse/CMMS-123"
```

### Example 3: Automated PR Reviews

```bash
# When PR created, get Jira context
jira_get_issue --issue CMMS-123

# Provide review with context
gh_create_review \
  --pull_request <pr_number> \
  --event COMMENT \
  --body "Reviewed against requirement in CMMS-123"
```

---

## Troubleshooting

### GitHub Token Issues

**Problem**: "Bad credentials"
```bash
# Solution: Verify token is valid and not expired
curl -H "Authorization: token YOUR_TOKEN" https://api.github.com/user
# Should return your user profile
```

**Problem**: "Repository not found"
```bash
# Solution: Check GITHUB_REPOSITORY format
# Should be: owner/repo (e.g., utmcsj/cmms)
# Not: https://github.com/owner/repo
```

### Jira Token Issues

**Problem**: "Invalid API token"
```bash
# Solution: Create new token at:
# https://id.atlassian.com/manage-profile/security/api-tokens
```

**Problem**: "Unauthorized"
```bash
# Solution: Verify email matches Atlassian account
# And that project key is correct
curl -X GET \
  -H "Authorization: Basic $(echo -n 'email:token' | base64)" \
  https://your-company.atlassian.net/rest/api/3/myself
```

### Environment Variable Issues

**Problem**: MCP server won't start
```bash
# Solution: Check .mcp.env is created and readable
ls -l .mcp.env

# Verify variables are loaded
echo $GITHUB_TOKEN
echo $JIRA_HOST
```

---

## Security Best Practices

1. ✅ **Use machine accounts** for tokens when possible
2. ✅ **Set token expiration** (90 days recommended)
3. ✅ **Limit scopes** to minimum required
4. ✅ **Rotate tokens** regularly (quarterly)
5. ✅ **Never commit** `.mcp.env` to git
6. ✅ **Use `.gitignore`** entry: `.mcp.env`
7. ✅ **Monitor token usage** on GitHub/Jira dashboards
8. ✅ **Revoke immediately** if leaked

---

## Integration with CI/CD

### GitHub Actions

Add to `.github/workflows/jira-sync.yml`:

```yaml
name: Sync to Jira

on:
  pull_request:
    types: [opened, synchronize]

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Link PR to Jira
        env:
          JIRA_HOST: ${{ secrets.JIRA_HOST }}
          JIRA_EMAIL: ${{ secrets.JIRA_EMAIL }}
          JIRA_API_TOKEN: ${{ secrets.JIRA_API_TOKEN }}
        run: |
          # Extract Jira issue from branch name
          ISSUE_KEY=$(git symbolic-ref --short HEAD | grep -oE 'CMMS-[0-9]+')
          # Link PR in Jira comment
          echo "Linked to PR #${{ github.event.pull_request.number }}"
```

---

## Next Steps

1. **Generate tokens** (GitHub & Jira)
2. **Create `.mcp.env`** with credentials
3. **Test connections** with curl commands above
4. **Configure MCP client** (Claude, Cline, etc.)
5. **Test MCP tools** with simple queries
6. **Set up CI/CD integration** with workflows
7. **Monitor and rotate tokens** regularly

---

## Resources

- **GitHub API Docs**: https://docs.github.com/en/rest
- **GitHub Tokens**: https://github.com/settings/tokens
- **Jira API Docs**: https://developer.atlassian.com/cloud/jira/rest/intro/
- **Jira API Tokens**: https://id.atlassian.com/manage-profile/security/api-tokens
- **MCP Specification**: https://modelcontextprotocol.io/

---

**Status**: Configuration ready for development use  
**Last Updated**: April 13, 2026
