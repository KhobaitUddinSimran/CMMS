# Branch Naming Convention for GitHub-Jira Integration

Align your Git branches with Jira issues for automatic linking and workflow automation.

## Format

```
CMMS-{issue-number}-{short-description}
```

## Examples

```
CMMS-1-setup-project
CMMS-42-add-authentication
CMMS-156-fix-database-connection
CMMS-999-refactor-user-service
```

## Pattern Explanation

| Part | Format | Example | Notes |
|------|--------|---------|-------|
| **Project Key** | `CMMS` | `CMMS` | Fixed - identifies Jira project |
| **Issue Number** | `-{1-5 digits}` | `-42` | Jira issue ID (no `#` symbol) |
| **Description** | `-{kebab-case}` | `-add-authentication` | Brief, lowercase, dashes between words |

---

## Rules

- ✅ Start with **`CMMS-`** followed by issue number
- ✅ Use **lowercase** letters
- ✅ Separate words with **hyphens** (kebab-case)
- ✅ Keep description **short** (2-4 words)
- ✅ No spaces, underscores, or special characters
- ❌ Don't include version numbers
- ❌ Don't use CamelCase or snake_case

---

## Standard Branch Types

### Feature Branches

```
CMMS-{issue}-feature-{name}
CMMS-42-feature-user-login
CMMS-88-feature-sso-integration
```

### Bug Fix Branches

```
CMMS-{issue}-fix-{name}
CMMS-15-fix-null-pointer-exception
CMMS-73-fix-email-validation
```

### Refactor Branches

```
CMMS-{issue}-refactor-{name}
CMMS-201-refactor-database-layer
CMMS-95-refactor-validation-logic
```

### Documentation Branches

```
CMMS-{issue}-docs-{name}
CMMS-333-docs-api-endpoints
CMMS-127-docs-setup-guide
```

### Hotfix Branches

```
CMMS-{issue}-hotfix-{name}
CMMS-444-hotfix-production-crash
CMMS-22-hotfix-security-vulnerability
```

---

## Git Workflow with Jira

### 1. Create Issue in Jira

1. Go to Jira: `https://your-company.atlassian.net/browse/CMMS-42`
2. Note the issue number: **CMMS-42**

### 2. Create Branch

```bash
# Fetch latest from main
git fetch origin

# Create branch matching issue
git checkout -b CMMS-42-add-user-authentication

# Set upstream and push
git push -u origin CMMS-42-add-user-authentication
```

### 3. Automatic Linking

When you **create a Pull Request**:
- GitHub Actions **extracts** `CMMS-42` from branch name
- **Links** the PR to Jira issue CMMS-42
- Sets Jira issue status to **"In Progress"**
- Posts **PR link** in Jira comments

### 4. On Merge

When you **merge the PR**:
- GitHub Actions **transitions** Jira issue to **"Done"**
- Posts **merge commit** link in Jira
- Closes the linked PR

---

## Automation Flow

```
┌─────────────────────────┐
│ Create Git Branch       │
│ CMMS-42-feature-x       │
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│ Create Pull Request     │
│ (title includes branch) │
└────────────┬────────────┘
             │
    GitHub Actions Triggered
             │
             ▼
┌─────────────────────────┐
│ Extract Issue: CMMS-42  │
│ Query Jira API          │
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│ Link PR to CMMS-42      │
│ Post PR URL comment     │
└────────────┬────────────┘
             │
    Reviewer approves & merges
             │
             ▼
┌─────────────────────────┐
│ Transition CMMS-42      │
│ to "Done"               │
└─────────────────────────┘
```

---

## Multi-Issue Branches

If a single branch fixes multiple issues:

### Option 1: Multiple PRs

Create separate PRs, each linked to one issue (recommended)

```bash
git checkout -b CMMS-42-fix-validation
# Make changes
git push -u origin CMMS-42-fix-validation
# Create PR

# Later, same branch can be cherry-picked for another issue
git checkout -b CMMS-43-extend-validation
git cherry-pick <commit>
```

### Option 2: Use PR Description

If one PR covers multiple issues, list them in PR description:

```markdown
## Linked Issues
- CMMS-42 Fix validation logic
- CMMS-43 Add email validation
- CMMS-44 Add phone validation

The workflow will only link the first issue found in branch name.
To link all three, mention them in the PR description.
```

---

## Enforcing Convention

### Git Hooks (Local Enforcement)

Create `.git/hooks/prepare-commit-msg` to enforce naming:

```bash
#!/bin/bash

BRANCH=$(git rev-parse --abbrev-ref HEAD)

if [[ ! "$BRANCH" =~ ^CMMS-[0-9]+-[a-z-]+$ ]]; then
  echo "❌ Branch name doesn't match CMMS-{number}-{description} format"
  echo "   Current: $BRANCH"
  echo "   Example: CMMS-42-add-authentication"
  exit 1
fi
```

### GitHub Branch Protection

1. Go to **Settings** → **Branches** → **Add rule**
2. Pattern: `CMMS-*`
3. Enable: "Require status checks to pass"

---

## Troubleshooting

### Workflow didn't link issue

**Problem**: Case mismatch  
**Solution**: Ensure uppercase `CMMS` prefix

```bash
# ✅ Correct
git checkout -b CMMS-42-feature

# ❌ Wrong
git checkout -b cmms-42-feature
```

### PR has wrong issue linked

**Problem**: Multiple CMMS-XX patterns in branch/PR title  
**Solution**: Workflow extracts first match  
**Fix**: Rename branch to single issue (or rename PR title)

### Jira issue didn't transition

**Problem**: Missing JIRA_API_TOKEN secret  
**Solution**: See [GITHUB_SECRETS_SETUP.md](GITHUB_SECRETS_SETUP.md)

### Can't find issue in Jira

**Problem**: Issue CMMS-42 doesn't exist  
**Solution**: Create issue first, then branch:

```bash
# In Jira: Create issue → Get number CMMS-42
# Then create branch with that number
git checkout -b CMMS-42-feature
```

---

## Reference Commands

```bash
# See current branch name
git branch --show-current

# Rename current branch
git branch -m CMMS-NEW-NAME

# List all branches matching pattern
git branch --list 'CMMS-*'

# Delete a branch locally
git branch -d CMMS-42-old-feature

# Delete a branch remotely
git push origin --delete CMMS-42-old-feature
```

---

## Team Guidelines

### Commit Message Format

```
CMMS-42: Brief description of change

- Details about the change
- Why it was necessary
- Any breaking changes
```

### PR Title Format

```
CMMS-42: Add user authentication

Closes #123 (GitHub issue, if applicable)
```

### Example PR Description

```markdown
## What does this PR do?
Implements OAuth2 authentication flow

## Related Issues
- CMMS-42 (main issue)
- CMMS-43 (related improvement)

## Testing
- [ ] Unit tests passing
- [ ] Manual testing in staging
- [ ] Existing tests still pass

## Checklist
- [x] Code follows style guide
- [x] Documentation updated
- [x] No new warnings generated
```

---

## Branch Lifecycle

```
1. CREATE
   git checkout -b CMMS-42-feature
   ↓
2. COMMIT & PUSH  
   git push -u origin CMMS-42-feature
   ↓
3. CREATE PR
   GitHub detects CMMS-42, links to Jira
   ↓
4. REVIEW
   Team reviews and approves
   ↓
5. MERGE
   PR merged to main
   Jira issue transitions to Done
   ↓
6. CLEANUP
   Delete branch (usually automatic)
```

---

## Status Dashboard

View all branches and their linked issues:

```bash
# List all CMMS branches with last commit
git branch -vv --list 'CMMS-*'

# See branches since last week
git branch -vv --list 'CMMS-*' --no-merged

# Create alias for quick access
git config --global alias.cmms "branch --list 'CMMS-*' -vv"
# Then use: git cmms
```

---

**Status**: Branch naming guide  
**Last Updated**: April 13, 2026  
**Version**: 1.0
