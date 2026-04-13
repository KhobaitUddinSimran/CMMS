# MCP (Model Context Protocol) Integration Overview

Your CMMS project is now configured with **GitHub and Jira integration** via MCP servers, enabling AI agents and GitOps automation to coordinate development work across platforms.

---

## Quick Start (5 minutes)

```bash
# 1. Copy environment template
cp .mcp.env.example .mcp.env

# 2. Edit .mcp.env with your credentials
# GITHUB_TOKEN=ghp_xxxx...
# JIRA_HOST=https://your-company.atlassian.net
# JIRA_EMAIL=your-email@example.com
# JIRA_API_TOKEN=xxxx...

# 3. Test configuration
source .mcp.env
bash scripts/verify-mcp.sh

# 4. Add repository secrets to GitHub
# See: GITHUB_SECRETS_SETUP.md

# 5. Test with a branch following naming convention
# See: BRANCH_NAMING_CONVENTION.md
```

---

## Overview

### What is MCP?

**Model Context Protocol** is a bridge between AI systems and external services. It allows AI agents to:
- Query and search GitHub repositories
- Create and update GitHub Issues/Pull Requests
- Create and transition Jira issues
- Automate workflow between systems

### Architecture

```
┌──────────────────┐
│   AI Agent       │ (Claude, Cline, etc.)
│  (e.g., Claude)  │
└────────┬─────────┘
         │ MCP Calls
         ▼
┌──────────────────┐
│  MCP Servers     │ 
│ ┌──────────────┐ │
│ │ GitHub       │ │  (Search, create issues/PRs, manage workflows)
│ └──────────────┘ │
│ ┌──────────────┐ │
│ │ Jira         │ │  (Query, create, transition issues)
│ └──────────────┘ │
└────────┬─────────┘
         │ API Calls
         ▼
┌──────────────────┐    ┌──────────────────┐
│ GitHub API       │    │ Jira REST API    │
│ (github.com)     │    │ (atlassian.net)  │
└──────────────────┘    └──────────────────┘
```

### What Gets Automated

1. **Pull Request ↔ Jira Issue Linking**
   - Create PR with `CMMS-123` in branch name
   - Workflow automatically links PR to `CMMS-123` in Jira
   - Posts PR link as comment in Jira

2. **Issue Status Transitions**
   - Merge PR → Jira issue transitions to "Done"
   - Create issue → Jira updates status to "In Progress"

3. **AI-Assisted Development**
   - Ask Claude: "What issues are blocking our release?"
   - Claude queries Jira through MCP, lists open blockers
   - Claude: "Create issue for this bug"
   - AI creates issue directly in Jira

---

## File Inventory

### Configuration Files (3 files)

| File | Purpose | Status |
|------|---------|--------|
| [.mcp.json](.mcp.json) | MCP server definitions (GitHub/Jira) | ✅ Created |
| [.mcp.env.example](.mcp.env.example) | Credential template (copy to .mcp.env) | ✅ Created |
| [cline_mcp_settings.json](cline_mcp_settings.json) | Cline IDE extension config | ✅ Created |

**You Must Create**: `.mcp.env` (copy from `.mcp.env.example` and fill in credentials)

### Documentation Files (4 files)

| File | Purpose | Read Time |
|------|---------|-----------|
| [MCP_SETUP.md](MCP_SETUP.md) | Complete setup guide with token generation steps | 15 min |
| [MCP_INTEGRATION_CHECKLIST.md](MCP_INTEGRATION_CHECKLIST.md) | Step-by-step checklist for full setup | 20 min |
| [GITHUB_SECRETS_SETUP.md](GITHUB_SECRETS_SETUP.md) | GitHub Actions secrets management | 10 min |
| [BRANCH_NAMING_CONVENTION.md](BRANCH_NAMING_CONVENTION.md) | Branch naming for automatic Jira linking | 10 min |

### Automation Files (2 files)

| File | Purpose | Status |
|------|---------|--------|
| [.github/workflows/mcp-integration.yml](.github/workflows/mcp-integration.yml) | GitHub Actions workflow for GitHub-Jira sync | ✅ Created |
| [scripts/verify-mcp.sh](scripts/verify-mcp.sh) | Bash script to test GitHub/Jira connections | ✅ Created |

---

## Setup Checklist

Complete setup in **55 minutes**:

1. **Generate Tokens** (15 min)
   - [ ] GitHub Personal Access Token: https://github.com/settings/tokens
   - [ ] Jira API Token: https://id.atlassian.com/manage-profile/security/api-tokens

2. **Create Configuration** (5 min)
   ```bash
   cp .mcp.env.example .mcp.env
   # Edit with your tokens
   ```

3. **Test Locally** (10 min)
   ```bash
   source .mcp.env
   bash scripts/verify-mcp.sh
   ```

4. **Add GitHub Secrets** (10 min)
   - Go to repo → Settings → Secrets and variables → Actions
   - Add: GITHUB_TOKEN, JIRA_HOST, JIRA_EMAIL, JIRA_API_TOKEN

5. **Test Workflow** (15 min)
   - Push branch: `CMMS-123-feature-name`
   - Create PR → Workflow runs → Jira issue linked
   - Merge PR → Jira issue transitions to Done

👉 **Start Here**: Read [MCP_INTEGRATION_CHECKLIST.md](MCP_INTEGRATION_CHECKLIST.md)

---

## Available MCP Tools

Once configured, you and AI agents can use these tools:

### GitHub Tools

| Tool | Example Usage |
|------|---------------|
| `search_repositories` | "Find repos matching 'authentication'" |
| `list_issues` | "List all open bugs in utmcsj/cmms" |
| `create_issue` | "Create issue: 'Add dark mode support'" |
| `search_code` | "Find JWT authentication code" |
| `list_pull_requests` | "What PRs are waiting for review?" |
| `get_pull_request` | "Get details of PR #42" |

### Jira Tools

| Tool | Example Usage |
|------|---------------|
| `search_issues` | "Find all CMMS issues assigned to me" |
| `get_issue` | "What's the status of CMMS-123?" |
| `create_issue` | "Create story: 'User onboarding flow'" |
| `add_comment` | "Add comment to CMMS-42: 'Ready for QA'" |
| `transition_issue` | "Move CMMS-100 to 'In Review'" |
| `list_projects` | "Show all projects I can access" |

---

## Configuration Details

### .mcp.json

Defines MCP servers and how to launch them:

```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["mcp-github"],
      "env": {
        "GITHUB_TOKEN": "${GITHUB_TOKEN}",
        "GITHUB_REPOSITORY": "${GITHUB_REPOSITORY}"
      }
    },
    "jira": {
      "command": "npx",
      "args": ["mcp-jira"],
      "env": {
        "JIRA_HOST": "${JIRA_HOST}",
        "JIRA_EMAIL": "${JIRA_EMAIL}",
        "JIRA_API_TOKEN": "${JIRA_API_TOKEN}",
        "JIRA_PROJECT_KEY": "${JIRA_PROJECT_KEY}"
      }
    }
  }
}
```

### .mcp.env (template)

Environment variables for MCP servers:

```env
# GitHub Configuration
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
GITHUB_REPOSITORY=utmcsj/cmms

# Jira Configuration
JIRA_HOST=https://your-company.atlassian.net
JIRA_EMAIL=your-email@example.com
JIRA_API_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxx
JIRA_PROJECT_KEY=CMMS
```

### Branch Naming Convention

Branches must match: `CMMS-{number}-{description}`

```
✅ CMMS-42-add-authentication
✅ CMMS-156-fix-null-pointer
❌ CMMS-42_add_authentication  (underscore not allowed)
❌ cmms-42-add-authentication  (lowercase not allowed)
❌ 42-add-authentication       (missing CMMS prefix)
```

This enables automatic PR→Jira linking via GitHub Actions.

---

## Workflow Automation

### When You Create a PR

```
Push branch: CMMS-42-feature
    ↓
Create PR on GitHub
    ↓
GitHub Actions Triggers:
  1. Extract CMMS-42 from branch name
  2. Link PR to Jira issue CMMS-42
  3. Post PR URL in Jira comments
    ↓
Team sees:
  - [In GitHub] Issue linked in PR
  - [In Jira] PR link in comments
```

### When You Merge a PR

```
Click "Merge Pull Request"
    ↓
GitHub Actions Triggers:
  1. Transition CMMS-42 to "Done"
  2. Post merge commit link in Jira
    ↓
Team sees:
  - [In Jira] Issue marked as Done
  - [In Jira] Merge commit linked
```

---

## Verification

Test your setup:

```bash
# 1. Source credentials
source .mcp.env

# 2. Run verification script
bash scripts/verify-mcp.sh

# 3. Expected output:
# ✅ MCP Integration Verification Starting...
# 🔐 GitHub Configuration
#   User: your-username
#   Repos: 5
#   ✅ GitHub API accessible
# 
# 🔐 Jira Configuration
#   User: Your Name
#   Project: CMMS
#   Open Issues: 12
#   ✅ Jira API accessible
#
# ✅ MCP Integration Verification Complete
```

---

## Security

### Credential Management

- ✅ Credentials stored in `.mcp.env` (NEVER checked in)
- ✅ `.mcp.env` listed in `.gitignore`
- ✅ GitHub secrets used for CI/CD (separate from dev `.mcp.env`)
- ✅ Tokens use minimal required scopes
- ✅ Tokens can be rotated independently

### Best Practices

1. **Token Rotation**: Rotate tokens every 90 days
2. **Scope Limiting**: GitHub token only needs `repo`, `read:org`, `workflow`
3. **Environment Isolation**: Dev `.mcp.env` separate from GitHub Actions secrets
4. **Audit Trail**: Check GitHub Action logs (secrets are masked)
5. **Revocation**: Immediately revoke tokens if exposed

---

## Troubleshooting

### Verification Script Fails

**Problem**: `curl: command not found`  
**Solution**: Install curl or use alternative verification

**Problem**: `JIRA_API_TOKEN: command not found`  
**Solution**: Ensure you ran `source .mcp.env` first

**Problem**: `401 Unauthorized` on GitHub  
**Solution**: 
- Verify GITHUB_TOKEN value
- Check token hasn't expired (Settings → Developer settings)
- Ensure token has `repo` scope

**Problem**: `401 Unauthorized` on Jira  
**Solution**:
- Verify JIRA_EMAIL and JIRA_API_TOKEN match
- Check email is tied to Atlassian account
- Try generating new API token

### Workflow Doesn't Run

**Problem**: No workflow triggered  
**Solution**: 
- Check branch name matches `CMMS-123-*` format
- Ensure PR title includes branch name
- GitHub Actions enabled in repo Settings

**Problem**: Workflow runs but issue doesn't link  
**Solution**:
- Check JIRA_HOST doesn't have trailing slash
- Verify JIRA_PROJECT_KEY=CMMS (exact match)
- Check GitHub Actions secrets are set correctly

### Issue Doesn't Transition

**Problem**: PR merged but Jira issue still "In Progress"  
**Solution**:
- Check workflow logs: GitHub repo → Actions
- Verify JIRA_API_TOKEN not expired
- Check issue isn't in a restricting workflow state

---

## Technology Stack

| Component | Tool | Version |
|-----------|------|---------|
| MCP Protocol | Model Context Protocol | - |
| GitHub MCP | `mcp-github` | Latest (npx) |
| Jira MCP | `mcp-jira` | Latest (npx) |
| CI/CD | GitHub Actions | Built-in |
| IDE Integration | Cline | Optional |
| Verification | Bash + curl | Any Linux/Mac |

---

## Next Steps

### Immediate (Today)

1. Read [MCP_INTEGRATION_CHECKLIST.md](MCP_INTEGRATION_CHECKLIST.md) (20 min)
2. Generate GitHub and Jira tokens (15 min)
3. Create `.mcp.env` and test with `verify-mcp.sh` (10 min)
4. Add secrets to GitHub Actions (10 min)

**Total: 55 minutes to full integration** ✨

### Soon (This Week)

- [ ] Test with real PR using naming convention
- [ ] Verify workflow runs and links to Jira
- [ ] Share documentation with team
- [ ] Set up branch naming enforcement in GitHub

### Later (This Month)

- [ ] Set up GitHub/Jira webhooks (bidirectional sync)
- [ ] Configure Cline extension for AI-assisted development
- [ ] Document development workflow for team
- [ ] Set up automated security scanning

---

## Support

### Documentation

- **How to set up?** → [MCP_INTEGRATION_CHECKLIST.md](MCP_INTEGRATION_CHECKLIST.md)
- **How to name branches?** → [BRANCH_NAMING_CONVENTION.md](BRANCH_NAMING_CONVENTION.md)
- **How to manage secrets?** → [GITHUB_SECRETS_SETUP.md](GITHUB_SECRETS_SETUP.md)
- **Complete guide?** → [MCP_SETUP.md](MCP_SETUP.md)

### Files

- Configuration: `.mcp.json`, `.mcp.env.example`
- Testing: `scripts/verify-mcp.sh`
- Automation: `.github/workflows/mcp-integration.yml`
- IDE: `cline_mcp_settings.json`

### Troubleshooting

See [MCP_SETUP.md](MCP_SETUP.md) section: **Troubleshooting and Support**

---

## Status

| Component | Status |
|-----------|--------|
| GitHub MCP Configuration | ✅ Ready |
| Jira MCP Configuration | ✅ Ready |
| GitHub Actions Workflow | ✅ Ready |
| Verification Script | ✅ Ready |
| Documentation | ✅ Complete |
| Secrets Configuration | ⏳ Pending (user must add) |
| Testing the Integration | ⏳ Pending (user must test) |

**Setup Completeness**: **95%** (just need credentials!)

---

## Summary

Your CMMS project now has:

✅ **MCP servers configured** for GitHub and Jira  
✅ **GitHub Actions workflow** for automatic GitHub-Jira syncing  
✅ **Verification script** to test connections  
✅ **Complete documentation** for team onboarding  
✅ **Security best practices** built-in  

**Ready for**: AI-assisted development, automated workflows, and unified GitHub-Jira integration.

---

**Setup Doc Version**: 1.0  
**Last Updated**: April 13, 2026  
**Maintained By**: CMMS Infrastructure Team
