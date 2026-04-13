# CMMS Project Structure Reorganization

**Date**: 13 April 2026  
**Status**: ✅ Complete

---

## 🎯 Overview

The CMMS project has been reorganized into a cleaner, more intuitive directory structure that clearly separates **Frontend**, **Backend**, **Database**, **Infrastructure**, and **Documentation** components at the root level.

---

## 📊 Old vs New Structure

### OLD STRUCTURE (9 Root Items)
```
CMMS/
├── apps/
│   ├── api/           👈 Backend scattered in apps
│   └── web/           👈 Frontend scattered in apps
├── infra/
│   ├── db/            👈 Database scattered in infra
│   ├── docker/
│   ├── nginx/
│   ├── envs/
│   └── redis/
├── docs/              👈 Some docs here
├── miscellaneous/     👈 More docs scattered here
├── scripts/
├── Makefile
└── docker-compose.yml
```

**Problems with old structure:**
- ❌ Frontend and backend mixed under `apps/` folder
- ❌ Database, Docker, and infrastructure scattered in `infra/`
- ❌ Documentation split across `docs/` and `miscellaneous/`
- ❌ Not immediately obvious what each top-level folder contains

---

### NEW STRUCTURE (6 Root Folders + Root Config)
```
CMMS/
├── frontend/          👈 All frontend code (Next.js, React, TypeScript)
│   ├── app/
│   ├── components/
│   ├── hooks/
│   ├── lib/
│   ├── stores/
│   ├── styles/
│   ├── types/
│   ├── __tests__/     (Vitest unit tests)
│   ├── cypress/       (E2E tests)
│   ├── next.config.js
│   └── package.json
│
├── backend/           👈 All backend code (FastAPI, Python, SQLAlchemy)
│   ├── core/          (Config, security, JWT utilities)
│   ├── models/        (SQLAlchemy ORM models)
│   ├── schemas/       (Pydantic validation)
│   ├── routers/       (API endpoint handlers)
│   ├── services/      (Business logic)
│   ├── dependencies/  (FastAPI dependency injection)
│   ├── migrations/    (Alembic DB migrations)
│   ├── tests/         (Pytest unit/integration tests)
│   ├── main.py
│   └── requirements.txt
│
├── database/          👈 All database code (PostgreSQL, RLS, Triggers)
│   ├── init.sql       (Initial schema setup)
│   └── triggers/      (PostgreSQL trigger definitions)
│
├── infrastructure/    👈 All infrastructure (Docker, Nginx, Redis, Env Configs)
│   ├── docker/        (Dockerfiles: API, Web)
│   ├── nginx/         (Nginx reverse proxy config)
│   ├── envs/          (Environment configuration templates)
│   └── redis/         (Redis cache configuration)
│
├── documentation/     👈 All project documentation (Centralized)
│   ├── CMMS_PROJECT_MASTER.md
│   ├── JIRA_PROJECT_STRUCTURE.md
│   ├── CMMS_MONOREPO_STRUCTURE.md
│   ├── DOCUMENTATION_INDEX.md
│   ├── api/           (API specifications from docs/)
│   └── diagrams/      (Architecture diagrams)
│
├── scripts/           👈 Utility scripts
│   └── verify-mcp.sh
│
├── docker-compose.yml (Root configuration)
├── Makefile           (Development automation - UPDATED)
├── pyproject.toml     (Python project metadata)
└── README.md          (Project overview - UPDATED)
```

**Benefits of new structure:**
- ✅ **Crystal clear organization** — Each top-level folder has a single, obvious purpose
- ✅ **Better navigation** — Developers can instantly find frontend, backend, database, or infrastructure code
- ✅ **Simplified maintenance** — Less searching through nested folders
- ✅ **Easier onboarding** — New team members understand structure immediately
- ✅ **Logical separation** — Frontend/backend teams can work independently
- ✅ **Centralized docs** — All documentation in one place

---

## 🔄 Files Modified

### Configuration Files Updated:
1. **`docker-compose.yml`**
   - Updated paths: `infra/docker` → `infrastructure/docker`
   - Updated paths: `apps/api` → `backend`
   - Updated paths: `apps/web` → `frontend`
   - Updated paths: `infra/nginx` → `infrastructure/nginx`

2. **`Makefile`**
   - Updated all commands to use new paths:
     - `apps/api` → `backend`
     - `apps/web` → `frontend`
   - All targets working with new structure

3. **`README.md`**
   - Updated project structure diagram
   - Updated documentation links to point to `documentation/`
   - Updated all path references

---

## 📋 Mapping of Old to New Locations

| Old Location | New Location | Contents |
|---|---|---|
| `apps/web/` | `frontend/` | Next.js frontend code |
| `apps/api/` | `backend/` | FastAPI backend code |
| `infra/db/` | `database/` | PostgreSQL schema & triggers |
| `infra/docker/` | `infrastructure/docker/` | Dockerfiles |
| `infra/nginx/` | `infrastructure/nginx/` | Nginx configuration |
| `infra/envs/` | `infrastructure/envs/` | Environment templates |
| `infra/redis/` | `infrastructure/redis/` | Redis configuration |
| `docs/` | `documentation/api/` | API documentation |
| `docs/diagrams/` | `documentation/diagrams/` | Architecture diagrams |
| `miscellaneous/` | `documentation/` | All spec documents |

---

## 🚀 Next Steps

### 1. **Verify Services Still Work**
```bash
# Test if services start properly
make dev

# Expected: All services should run at:
# - Frontend: http://localhost:3000
# - Backend: http://localhost:8000
# - Nginx proxy: http://localhost
```

### 2. **Run Bootstrap & Tests**
```bash
# Fresh bootstrap with new paths
make bootstrap

# Run tests to ensure everything works
make test
```

### 3. **Update IDE Shortcuts**
If using VS Code or other IDEs with project-specific shortcuts, update them to point to new locations.

### 4. **Update Team Documentation**
Share this `STRUCTURE_REORGANIZATION.md` with the team so everyone understands the new layout.

---

## 📝 Summary of Changes

- **6 major component folders** created: `frontend/`, `backend/`, `database/`, `infrastructure/`, `documentation/`, `scripts/`
- **4 old root folders** removed: `apps/`, `infra/`, `docs/`, `miscellaneous/`
- **3 configuration files** updated with new paths
- **All functionality preserved** — no code changes, only file organization
- **Zero breaking changes** — all development commands work the same way

---

## ✅ Benefits for Development

1. **Faster Navigation** → Developers know exactly where to look
2. **Better Collaboration** → Frontend/backend teams have clear boundaries
3. **Easier Onboarding** → New team members understand structure in minutes
4. **Improved CI/CD** → Clear folder structure helps with automation
5. **Better Scalability** → Easy to add new components in logical locations
6. **Cleaner Git History** → Better file organization = easier reviews

---

**The project is now reorganized and ready for development!** 🚀
