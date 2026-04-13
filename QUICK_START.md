# ⚡ CMMS Developer Quick Start

**Print this out! Pin it to your monitor!**

---

## 🚀 First 5 Minutes (Setup)

```bash
# 1. Clone repository
git clone https://github.com/YOUR-USERNAME/cmms.git
cd cmms

# 2. Install everything
make bootstrap

# 3. Start services
make dev

# ✅ Done! Services running at:
# frontend:  http://localhost:3000
# backend:   http://localhost:8000
# api docs:  http://localhost:8000/docs
# proxy:     http://localhost
```

---

## 📂 WHERE'S MY CODE?

| You Are... | Your Folder | Primary Files |
|---|---|---|
| Frontend Dev | `/frontend/` | app/, components/, hooks/, stores/ |
| Backend Dev | `/backend/` | routers/, models/, services/, tests/ |
| DevOps/Database | `/infrastructure/` & `/database/` | docker/, nginx/, init.sql |

---

## 🌿 Git Workflow (Every Day)

```bash
# 1. Get the latest code
git checkout main
git pull origin main

# 2. Create your branch (see naming below)
git checkout -b feature/foundation/your-feature

# 3. Make your changes
# (edit code in your folder)

# 4. Test before pushing
make lint format test

# 5. Commit with clear message
git commit -m "feat: describe what you did"

# 6. Push to GitHub
git push origin feature/foundation/your-feature

# 7. Go to GitHub and create a Pull Request
# Wait for review, address feedback, merge!
```

---

## 🔀 Branch Naming Rules

```
feature/epic/story-name          ← New feature
bugfix/story-name                ← Bug fix
refactor/area-name               ← Code improvement
docs/topic-name                  ← Documentation only
```

**Examples** (from our 53 stories):
```
feature/foundation/user-auth
feature/grading/smart-grid
bugfix/publication-email
refactor/backend-service
docs/api-endpoints
```

---

## ✅ Before Submitting a Pull Request

```bash
# Backend developers
cd backend
make lint              # Check code quality
make format            # Auto-format
pytest tests/ -v       # Run tests

# Frontend developers
cd frontend
npm run lint           # Check code quality
npm run format         # Auto-format
npm test               # Run tests
```

If you see errors, fix them and commit again.

---

## 📖 Need Help?

| Question | Answer |
|---|---|
| How do I get started? | Read **DEVELOPER_SETUP.md** |
| What's the git workflow? | See **BRANCH_NAMING_CONVENTION.md** |
| How do I set up my environment? | Run `make bootstrap` |
| Where are the API specs? | Check `/documentation/api/` |
| What's my assigned story? | Check GitHub Projects board |
| How do I run tests? | See table below |
| What are the code standards? | See **PROJECT_REVIEW.md** section on Quality |

---

## 🧪 Testing Commands

### Backend (FastAPI + Python)
```bash
cd backend

# Run all tests
pytest tests/ -v

# Run with coverage
pytest tests/ -v --cov=.

# Run specific test file
pytest tests/test_auth.py -v

# Run specific test
pytest tests/test_auth.py::test_login -v
```

### Frontend (Next.js + React)
```bash
cd frontend

# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Run in watch mode
npm test -- --watch
```

---

## 🔧 Useful Commands

```bash
# Start all services
make dev

# Stop all services
make dev-stop

# Run all tests
make test

# Check code quality
make lint

# Auto-format code
make format

# Database migrations
cd backend && alembic upgrade head

# View help
make help
```

---

## 💡 Daily Checklist

- [ ] Pull latest code from main: `git pull origin main`
- [ ] Create feature branch with proper name
- [ ] Write/test your code
- [ ] Run: `make lint`, `make format`, `make test`
- [ ] Commit with clear message
- [ ] Push: `git push origin your-branch`
- [ ] Create Pull Request on GitHub
- [ ] Wait 1-2 hours for review
- [ ] Address feedback if needed
- [ ] Merge when approved ✅

---

## 🚨 Common Mistakes (Avoid These!)

❌ **DON'T**:
- Push directly to `main` branch
- Commit `.env.local` or environment files
- Skip running tests before PR
- Use vague commit messages ("fixed stuff")
- Merge your own PR without approval
- Forget to pull latest before creating branch

✅ **DO**:
- Create feature branches
- Write clear commit messages
- Run tests locally first
- Request reviews from teammates
- Keep branches short-lived (1-3 days)
- Pull latest main before pushing

---

## 📞 Team Contacts

| Role | Person | Focus |
|---|---|---|
| Project Lead | [Your Name] | Overall project, decisions |
| Frontend Lead | Dev 1 or 2 | React/Next.js help |
| Backend Lead | Dev 3 or 4 | FastAPI/Python help |
| DevOps | As needed | Docker, infrastructure |

---

## 🎯 Your First Task

1. ✅ Clone the repository
2. ✅ Run `make bootstrap` (this takes 2-3 min)
3. ✅ Run `make dev` (verify all services start)
4. ✅ Read **DEVELOPER_SETUP.md** (10 min read)
5. ✅ Ask questions if anything is unclear
6. ✅ Wait for story assignment in GitHub Projects
7. ✅ Create your first feature branch
8. ✅ Start coding! 🚀

---

## 📊 Project at a Glance

- **Project**: Carry Mark Management System (CMMS)
- **University**: UTM
- **Timeline**: 8 weeks development + 2 weeks UAT
- **Team Size**: 5 people (2 frontend, 2 backend, 1 you)
- **Tech Stack**: 
  - Frontend: Next.js 14, React 18, TypeScript
  - Backend: FastAPI, Python 3.12, SQLAlchemy
  - Database: PostgreSQL 16, Redis
  - Infrastructure: Docker, Nginx, GitHub Actions
- **Total Stories**: 53 across 5 sprints
- **Sprint Length**: 2 weeks per sprint

---

## 🚀 You're Ready!

Everything you need to know is in this guide and the documentation folder. Start coding and have fun!

**Any questions?** Ask your team lead or check the documentation.

---

**Remember**: Code quality, tests, and clear communication make this project successful. Let's build something great together! 💪
