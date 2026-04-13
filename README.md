# Carry Mark Management System (CMMS)

A production-grade university carry-mark (continuous assessment) tracking platform built with a modern stack: Next.js 14, FastAPI, PostgreSQL, and Docker.

**Status**: 🚀 Production-Ready Blueprint  
**Timeline**: 8 weeks development (Apr 9 - May 29) + 2 weeks UAT (Jun 1 - Jun 12)  
**Team**: 4-5 developers (2 backend, 2 frontend, 1 DevOps)

---

## 📋 Quick Overview

CMMS is a decentralized web application for university faculties to digitize and automate continuous assessment tracking, replacing manual Excel workflows with a secure Smart Grid environment.

- **5 User Roles**: Student, Lecturer, Coordinator, HOD (Head of Department), Admin
- **500+ Students per Course**: Virtual-scrolling Smart Grid for high-performance mark entry
- **Real-time Collaboration**: Optimistic locking, immutable audit trail for compliance
- **AI Anomaly Detection**: Z-score detection flags unusual mark patterns
- **Complete Security**: JWT auth, OTP reset, Row-Level Security (RLS), role-based access

---

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- Python 3.12+
- Node.js 18+
- Git

### Setup (One Command)

```bash
make bootstrap
make dev
```

Services available:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

---

## 📁 Project Structure

```
cmms/
├── frontend/          # Next.js 14 frontend (React, TypeScript, Tailwind)
│   ├── app/
│   ├── components/
│   ├── hooks/
│   ├── lib/
│   ├── stores/        # Zustand state management
│   ├── styles/
│   ├── types/
│   ├── __tests__/     # Vitest unit tests
│   ├── cypress/       # E2E tests
│   └── package.json
├── backend/           # FastAPI backend (Python, SQLAlchemy, Pydantic)
│   ├── core/          # Config, security, JWT utilities
│   ├── models/        # SQLAlchemy ORM models
│   ├── schemas/       # Pydantic validation schemas
│   ├── routers/       # API endpoint handlers
│   ├── services/      # Business logic
│   ├── dependencies/  # FastAPI dependency injection
│   ├── migrations/    # Alembic DB migrations
│   ├── tests/         # Pytest unit/integration tests
│   ├── main.py        # FastAPI application entry
│   └── requirements.txt
├── database/          # PostgreSQL database
│   ├── init.sql       # Initial schema setup
│   └── triggers/      # PostgreSQL triggers
├── infrastructure/    # Docker, Nginx, environment configs
│   ├── docker/        # Dockerfiles for API and Web
│   ├── nginx/         # Nginx reverse proxy config
│   ├── envs/          # Environment configuration templates
│   └── redis/         # Redis cache configuration
├── documentation/     # Complete project documentation
│   ├── CMMS_PROJECT_MASTER.md
│   ├── JIRA_PROJECT_STRUCTURE.md
│   ├── CMMS_MONOREPO_STRUCTURE.md
│   ├── DOCUMENTATION_INDEX.md
│   ├── api/           # API specifications
│   └── diagrams/      # Architecture diagrams
├── scripts/           # Utility and bootstrap scripts
├── docker-compose.yml # Multi-service orchestration
├── Makefile           # Development automation (updated)
├── pyproject.toml     # Python project metadata
└── README.md          # This file
```

---

## 🛠️ Tech Stack

**Frontend**: React 18, Next.js 14, TypeScript, Tailwind CSS, Zustand  
**Backend**: FastAPI, SQLAlchemy 2.0, Pydantic v2, PostgreSQL 16  
**Database**: PostgreSQL with Row-Level Security, Redis for caching  
**Infrastructure**: Docker Compose, Nginx, GitHub Actions

---

## 📚 Documentation

- **[documentation/CMMS_PROJECT_MASTER.md](documentation/CMMS_PROJECT_MASTER.md)** - Complete specification (23 KB)
- **[documentation/JIRA_PROJECT_STRUCTURE.md](documentation/JIRA_PROJECT_STRUCTURE.md)** - All 53 user stories & sprints (47 KB) 
- **[documentation/CMMS_MONOREPO_STRUCTURE.md](documentation/CMMS_MONOREPO_STRUCTURE.md)** - Architecture details (57 KB)
- **[documentation/api/](documentation/api/)** - API specifications and architecture decisions
- **[documentation/diagrams/](documentation/diagrams/)** - Architecture and workflow diagrams

---

## 📞 Development Commands

```bash
make help              # Show all available commands
make bootstrap         # Install deps, migrate DB, seed data
make dev              # Start development stack
make test             # Run all tests
make lint             # Check code quality
make format           # Auto-format code
make migrate          # Run database migrations
```

---

**Ready to start coding? Run `make bootstrap` and begin! 🚀**
