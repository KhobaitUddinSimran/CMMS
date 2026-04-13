# GitHub Actions Secrets Configuration

Configure these secrets in your GitHub repository for MCP integration.

## Setting Up Secrets

### Option 1: Via GitHub Web Interface (Recommended for beginners)

1. Go to **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**
3. Add each secret below with its value
4. Click **Add secret**

### Option 2: Via GitHub CLI

```bash
# Install GitHub CLI: https://cli.github.com

# Login to GitHub
gh auth login

# Add secrets
gh secret set GITHUB_TOKEN --body "your-token-value"
gh secret set JIRA_HOST --body "https://your-company.atlassian.net"
gh secret set JIRA_EMAIL --body "your-email@example.com"
gh secret set JIRA_API_TOKEN --body "your-token-value"
```

---

## Required Secrets

### GITHUB_TOKEN

**Purpose**: Authenticate with GitHub API  
**Scope**: `repo`, `read:org`, `read:user`, `workflow`

```
Type: Personal Access Token (Classic)
Value: ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Get it**: https://github.com/settings/tokens

---

### JIRA_HOST

**Purpose**: Jira instance URL  
**Example**: `https://your-company.atlassian.net`

```
Type: Plain text
Value: https://your-company.atlassian.net
```

---

### JIRA_EMAIL

**Purpose**: Email of Jira account  
**Example**: `your-email@example.com`

```
Type: Plain text
Value: your-email@example.com
```

---

### JIRA_API_TOKEN

**Purpose**: Authenticate with Jira API  

```
Type: API Token
Value: xxxxxxxxxxxxxxxxxxxx
```

**Get it**: https://id.atlassian.com/manage-profile/security/api-tokens

---

## Verification

After adding secrets, verify they're set:

```bash
# List all repository secrets (names only, not values)
gh secret list
```

Output should show:
```
GITHUB_TOKEN
JIRA_API_TOKEN
JIRA_EMAIL
JIRA_HOST
```

---

## Using Secrets in Workflows

Reference secrets in GitHub Actions workflows:

```yaml
env:
  JIRA_HOST: ${{ secrets.JIRA_HOST }}
  JIRA_EMAIL: ${{ secrets.JIRA_EMAIL }}
  JIRA_API_TOKEN: ${{ secrets.JIRA_API_TOKEN }}
```

---

## ⚠️ Security Notes

- ✅ GitHub masks secret values in logs
- ✅ Secrets only available to authenticated workflows
- ✅ Each secret can be rotated independently
- ✅ Never print secrets directly (use masking)
- ❌ Don't hardcode tokens in workflow files
- ❌ Don't expose secrets to pull requests from forks

### Checking Logs

```bash
# View workflow run logs
gh run view <run-id> --log

# Secrets will appear as: ***
```

---

## Testing Workflow Access

After setting secrets, run the integration workflow:

```bash
# Push a branch with CMMS-123 in name
git checkout -b feature/CMMS-123-test
git push origin feature/CMMS-123-test

# Create a pull request
# The workflow should automatically run and:
# 1. Extract CMMS-123 from branch name
# 2. Link to Jira issue CMMS-123
# 3. Post summary with links
```

---

## Troubleshooting

### Workflow Fails with "Unrecognized named-value"

**Problem**: Secret name doesn't exist  
**Solution**: Verify secret name matches exactly (case-sensitive)

```yaml
# ✅ Correct
env:
  JIRA_HOST: ${{ secrets.JIRA_HOST }}

# ❌ Wrong
env:
  JIRA_HOST: ${{ secrets.jira_host }}
```

### Workflow Runs but "Secret not found"

**Problem**: Secret not passed to job  
**Solution**: Add `env` section to workflow:

```yaml
jobs:
  sync:
    runs-on: ubuntu-latest
    env:
      JIRA_HOST: ${{ secrets.JIRA_HOST }}
    steps:
      - run: echo "Host: $JIRA_HOST"
```

### Can't Access Secret in Fork

**Answer**: Forks can't access parent repository secrets  
**Solution**: User must set up their own secrets or use trusted collaborators

---

## Rotating Secrets

### When to Rotate

- Quarterly (best practice)
- If the token is exposed
- When changing Jira/GitHub accounts
- After employee departure

### How to Rotate

1. **Create new token** (GitHub/Jira)
2. **Update secret** in GitHub (overwrites old value)
3. **Test workflow** runs successfully
4. **Revoke old token** (GitHub/Jira)

```bash
# Example: Rotate JIRA_API_TOKEN
# 1. Create new token in: https://id.atlassian.com/manage-profile/security/api-tokens
# 2. Update secret:
gh secret set JIRA_API_TOKEN --body "new-token-value"
# 3. Revoke old token in Jira UI
```

---

## Available Secrets Reference

| Secret Name | Required | Type | Where to Get |
|-------------|----------|------|--------------|
| `GITHUB_TOKEN` | ✅ | GitHub PAT | https://github.com/settings/tokens |
| `JIRA_HOST` | ✅ | URL | Jira login page |
| `JIRA_EMAIL` | ✅ | Email | Your Atlassian account |
| `JIRA_API_TOKEN` | ✅ | Jira PAT | https://id.atlassian.com/manage-profile/security/api-tokens |

---

## Complete Setup Checklist

- [ ] Create GitHub PAT (Settings → Tokens)
- [ ] Create Jira API token (Atlassian account)
- [ ] Add GITHUB_TOKEN secret to repo
- [ ] Add JIRA_HOST secret to repo
- [ ] Add JIRA_EMAIL secret to repo
- [ ] Add JIRA_API_TOKEN secret to repo
- [ ] Verify secrets appear in secret list
- [ ] Push test branch with CMMS-123 format
- [ ] Monitor workflow run
- [ ] Check GitHub Actions logs (should not show tokens)
- [ ] Verify Jira issue was updated

---

**Status**: Secrets configuration guide  
**Last Updated**: April 13, 2026
