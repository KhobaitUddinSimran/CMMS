# MCP Integration Checklist

Complete this checklist to set up GitHub and Jira integration for the CMMS project.

## Phase 1: Token Generation (15 minutes)

### GitHub Personal Access Token

- [ ] Visit https://github.com/settings/tokens
- [ ] Click **Generate new token (classic)**
- [ ] Name: `CMMS-MCP-Token`
- [ ] Expiration: **90 days** (or your organization's policy)
- [ ] Select scopes:
  - [ ] `repo` (Full control of private repositories)
  - [ ] `read:org` (Read organization data)
  - [ ] `read:user` (Read user profile data)
  - [ ] `workflow` (Update GitHub Actions workflows)
- [ ] Click **Generate token**
- [ ] **Copy token immediately** (you won't see it again!)
- [ ] Save to secure location (password manager, etc.)

**Token Format**: `ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` (80+ characters)

### Jira API Token

- [ ] Visit https://id.atlassian.com/manage-profile/security/api-tokens
- [ ] Log in with your Atlassian account
- [ ] Click **Create API token**
- [ ] Label: `CMMS-MCP-Token`
- [ ] Click **Create**
- [ ] **Copy token immediately** (you won't see it again!)
- [ ] Save to secure location

**Token Format**: `xxxxxxxxxxxxxxxxxxxxxxxx` (24+ characters)

### Jira Host Information

- [ ] Get your Jira instance URL
  - [ ] Format: `https://{your-company}.atlassian.net`
  - [ ] Example: `https://acme-corp.atlassian.net`
  - [ ] Verify: Visit it in browser, should show Jira login

- [ ] Get your Jira email
  - [ ] Use email tied to your Atlassian account
  - [ ] Example: `john.doe@acme-corp.com`

- [ ] Verify CMMS project exists in Jira
  - [ ] Navigate to your Jira instance
  - [ ] Look for project with key **CMMS**
  - [ ] If not found: Create it (Projects → Create Project → CMMS)

---

## Phase 2: Create .mcp.env File (5 minutes)

### Copy Template

```bash
# In your project root:
cp .mcp.env.example .mcp.env
```

### Edit .mcp.env

Open `.mcp.env` in your editor and fill in:

```env
# GitHub Configuration
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
GITHUB_REPOSITORY=utmcsj/cmms

# Jira Configuration
JIRA_HOST=https://your-company.atlassian.net
JIRA_EMAIL=your-email@example.com
JIRA_API_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxx
JIRA_PROJECT_KEY=CMMS

# Optional: Webhook secrets (for bi-directional sync)
GITHUB_WEBHOOK_SECRET=your-secret-here
JIRA_WEBHOOK_SECRET=your-secret-here
```

### Verify .mcp.env is in .gitignore

```bash
# Check if .mcp.env is already ignored
grep "\.mcp\.env" .gitignore

# If not found, add it:
echo ".mcp.env" >> .gitignore
echo ".mcp.env.local" >> .gitignore
```

- [ ] `.mcp.env` added to `.gitignore`
- [ ] File is **NOT tracked** by git:
  ```bash
  git status
  # Should NOT list .mcp.env
  ```

---

## Phase 3: Test Local Configuration (10 minutes)

### Run Verification Script

```bash
# Source environment variables
source .mcp.env

# Run verification script
bash scripts/verify-mcp.sh
```

**Expected Output**:
```
✅ MCP Integration Verification Starting...

🔐 GitHub Configuration
  User: your-github-username
  Repos: 5
  ✅ GitHub API accessible

🔐 Jira Configuration  
  User: Your Name
  Email: your-email@example.com
  ✅ Jira API accessible

📊 CMMS Project Status
  Project: CMMS
  Open Issues: 12
  In Progress: 3
  Done: 45

✅ MCP Integration Verification Complete
```

- [ ] Script runs without errors
- [ ] GitHub API connection successful ✅
- [ ] Jira API connection successful ✅
- [ ] User information displays correctly
- [ ] Issue counts display correctly

### Troubleshooting Verification

| Error | Solution |
|-------|----------|
| `command not found: bash` | Use `sh scripts/verify-mcp.sh` instead |
| `GITHUB_TOKEN: command not found` | Ensure you ran `source .mcp.env` first |
| `401 Unauthorized` (GitHub) | Check GITHUB_TOKEN is correct, not expired |
| `401 Unauthorized` (Jira) | Verify JIRA_EMAIL and JIRA_API_TOKEN match |
| `404 Not Found` (Jira) | Check JIRA_HOST format and JIRA_PROJECT_KEY |

---

## Phase 4: GitHub Actions Setup (10 minutes)

### Create GitHub Repository

If you haven't already:

```bash
# Initialize git repo (if new)
git init

# Add remote
git remote add origin https://github.com/utmcsj/cmms.git

# Create main branch
git checkout -b main

# Push initial commit
git add .
git commit -m "Initial CMMS project setup"
git push -u origin main
```

- [ ] GitHub repository exists at `https://github.com/utmcsj/cmms`
- [ ] Repository is initialized and has commits
- [ ] You have **Admin** access to the repository

### Add GitHub Secrets

Using GitHub Web Interface:

1. Go to repository: https://github.com/utmcsj/cmms
2. Click **Settings** (top right)
3. Left sidebar: **Secrets and variables** → **Actions**
4. Click **New repository secret**

Add these 4 secrets:

**Secret 1: GITHUB_TOKEN**
- Name: `GITHUB_TOKEN`
- Value: `ghp_xxxx...` (from Phase 1)
- Click **Add secret**

**Secret 2: JIRA_HOST**
- Name: `JIRA_HOST`
- Value: `https://your-company.atlassian.net`
- Click **Add secret**

**Secret 3: JIRA_EMAIL**
- Name: `JIRA_EMAIL`
- Value: `your-email@example.com`
- Click **Add secret**

**Secret 4: JIRA_API_TOKEN**
- Name: `JIRA_API_TOKEN`
- Value: `xxxx...` (from Phase 1)
- Click **Add secret**

### Verify Secrets

```bash
# Using GitHub CLI (if installed)
gh secret list
```

- [ ] 4 secrets added to repository
- [ ] Secret values are **masked** in logs (not visible)
- [ ] All secret names match exactly:
  - [ ] `GITHUB_TOKEN`
  - [ ] `JIRA_HOST`
  - [ ] `JIRA_EMAIL`
  - [ ] `JIRA_API_TOKEN`

---

## Phase 5: Test GitHub Actions (15 minutes)

### Push a Test Branch

```bash
# Create test branch matching CMMS issue
git checkout -b CMMS-123-test-integration

# Make a small change
echo "# Test" >> README.md

# Commit and push
git add README.md
git commit -m "CMMS-123: Test MCP integration"
git push -u origin CMMS-123-test-integration
```

- [ ] Branch name follows format `CMMS-123-test-integration`
- [ ] Branch pushed to GitHub

### Create Pull Request

1. Go to repository: https://github.com/utmcsj/cmms
2. Click **Pull requests**
3. Click **New pull request**
4. Base: `main` ← Compare: `CMMS-123-test-integration`
5. Click **Create pull request**
6. **Leave PR title as default** (should include CMMS-123)
7. Click **Create pull request**

### Monitor Workflow

1. Click **Actions** tab
2. Look for workflow run: "MCP Integration"
3. Click the run to see details

**Expected Workflow Output**:
```
✅ Extract Issue Key
   Found: CMMS-123
   
✅ Link to Jira
   Linked PR #1 to CMMS-123
   
✅ Post Summary
   Posted: "PR #1 linked to CMMS-123"
```

- [ ] Workflow triggered automatically
- [ ] "Extract Issue Key" step succeeded
- [ ] "Link to Jira" step succeeded  
- [ ] "Post Summary" step succeeded

### Verify in Jira

1. Go to your Jira instance
2. Navigate to issue: `CMMS-123`
3. Look for comment from GitHub with PR link

**Expected Comment**:
```
GitHub PR Created: utmcsj/cmms#1

Link: https://github.com/utmcsj/cmms/pull/1
```

- [ ] GitHub PR linked in Jira comments
- [ ] Jira issue status changed to "In Progress"
- [ ] PR link is clickable

### Merge and Test

1. Go back to GitHub PR
2. Click **Squash and merge**
3. Click **Confirm squash and merge**
4. Visit Jira again - issue should now be "Done"

- [ ] PR merged successfully
- [ ] Workflow ran on merge event
- [ ] Jira issue transitioned to "Done"

---

## Phase 6: Team Onboarding (Ongoing)

### Share Documentation

Distribute these files to your team:

- [ ] [MCP_SETUP.md](MCP_SETUP.md) - Complete integration guide
- [ ] [BRANCH_NAMING_CONVENTION.md](BRANCH_NAMING_CONVENTION.md) - How to name branches
- [ ] [GITHUB_SECRETS_SETUP.md](GITHUB_SECRETS_SETUP.md) - Secret management
- [ ] `.mcp.env.example` - Environment template

### Team Checklist

For each team member:

- [ ] Generate their own GITHUB_TOKEN (with same scopes)
- [ ] Create their own `.mcp.env` file (from template)
- [ ] Run `bash scripts/verify-mcp.sh` to verify
- [ ] Create test branch and PR using naming convention
- [ ] Verify workflow runs and links to Jira

---

## Phase 7: Optional - Webhook Setup (Advanced)

Webhooks enable **bidirectional** syncing (Jira → GitHub).

### GitHub Webhooks

1. Go to repository **Settings** → **Webhooks**
2. Click **Add webhook**
3. Payload URL: (You need)
   - Server with internet access that can receive POST requests
   - Example: `https://your-webhook-server.com/jira-event`
4. Content type: `application/json`
5. Secret: Generate random string, save to `GITHUB_WEBHOOK_SECRET`

### Jira Webhooks

1. Jira Administration → **Webhooks**
2. Click **Create a webhook**
3. Name: `GitHub Sync`
4. Payload URL: (Same as GitHub)
5. Events: 
   - Issue created
   - Issue updated
   - Issue transitioned

### Webhook Sync Flow

```
GitHub PR Created
    ↓ (via webhook)
Jira Issue Linked & Status Updated
    ↓ (via webhook)  
GitHub Issue Synced
    ↓
Both systems in sync
```

- [ ] GitHub webhook configured (optional)
- [ ] Jira webhook configured (optional)
- [ ] Test bidirectional sync (optional)

---

## Phase 8: Configure IDE (Optional)

### Cline VS Code Extension

If using Cline for AI-assisted development:

1. Install **Cline** extension in VS Code
2. Copy MCP settings:
   ```bash
   cp cline_mcp_settings.json ~/.vscode/extensions/cline/settings.json
   ```
3. Edit to match your environment
4. Restart VS Code
5. In Cline chat, use MCP tools to query GitHub/Jira

**Available Commands**:
- "Search GitHub repos for X"
- "Create Jira issue with title Y"
- "List open issues in CMMS project"
- "Link PR #123 to CMMS-456"

- [ ] Cline extension installed (optional)
- [ ] cline_mcp_settings.json configured (optional)
- [ ] MCP tools callable in Cline chat (optional)

---

## Final Validation

### Verify Complete Setup

```bash
# 1. Check .mcp.env exists and is ignored
git status | grep -q ".mcp.env" && echo "❌ .mcp.env is tracked!" || echo "✅ .mcp.env is ignored"

# 2. Run verification script
source .mcp.env
bash scripts/verify-mcp.sh

# 3. Check GitHub Actions workflow exists
ls -la .github/workflows/mcp-integration.yml

# 4. Verify config files
ls -la .mcp.json cline_mcp_settings.json
```

**Expected Output**:
```
✅ .mcp.env is ignored
✅ MCP Integration Verification Complete
✅ Workflow file exists
✅ All config files present
```

### Completion Checklist

- [ ] Phase 1: Tokens generated and saved
- [ ] Phase 2: .mcp.env created with credentials
- [ ] Phase 3: Verification script runs successfully
- [ ] Phase 4: GitHub secrets added to repository
- [ ] Phase 5: Test workflow runs and links to Jira
- [ ] Phase 6: Documentation shared with team
- [ ] Phase 7: Webhooks configured (optional)
- [ ] Phase 8: IDE integration complete (optional)

---

## Post-Setup Maintenance

### Monthly

- [ ] Review and rotate tokens if necessary
- [ ] Check GitHub Actions logs for errors
- [ ] Monitor Jira issue linking success rate

### Quarterly

- [ ] Rotate GITHUB_TOKEN and JIRA_API_TOKEN
- [ ] Review GitHub branch protection rules
- [ ] Audit GitHub Actions secrets

### When Issues Occur

See [MCP_SETUP.md](MCP_SETUP.md) **Troubleshooting** section for:
- GitHub API authentication errors
- Jira API authentication errors
- Workflow not triggering
- Issue not linking in Jira
- Token expiration issues

---

## Estimated Timeline

| Phase | Time | Must Do | Optional |
|-------|------|---------|----------|
| 1: Generate tokens | 15 min | ✅ | |
| 2: Create .mcp.env | 5 min | ✅ | |
| 3: Test locally | 10 min | ✅ | |
| 4: Add GitHub secrets | 10 min | ✅ | |
| 5: Test workflow | 15 min | ✅ | |
| 6: Team onboarding | 30 min | ✅ | |
| 7: Webhook setup | 30 min | | ✅ |
| 8: IDE integration | 20 min | | ✅ |
| **Total** | **135 min** | **55 min** | **80 min** |

**Minimum to full functionality**: 55 minutes

---

## Support Resources

| Problem | Resource |
|---------|----------|
| How to generate tokens | [MCP_SETUP.md](MCP_SETUP.md) |
| Branch naming guide | [BRANCH_NAMING_CONVENTION.md](BRANCH_NAMING_CONVENTION.md) |
| GitHub secrets | [GITHUB_SECRETS_SETUP.md](GITHUB_SECRETS_SETUP.md) |
| API troubleshooting | [MCP_SETUP.md - Troubleshooting](MCP_SETUP.md) |
| Workflow debugging | `.github/workflows/mcp-integration.yml` |

---

**Status**: Integration checklist  
**Last Updated**: April 13, 2026  
**Version**: 1.0  
**Maintained By**: CMMS Team
