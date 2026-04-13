# CMMS Developer Setup & Branching Guide

**Last Updated**: 13 April 2026  
**For Team**: 4 Developers + Project Lead  
**Ready for**: Branch-based collaborative development

---

## 🚀 Quick Start for New Developers

### 1. Clone the Repository
```bash
git clone <your-github-repo-url>
cd cmms
```

### 2. Set Up Environment
```bash
# Copy environment template to local file
cp .env.example .env.local

# Install dependencies
make bootstrap

# Start development stack
make dev
```

### 3. Verify Setup
```bash
# Run tests to confirm everything works
make test

# Services should be running at:
# - Frontend: http://localhost:3000
# - Backend: http://localhost:8000
# - API Docs: http://localhost:8000/docs
# - Nginx Proxy: http://localhost
```

---

## 📋 Directory Structure Quick Reference

```
CMMS/
├── frontend/          👈 React/Next.js (Frontend Developers)
├── backend/           👈 FastAPI/Python (Backend Developers)
├── database/          👈 PostgreSQL/SQL (Database Admin)
├── infrastructure/    👈 Docker/Config (DevOps Engineer)
├── documentation/     👈 Specs & Guides
└── scripts/           👈 Automation
```

---

## 🌿 Git Branching Strategy

### Branch Naming Convention
Follow [BRANCH_NAMING_CONVENTION.md](BRANCH_NAMING_CONVENTION.md) for branch names:

```
feature/{epic}/{story}      # New features
bugfix/{story}              # Bug fixes
hotfix/{issue}              # Production hotfixes
refactor/{area}             # Code restructuring
docs/{topic}                # Documentation only
```

**Examples:**
```bash
feature/foundation/user-auth
feature/grading/smart-grid-display
bugfix/publication-email-not-sending
refactor/backend-mark-service
docs/api-endpoints
```

---

## 👥 Team Assignments & Responsibilities

### Frontend Team (2 Developers)
**Branch Prefix**: `feature/*/` and `frontend/`
**Main Focus**: 
- Next.js components in `/frontend/app/` and `/frontend/components/`
- State management in `/frontend/stores/`
- Tests in `/frontend/__tests__/` and `/frontend/cypress/`

**Setup Steps**:
```bash
cd frontend
npm install
npm run dev
npm test
```

### Backend Team (2 Developers)
**Branch Prefix**: `feature/*/` and `backend/`
**Main Focus**:
- API routes in `/backend/routers/`
- Models in `/backend/models/`
- Services (business logic) in `/backend/services/`
- Tests in `/backend/tests/`

**Setup Steps**:
```bash
cd backend
pip install -r requirements.txt -r requirements-dev.txt
python -m pytest tests/ -v
```

### DevOps/Database Admin (as needed)
**Branch Prefix**: `infrastructure/` and `database/`
**Focus**:
- Docker config in `/infrastructure/docker/`
- Nginx in `/infrastructure/nginx/`
- Database migrations in `/backend/migrations/`
- Triggers in `/database/triggers/`

---

## 📝 Development Workflow

### Step 1: Create Your Feature Branch
```bash
# Always branch from latest main
git checkout main
git pull origin main

# Create your feature branch
git checkout -b feature/foundation/user-auth

# Or use the convention from BRANCH_NAMING_CONVENTION.md
```

### Step 2: Make Your Changes
```bash
# Edit files in your assigned component

# For Frontend:
cd frontend
npm run lint
npm run format
npm test

# For Backend:
cd backend
make lint
make format
pytest tests/ -v
```

### Step 3: Commit with Clear Messages
```bash
# Good commit messages
git commit -m "feat: add JWT token validation to auth routes"
git commit -m "fix: resolve mark import parsing error"
git commit -m "test: add unit tests for anomaly detection"

# Bad commit messages (avoid)
git commit -m "fixed stuff"
git commit -m "work in progress"
```

### Step 4: Push and Create Pull Request
```bash
git push origin feature/foundation/user-auth
```

Then on GitHub:
1. Create Pull Request (PR)
2. Add description of changes
3. Link to JIRA story (if applicable)
4. Request review from team lead
5. Pass CI/CD checks

### Step 5: Code Review & Merge
- Address code review comments
- Keep PR updated with main branch
- Merge once approved
- Delete feature branch after merge

---

## 🔍 Code Quality Standards

### Python (Backend)
- **Linting**: `pylint` (threshold: 7.0/10)
- **Formatting**: `black` + `isort`
- **Type Checking**: `mypy`
- **Testing**: Pytest with ≥70% coverage

```bash
cd backend
make lint
make format
pytest tests/ -v --cov=.
```

### TypeScript/JavaScript (Frontend)
- **Linting**: ESLint + Prettier
- **Formatting**: Prettier
- **Testing**: Vitest + React Testing Library with ≥60% coverage

```bash
cd frontend
npm run lint
npm run format
npm test
```

---

## 🧪 Testing Requirements

### Before Creating a PR, Run:
```bash
# Backend
cd backend && make test

# Frontend
cd frontend && npm test

# Or run all tests
make test
```

**Coverage Targets:**
- Backend: ≥70%
- Frontend: ≥60%
- Must pass all tests to merge

---

## 🚨 Important: Environment Variables

### Local Development
```bash
# Copy .env.example to .env.local (NEVER commit .env.local)
cp .env.example .env.local

# Edit .env.local with your local values
# Default dev values are already set in .env.example
```

### CI/CD & Production Secrets
- **NO hardcoded secrets** in code
- All secrets managed via GitHub Secrets
- See [GITHUB_SECRETS_SETUP.md](GITHUB_SECRETS_SETUP.md)

### Never Commit:
```
❌ .env.local
❌ .env (actual secrets)
❌ Private keys
❌ API tokens in code
❌ Database credentials in code
```

These are in `.gitignore` and will be rejected by CI/CD.

---

## 📊 Sprint & Story Planning

Refer to [JIRA_PROJECT_STRUCTURE.md](documentation/JIRA_PROJECT_STRUCTURE.md) for:
- **53 User Stories** organized by epic
- **5 Sprints** with 2-week cycles
- **Acceptance Criteria** for each story
- **Story Points** & effort estimates

---

## 🔗 Dependencies Between Teams

**Frontend depends on Backend API**:
- Use `/documentation/api/` for endpoint specs
- Mock API if backend not ready: use Stub responses

**Backend depends on Database**:
- Schema defined in `/database/init.sql`
- Migrations in `/backend/migrations/`
- Always run migrations before testing

**Infrastructure impacts all**:
- Docker setup required for local dev
- Nginx config for production routing
- Check `/infrastructure/` before deployment

---

## 📚 Documentation You Need

1. **[README.md](README.md)** — Project overview
2. **[STRUCTURE_REORGANIZATION.md](STRUCTURE_REORGANIZATION.md)** — Latest folder structure
3. **[BRANCH_NAMING_CONVENTION.md](BRANCH_NAMING_CONVENTION.md)** — Git branch standards
4. **[documentation/CMMS_PROJECT_MASTER.md](documentation/CMMS_PROJECT_MASTER.md)** — Full spec (23 KB)
5. **[documentation/JIRA_PROJECT_STRUCTURE.md](documentation/JIRA_PROJECT_STRUCTURE.md)** — All 53 stories
6. **[documentation/api/](documentation/api/)** — API documentation

---

## 🛠️ Common Commands for Each Team

### Both Teams
```bash
# Install all dependencies
make bootstrap

# Start dev stack (all services)
make dev

# Stop all services
make dev-stop

# View all available commands
make help
```

### Frontend Team
```bash
cd frontend

# Development
npm run dev              # Start dev server (port 3000)
npm run build            # Production build
npm run lint             # Check code quality
npm run format           # Auto-format code
npm test                 # Run tests
npm test -- --coverage   # With coverage report
```

### Backend Team
```bash
cd backend

# Development
uvicorn main:app --reload  # Start dev server (port 8000)
make lint                   # Check code quality
make format                 # Auto-format code
make test                   # Run tests (coverage included)
pytest tests/ -vvs          # Verbose output with print statements

# Database
make migrate                # Run migrations
alembic revision -m "message"  # Create new migration
alembic upgrade head        # Apply migrations
alembic downgrade -1        # Rollback last migration
```

---

## 🚀 Deployment & Releases

### Staging Deployment
```bash
# Create release branch
git checkout -b release/v1.0.0

# Push to staging (automated by CI/CD)
git push origin release/v1.0.0
```

### Production Deployment
- Requires PR approval from all team leads
- Must pass all tests
- See CI/CD config in `.github/workflows/`

---

## 📞 Getting Help

1. **Setup Issues** → Check this file + [README.md](README.md)
2. **API Questions** → See [documentation/api/](documentation/api/)
3. **Project Scope** → Read [documentation/CMMS_PROJECT_MASTER.md](documentation/CMMS_PROJECT_MASTER.md)
4. **Sprint Details** → Check [documentation/JIRA_PROJECT_STRUCTURE.md](documentation/JIRA_PROJECT_STRUCTURE.md)
5. **Git Workflow** → See [BRANCH_NAMING_CONVENTION.md](BRANCH_NAMING_CONVENTION.md)

---

## ✅ Ready to Start?

1. ✅ Clone the repo
2. ✅ Run `make bootstrap`
3. ✅ Run `make dev`
4. ✅ Create your feature branch
5. ✅ Start coding!

**Questions?** Contact the project lead or refer to documentation.

🚀 **Happy coding!**
