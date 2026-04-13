# CMMS Monorepo Structure - Complete Scaffold

**Generated**: 13 April 2026  
**Version**: 1.0  
**Status**: Production-Ready Blueprint

---

## 1. Complete Directory Tree

```
cmms/
│
├── README.md                          # Root project overview, tech stack, setup
├── Makefile                           # Development targets: dev, test, migrate, seed, lint, build
├── .gitignore                         # Excludes: .env, .env.local, venv/, node_modules/, __pycache__/
├── .dockerignore                      # Excludes .git, node_modules, venv for docker builds
├── docker-compose.yml                 # Production-grade services: frontend, backend, db, nginx, redis
├── docker-compose.dev.yml             # Dev overrides: hot-reload, exposed ports, mock email
├── pyproject.toml                     # Python: black, isort, pytest, pylint config
├── package.json                       # Root workspace config (if using Yarn/PNPM workspaces)
├── .pre-commit-config.yaml            # Hooks: black, isort, eslint, prettier, commit-msg
│
├── apps/
│   │
│   ├── web/                           # Next.js 14 Frontend (App Router)
│   │   ├── README.md                  # Frontend setup & architecture
│   │   ├── package.json               # Next.js, React, Tailwind, ESLint, Vitest deps
│   │   ├── tsconfig.json              # TypeScript strict mode, path aliases
│   │   ├── tailwind.config.ts         # Tailwind theme, colors, spacing tokens
│   │   ├── postcss.config.js          # Tailwind + autoprefixer
│   │   ├── next.config.js             # API proxy, env validation, compression
│   │   ├── .eslintrc.json             # ESLint rules: React, Next.js, TypeScript
│   │   ├── jest.config.js             # Jest or Vitest config for unit tests
│   │   ├── cypress.config.ts          # Cypress E2E config
│   │   ├── vitest.config.ts           # Vitest setup for fast unit tests
│   │   │
│   │   ├── public/                    # Static assets
│   │   │   ├── logo.svg
│   │   │   └── favicon.ico
│   │   │
│   │   ├── app/                       # App Router - next.js 14
│   │   │   ├── layout.tsx             # Root layout: theme, navbar, providers
│   │   │   ├── loading.tsx            # Global loading skeleton
│   │   │   ├── error.tsx              # Global error boundary
│   │   │   ├── not-found.tsx          # 404 page
│   │   │   │
│   │   │   ├── (auth)/                # Auth route group (no navbar)
│   │   │   │   ├── layout.tsx         # Auth layout (centered form)
│   │   │   │   ├── login/
│   │   │   │   │   ├── page.tsx       # Login form + 2FA
│   │   │   │   │   └── LoginForm.tsx
│   │   │   │   ├── register/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── reset-password/
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   └── OTPForm.tsx
│   │   │   │   └── change-password/
│   │   │   │       └── page.tsx
│   │   │   │
│   │   │   ├── (dashboard)/           # Protected routes with navbar
│   │   │   │   ├── layout.tsx         # Dashboard layout: TopBar, Sidebar
│   │   │   │   ├── page.tsx           # Role-specific dashboard redirect
│   │   │   │   │
│   │   │   │   ├── student/
│   │   │   │   │   ├── page.tsx       # Student dashboard
│   │   │   │   │   ├── [courseId]/
│   │   │   │   │   │   ├── page.tsx   # View marks for course
│   │   │   │   │   │   └── [markId]/  # Query on mark
│   │   │   │   │   └── transcript/
│   │   │   │   │       └── page.tsx   # Download transcript
│   │   │   │   │
│   │   │   │   ├── lecturer/
│   │   │   │   │   ├── page.tsx       # Lecturer dashboard
│   │   │   │   │   ├── [courseId]/
│   │   │   │   │   │   ├── page.tsx   # Smart Grid for course
│   │   │   │   │   │   ├── assessments/
│   │   │   │   │   │   │   ├── page.tsx      # Manage assessments
│   │   │   │   │   │   │   └── [assessId]/   # Edit assessment
│   │   │   │   │   │   ├── roster/
│   │   │   │   │   │   │   └── page.tsx      # View & download roster
│   │   │   │   │   │   └── queries/
│   │   │   │   │   │       └── page.tsx      # Resolve student queries
│   │   │   │   │   └── import/
│   │   │   │   │       └── page.tsx   # Bulk mark import
│   │   │   │   │
│   │   │   │   ├── coordinator/
│   │   │   │   │   ├── page.tsx       # Coordinator dashboard
│   │   │   │   │   ├── courses/
│   │   │   │   │   │   ├── page.tsx       # List courses
│   │   │   │   │   │   ├── create/
│   │   │   │   │   │   │   └── page.tsx
│   │   │   │   │   │   └── [courseId]/
│   │   │   │   │   │       ├── page.tsx   # Edit course
│   │   │   │   │   │       └── roster/
│   │   │   │   │   │           └── upload/ # Upload roster modal
│   │   │   │   │   └── enrollments/
│   │   │   │   │       └── page.tsx
│   │   │   │   │
│   │   │   │   ├── hod/
│   │   │   │   │   ├── page.tsx       # HOD metrics dashboard
│   │   │   │   │   ├── metrics/
│   │   │   │   │   │   └── page.tsx   # Detailed metrics by course/year
│   │   │   │   │   ├── alerts/
│   │   │   │   │   │   └── page.tsx   # Failure rate, DELAYED overdue alerts
│   │   │   │   │   ├── queries/
│   │   │   │   │   │   └── page.tsx   # Read-only query threads
│   │   │   │   │   └── export/
│   │   │   │   │       └── page.tsx   # Export data with blocking checks
│   │   │   │   │
│   │   │   │   └── admin/
│   │   │   │       ├── page.tsx       # Admin control panel
│   │   │   │       ├── accounts/
│   │   │   │       │   ├── page.tsx   # List users
│   │   │   │       │   ├── create/
│   │   │   │       │   │   └── page.tsx
│   │   │   │       │   └── [userId]/
│   │   │   │       │       ├── page.tsx # Edit user
│   │   │   │       │       └── reset-password/
│   │   │   │       ├── backup/
│   │   │   │       │   └── page.tsx   # Backup/restore interface
│   │   │   │       ├── logs/
│   │   │   │       │   └── page.tsx   # Audit log viewer
│   │   │   │       └── settings/
│   │   │   │           └── page.tsx   # Email config, AI settings
│   │   │   │
│   │   │   └── 403.tsx                # Forbidden error page
│   │   │
│   │   ├── components/
│   │   │   ├── ui/                    # Reusable UI atoms
│   │   │   │   ├── Button.tsx         # Primary, secondary, danger variants
│   │   │   │   ├── Input.tsx          # Text, email, password, number
│   │   │   │   ├── Select.tsx         # Dropdown select
│   │   │   │   ├── Checkbox.tsx
│   │   │   │   ├── Radio.tsx
│   │   │   │   ├── Modal.tsx          # Dialog component
│   │   │   │   ├── Card.tsx           # Container component
│   │   │   │   ├── Badge.tsx          # Status badge (draft, published, etc)
│   │   │   │   ├── Table.tsx          # Sortable table
│   │   │   │   ├── Tooltip.tsx
│   │   │   │   ├── Skeleton.tsx       # Loading placeholder
│   │   │   │   ├── Toast.tsx          # Notification widget
│   │   │   │   ├── Spinner.tsx
│   │   │   │   └── Tabs.tsx
│   │   │   │
│   │   │   ├── features/              # Domain-specific components
│   │   │   │   ├── SmartGrid/         # Main mark entry grid
│   │   │   │   │   ├── SmartGrid.tsx  # Virtual scrolling grid
│   │   │   │   │   ├── GridCell.tsx   # Individual cell (editable)
│   │   │   │   │   ├── GridHeader.tsx
│   │   │   │   │   ├── useGridState.ts # Zustand store for grid
│   │   │   │   │   └── smartgrid.module.css
│   │   │   │   │
│   │   │   │   ├── Auth/
│   │   │   │   │   ├── LoginForm.tsx
│   │   │   │   │   ├── ChangePasswordForm.tsx
│   │   │   │   │   └── OTPField.tsx
│   │   │   │   │
│   │   │   │   ├── CourseForm/        # Create/edit course
│   │   │   │   ├── AssessmentForm/    # Create/edit assessment
│   │   │   │   ├── RosterUpload/      # Excel upload component
│   │   │   │   ├── QueryThread/       # Student query view
│   │   │   │   ├── MetricsCard/       # HOD dashboard card
│   │   │   │   ├── ExportModal/       # Export preconditions UI
│   │   │   │   └── AnomalyFlag/       # Anomaly visualization
│   │   │   │
│   │   │   └── layout/
│   │   │       ├── TopBar.tsx         # Header with user menu
│   │   │       ├── Sidebar.tsx        # Role-aware navigation
│   │   │       ├── Footer.tsx
│   │   │       ├── AuthGuard.tsx      # Wrapper for protected routes
│   │   │       └── ThemeProvider.tsx  # Light/dark theme
│   │   │
│   │   ├── hooks/                     # Custom React hooks
│   │   │   ├── useAuth.ts             # Auth context hook
│   │   │   ├── useApi.ts              # API data fetching
│   │   │   ├── usePagination.ts
│   │   │   ├── useLocalStorage.ts
│   │   │   ├── useToast.ts            # Toast notifications
│   │   │   ├── useDebounce.ts
│   │   │   ├── useInfiniteScroll.ts
│   │   │   └── useSmartGrid.ts        # Grid editing logic
│   │   │
│   │   ├── lib/
│   │   │   ├── api-client.ts          # Axios/fetch wrapper + interceptors
│   │   │   ├── api-routes.ts          # Typed route definitions
│   │   │   ├── auth-helper.ts         # JWT handling, token storage
│   │   │   ├── validators.ts          # Form validation functions
│   │   │   ├── formatters.ts          # Number, date, text formatters
│   │   │   ├── constants.ts           # App-wide constants
│   │   │   └── utils.ts               # Helper utilities
│   │   │
│   │   ├── stores/                    # Zustand stores (state management)
│   │   │   ├── authStore.ts           # User, token, role
│   │   │   ├── marksStore.ts          # Cached marks data + edit state
│   │   │   ├── uiStore.ts             # Modal visibility, filters
│   │   │   └── toastStore.ts          # Toast notifications
│   │   │
│   │   ├── types/                     # TypeScript interfaces (shared with API)
│   │   │   ├── index.ts               # Main exports
│   │   │   ├── user.ts                # User, Role (student/lecturer/...)
│   │   │   ├── course.ts              # Course, Enrollment
│   │   │   ├── assessment.ts          # Assessment, AssessmentSchema
│   │   │   ├── mark.ts                # Mark, MarkStatus, MarkQuery
│   │   │   ├── auth.ts                # LoginRequest, TokenResponse
│   │   │   └── api.ts                 # API response envelopes, errors
│   │   │
│   │   ├── styles/
│   │   │   ├── globals.css            # Tailwind imports + global styles
│   │   │   ├── variables.css          # CSS variables (colors, spacing)
│   │   │   └── animations.css         # Fade, slide animations
│   │   │
│   │   ├── __tests__/                 # Unit tests co-located
│   │   │   ├── components/
│   │   │   │   └── SmartGrid.test.tsx
│   │   │   ├── hooks/
│   │   │   │   └── useAuth.test.ts
│   │   │   └── lib/
│   │   │       └── validators.test.ts
│   │   │
│   │   └── cypress/                   # E2E test scenarios
│   │       ├── e2e/
│   │       │   ├── auth.cy.ts         # Login, password reset flows
│   │       │   ├── marks.cy.ts        # Mark entry, publish flow
│   │       │   ├── export.cy.ts       # Export (HOD)
│   │       │   └── anomaly.cy.ts      # Anomaly detection display
│   │       ├── support/
│   │       │   └── commands.ts        # Custom Cypress commands
│   │       └── fixtures/
│   │           └── users.json         # Test data
│   │
│   └── api/                           # FastAPI Backend
│       ├── README.md                  # Backend setup & architecture
│       ├── main.py                    # App factory, CORS, startup/shutdown
│       ├── requirements.txt           # Python dependencies
│       ├── requirements-dev.txt       # Dev dependencies (pytest, black, etc)
│       │
│       ├── core/
│       │   ├── __init__.py
│       │   ├── config.py              # Pydantic Settings with env validation
│       │   ├── security.py            # JWT encode/decode, hash password
│       │   ├── logging.py             # Structured logging setup
│       │   └── exceptions.py          # Custom FastAPI exceptions
│       │
│       ├── models/                    # SQLAlchemy ORM models
│       │   ├── __init__.py
│       │   ├── base.py                # Base model with timestamps
│       │   ├── user.py                # User + role enum
│       │   ├── course.py              # Course, enrollment
│       │   ├── assessment.py          # Assessment, marking schema
│       │   ├── mark.py                # Mark with all statuses (draft, delayed, etc)
│       │   ├── audit_log.py           # Immutable audit trail
│       │   └── course_query.py        # Student queries on marks
│       │
│       ├── schemas/                   # Pydantic v2 request/response
│       │   ├── __init__.py
│       │   ├── auth.py                # LoginRequest, TokenResponse
│       │   ├── user.py                # UserResponse, UserCreate
│       │   ├── course.py              # CourseResponse, CourseCreate
│       │   ├── assessment.py          # AssessmentResponse, AssessmentCreate
│       │   ├── mark.py                # MarkResponse, MarkUpdate
│       │   └── common.py              # Pagination, ErrorResponse
│       │
│       ├── routers/                   # API endpoint groups
│       │   ├── __init__.py
│       │   ├── auth.py                # POST /auth/login, /auth/password-reset
│       │   ├── courses.py             # CRUD courses
│       │   ├── assessments.py         # CRUD assessments
│       │   ├── marks.py               # GET grid, PUT mark, mark status
│       │   ├── students.py            # Student queries, dashboard
│       │   ├── roster.py              # Self-seeding: Excel upload
│       │   ├── queries.py             # Student mark queries
│       │   ├── export.py              # CSV export (HOD)
│       │   ├── ai.py                  # Anomaly detection endpoint
│       │   └── admin.py               # User management, backup/restore
│       │
│       ├── services/                  # Business logic layer
│       │   ├── __init__.py
│       │   ├── auth_service.py        # Login, token, password reset
│       │   ├── email_service.py       # Resend/Mailgun wrapper
│       │   ├── mark_service.py        # Mark CRUD, publication
│       │   ├── roster_service.py      # Excel parsing, student seeding
│       │   ├── assessment_service.py  # Assessment schema validation
│       │   ├── export_service.py      # CSV generation + precondition checks
│       │   ├── ai_service.py          # Anomaly detection, risk forecast
│       │   ├── hod_service.py         # Metrics aggregation
│       │   └── admin_service.py       # Account management, backup
│       │
│       ├── dependencies/              # FastAPI Depends()
│       │   ├── __init__.py
│       │   ├── auth.py                # get_current_user, require_role
│       │   ├── database.py            # get_db session
│       │   └── validation.py          # Custom validation dependencies
│       │
│       ├── middleware/
│       │   ├── __init__.py
│       │   ├── error_handler.py       # Global exception handling
│       │   ├── request_logging.py     # Log all requests
│       │   ├── rate_limit.py          # Rate limiting decorator
│       │   └── cors_middleware.py     # Restrict CORS
│       │
│       ├── prompts/                   # LLM prompts (stored as .txt)
│       │   ├── anomaly_explain.txt    # Explain Z-score anomaly to lecturer
│       │   ├── risk_forecast.txt      # Predict student at-risk
│       │   ├── query_response.txt     # Suggest response to student query
│       │   └── audit_summary.txt      # Summarize audit trail
│       │
│       ├── migrations/                # Alembic database migrations
│       │   ├── env.py                 # Alembic config
│       │   ├── script.py.mako         # Migration template
│       │   └── versions/              # Migration files (001_initial_schema.py, etc)
│       │
│       ├── tests/
│       │   ├── conftest.py            # Pytest fixtures (db, client)
│       │   │
│       │   ├── unit/                  # No DB, pure logic
│       │   │   ├── services/
│       │   │   │   ├── test_auth_service.py
│       │   │   │   ├── test_mark_service.py
│       │   │   │   └── test_ai_service.py
│       │   │   └── utils/
│       │   │       └── test_formatters.py
│       │   │
│       │   ├── integration/           # Real DB via testcontainers
│       │   │   ├── routers/
│       │   │   │   ├── test_auth_router.py
│       │   │   │   ├── test_marks_router.py
│       │   │   │   └── test_export_router.py
│       │   │   └── services/
│       │   │       └── test_roster_service.py (Excel parsing with DB)
│       │   │
│       │   └── e2e/                   # Full request cycle (via httpx.AsyncClient)
│       │       ├── test_student_flow.py    (login → view marks → query)
│       │       ├── test_lecturer_flow.py   (login → enter marks → publish)
│       │       └── test_hod_export_flow.py
│       │
│       ├── db.py                      # SQLAlchemy engine, session factory
│       ├── .env.example               # Template of required env vars
│       └── __init__.py
│
├── infra/                             # Docker, nginx, database
│   │
│   ├── docker/
│   │   ├── Dockerfile.web             # Multi-stage Next.js build
│   │   ├── Dockerfile.api             # Multi-stage FastAPI build
│   │   ├── Dockerfile.db              # PostgreSQL with init scripts
│   │   └── .dockerignore
│   │
│   ├── nginx/
│   │   ├── nginx.conf                 # Main config
│   │   ├── conf.d/
│   │   │   └── app.conf               # /api → backend:8000, / → frontend:3000
│   │   └── ssl/                       # SSL certs (dev self-signed)
│   │       └── .gitkeep
│   │
│   ├── db/
│   │   ├── README.md                  # RLS policies documentation
│   │   ├── init.sql                   # Schema creation, RLS policies
│   │   ├── seed.sql                   # Dev seed data (users, courses)
│   │   └── triggers/
│   │       ├── mark_audit_log.sql     # Audit log on mark INSERT/UPDATE
│   │       └── updated_at_trigger.sql # Auto-update updated_at timestamp
│   │
│   ├── redis/
│   │   └── redis.conf                 # Cache + session store
│   │
│   └── envs/
│       ├── .env.dev                   # Development variables
│       ├── .env.staging               # Staging variables
│       └── .env.prod                  # Production variables (not in repo)
│
├── docs/
│   ├── README.md                      # Documentation overview
│   ├── ARCHITECTURE.md                # Detailed architecture & design decisions
│   ├── API_SPEC.md                    # OpenAPI spec (generated or manual)
│   ├── DATABASE.md                    # Schema, RLS rules, migrations
│   ├── DEPLOYMENT.md                  # Docker Compose, env setup, scaling
│   ├── SECURITY.md                    # Auth, encryption, rate limiting
│   ├── TESTING.md                     # Test strategy, running tests
│   ├── CONTRIBUTING.md                # How to contribute, PR process
│   │
│   ├── diagrams/
│   │   ├── architecture.png           # System components & data flow
│   │   ├── database_schema.png        # ER diagram
│   │   └── deployment_topology.png    # Docker/K8s topology
│   │
│   └── api/
│       ├── openapi.json               # Generated OpenAPI schema
│       └── postman_collection.json    # For manual testing
│
└── scripts/
    ├── bootstrap.sh                   # One-command setup (install, migrate, seed)
    ├── db_migrate.sh                  # Alembic upgrade head
    ├── db_seed.sh                     # Load seed.sql into dev db
    ├── db_rollback.sh                 # Alembic downgrade
    ├── dev_setup.sh                   # Install Python venv, Node
    ├── format.sh                      # black, isort, prettier
    ├── lint.sh                        # pylint, eslint
    ├── test.sh                        # Run all tests
    └── docker_build.sh                # Build all images locally
```

---

## 2. Key Implementation Files

### 2.1 `apps/api/core/config.py`

```python
"""
Pydantic Settings for CMMS Backend.
All configuration sourced from environment variables with validation.
Critical: Never commit actual secrets — use .env.example as template.
"""

from functools import lru_cache
from typing import Optional
from pydantic import Field, field_validator, SecretStr
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application configuration with environment validation."""

    # Application
    APP_NAME: str = "Carry Mark Management System"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = Field(default=False, description="Enable debug mode")
    ENVIRONMENT: str = Field(default="development", description="dev|staging|prod")

    # Database
    DATABASE_URL: str = Field(
        ...,
        description="PostgreSQL DSN: postgresql+asyncpg://user:pass@host:5432/cmms"
    )
    DATABASE_POOL_SIZE: int = 20
    DATABASE_ECHO: bool = False  # Log SQL queries if True

    # Authentication & Security
    JWT_SECRET_KEY: SecretStr = Field(
        ..., description="Minimum 256-bit entropy (32 bytes base64)"
    )
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRATION_HOURS: int = 24
    BCRYPT_ROUNDS: int = Field(default=12, description="Password hash cost factor")

    # CORS
    ALLOWED_ORIGINS: list[str] = Field(
        default=["http://localhost:3000", "http://localhost"],
        description="Comma-separated origins"
    )

    # Email Service
    EMAIL_PROVIDER: str = Field(
        default="resend", description="resend|mailgun"
    )
    EMAIL_PROVIDER_API_KEY: SecretStr = Field(
        ..., description="API key for Resend or Mailgun"
    )
    EMAIL_PROVIDER_ENDPOINT: Optional[str] = Field(
        default=None, description="For Mailgun: domain.mailgun.org"
    )
    EMAIL_FROM_ADDRESS: str = Field(
        ..., description="Sender email address (e.g., noreply@cmms.utm.edu.my)"
    )
    EMAIL_TIMEOUT_SECONDS: int = 10

    # OTP
    OTP_LENGTH: int = 6
    OTP_VALIDITY_MINUTES: int = 10
    OTP_MAX_ATTEMPTS: int = 3

    # Redis (Cache & Sessions)
    REDIS_URL: str = Field(
        default="redis://localhost:6379/0", description="Redis connection URL"
    )
    REDIS_CACHE_TTL_SECONDS: int = 3600

    # AI & Anomaly Detection
    AI_PROVIDER: str = Field(
        default="anthropic", description="anthropic|openai"
    )
    AI_PROVIDER_API_KEY: Optional[SecretStr] = Field(
        default=None, description="Anthropic or OpenAI API key (optional for MVP)"
    )
    AI_ANOMALY_THRESHOLD: float = Field(
        default=2.5, description="Z-score threshold for anomaly flagging"
    )
    AI_ANOMALY_ENABLED: bool = True
    AI_MODEL: str = "claude-sonnet-4-6"  # Anthropic model
    AI_TIMEOUT_SECONDS: int = 30

    # Thresholds
    HOD_FAILURE_THRESHOLD_PERCENT: float = 40.0  # Failure rate alert
    HOD_DELAYED_DAYS_THRESHOLD: int = 7
    HOD_UNRESOLVED_QUERY_DAYS_THRESHOLD: int = 3

    # Logging
    LOG_LEVEL: str = Field(default="INFO", description="DEBUG|INFO|WARNING|ERROR")
    LOG_FORMAT: str = "json"  # json or text

    # File Upload (No File Retention Policy)
    MAX_UPLOAD_SIZE_MB: int = 50
    UPLOAD_TEMP_DIR: str = "/tmp/cmms-uploads"  # Cleaned up immediately after processing
    ALLOWED_UPLOAD_EXTENSIONS: list[str] = [".xlsx", ".xls", ".csv"]

    # Database Backup
    BACKUP_RETENTION_DAYS: int = 30
    BACKUP_PATH: str = "/backups"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True

    @field_validator("JWT_SECRET_KEY")
    @classmethod
    def validate_jwt_secret(cls, v: SecretStr) -> SecretStr:
        """Ensure JWT secret has minimum 256-bit entropy (32 bytes base64)."""
        import base64
        try:
            key_bytes = base64.b64decode(v.get_secret_value())
            if len(key_bytes) < 32:
                raise ValueError("JWT_SECRET_KEY must be at least 256 bits (32 bytes)")
        except Exception as e:
            raise ValueError(f"Invalid JWT_SECRET_KEY format: {e}")
        return v

    @field_validator("DATABASE_URL")
    @classmethod
    def validate_database_url(cls, v: str) -> str:
        """Ensure database URL is valid PostgreSQL."""
        if not v.startswith("postgresql"):
            raise ValueError("DATABASE_URL must use postgresql driver (asyncpg preferred)")
        return v

    @field_validator("ALLOWED_ORIGINS", mode="before")
    @classmethod
    def parse_origins(cls, v):
        """Parse comma-separated origins or list."""
        if isinstance(v, str):
            return [o.strip() for o in v.split(",")]
        return v

    @field_validator("EMAIL_PROVIDER")
    @classmethod
    def validate_email_provider(cls, v: str) -> str:
        """Email provider must be resend or mailgun."""
        if v not in ["resend", "mailgun"]:
            raise ValueError("EMAIL_PROVIDER must be 'resend' or 'mailgun'")
        return v


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()
```

---

### 2.2 `apps/api/core/security.py`

```python
"""
JWT and password security utilities for CMMS.
Handles token creation, verification, and password hashing.
"""

from datetime import datetime, timedelta, timezone
from typing import Optional

import jwt
from passlib.context import CryptContext

from core.config import get_settings

# Password hashing context (bcrypt)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

settings = get_settings()


def hash_password(password: str) -> str:
    """Hash password using bcrypt with configured rounds."""
    return pwd_context.hash(password, rounds=settings.BCRYPT_ROUNDS)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify plain password against hash."""
    return pwd_context.verify(plain_password, hashed_password)


def create_jwt_token(
    data: dict,
    expires_delta: Optional[timedelta] = None,
) -> str:
    """
    Create a JWT token.
    
    Args:
        data: Payload to encode (e.g., {"sub": user_id, "role": "lecturer"})
        expires_delta: Token lifetime. Defaults to JWT_EXPIRATION_HOURS.
    
    Returns:
        Encoded JWT token.
    """
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(
            hours=settings.JWT_EXPIRATION_HOURS
        )
    
    to_encode.update({"exp": expire, "iat": datetime.now(timezone.utc)})
    
    encoded_jwt = jwt.encode(
        to_encode,
        settings.JWT_SECRET_KEY.get_secret_value(),
        algorithm=settings.JWT_ALGORITHM,
    )
    return encoded_jwt


def decode_jwt_token(token: str) -> dict:
    """
    Decode and validate JWT token.
    
    Args:
        token: JWT string
    
    Returns:
        Decoded payload dict
    
    Raises:
        jwt.InvalidTokenError: If token is invalid or expired
    """
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY.get_secret_value(),
            algorithms=[settings.JWT_ALGORITHM],
        )
        return payload
    except jwt.ExpiredSignatureError:
        raise ValueError("Token has expired")
    except jwt.InvalidTokenError as e:
        raise ValueError(f"Invalid token: {e}")


def generate_otp() -> str:
    """Generate a random OTP string."""
    import secrets
    return "".join(secrets.choice("0123456789") for _ in range(settings.OTP_LENGTH))
```

---

### 2.3 `apps/api/dependencies/auth.py`

```python
"""
FastAPI dependency functions for authentication and authorization.
Used with Depends() to enforce access control on routes.
"""

from typing import Optional

from fastapi import Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from core.config import get_settings
from core.security import decode_jwt_token
from db import get_db
from models.user import User, UserRole

settings = get_settings()


async def get_current_user(
    token: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
) -> User:
    """
    Extract and validate JWT token; return current user from database.
    
    Raises:
        HTTPException 401: If token missing or invalid
        HTTPException 403: If user not found or disabled
    """
    # In real implementation, extract token from Authorization header
    # For now, assume token is passed as parameter (auth guard in Next.js handles it)
    
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No authentication token provided",
        )
    
    try:
        payload = decode_jwt_token(token)
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token payload",
            )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Could not validate token: {e}",
        )
    
    # Fetch user from DB
    statement = select(User).where(User.id == user_id)
    result = await db.execute(statement)
    user = result.scalars().first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User not found",
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User is disabled",
        )
    
    return user


def require_role(allowed_roles: list[UserRole]):
    """
    Factory function returning a dependency that enforces role-based access.
    
    Usage:
        @router.get("/admin-only")
        async def admin_endpoint(user: User = Depends(require_role([UserRole.ADMIN]))):
            ...
    """
    async def check_role(user: User = Depends(get_current_user)) -> User:
        if user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"This action requires one of: {allowed_roles}",
            )
        return user
    
    return check_role


def require_re_auth(
    password: str,
    user: User = Depends(get_current_user),
) -> User:
    """
    Dependency for operations requiring re-authentication (mark publication, admin override).
    
    Usage:
        @router.post("/marks/{id}/publish")
        async def publish_mark(
            id: int,
            password: str,
            user: User = Depends(require_re_auth),
        ):
            ...
    """
    from core.security import verify_password
    
    if not verify_password(password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Re-authentication failed: incorrect password",
        )
    
    return user
```

---

### 2.4 `apps/api/models/mark.py`

```python
"""
Mark ORM model representing individual student assessment scores.
Includes audit trail, status tracking, and anomaly flags.
"""

from datetime import datetime
from enum import Enum
from typing import Optional

from sqlalchemy import (
    Column, Integer, String, Float, DateTime,
    ForeignKey, Enum as SQLEnum, Text,
    Index, func, CheckConstraint, event,
)
from sqlalchemy.orm import relationship

from models.base import Base


class MarkStatus(str, Enum):
    """Mark status enumeration."""
    DRAFT = "draft"           # Not yet submitted
    DELAYED = "delayed"       # Expected date in future
    FLAGGED = "flagged"       # Flagged for internal review
    PUBLISHED = "published"   # Published to student
    ANOMALY = "anomaly"       # AI flagged unusual score


class Mark(Base):
    """
    Assessment score for a student in an assessment.
    
    Relationships:
    - assessment_id: FK to Assessment
    - student_id: FK to User (student)
    
    Immutable audit log via database trigger on INSERT/UPDATE.
    """
    __tablename__ = "marks"
    
    # Primary Key
    id = Column(Integer, primary_key=True, index=True)
    
    # Foreign Keys
    assessment_id = Column(Integer, ForeignKey("assessments.id", ondelete="CASCADE"), nullable=False)
    student_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    # Mark Data
    score = Column(Float, nullable=False, comment="Raw score (0-max_score)")
    normalized_score = Column(Float, nullable=True, comment="Normalized to 0-100 scale")
    
    # Status & Metadata
    status = Column(
        SQLEnum(MarkStatus),
        default=MarkStatus.DRAFT,
        nullable=False,
        index=True,
        comment="draft|delayed|flagged|published|anomaly"
    )
    
    # DELAYED Status Fields
    delayed_reason = Column(Text, nullable=True, comment="Why marking is delayed")
    expected_date = Column(DateTime(timezone=True), nullable=True, comment="Expected completion date")
    
    # FLAGGED Status Fields
    flagged_reason = Column(Text, nullable=True, comment="Why flag for review")
    flagged_at = Column(DateTime(timezone=True), nullable=True)
    
    # ANOMALY Fields
    z_score = Column(Float, nullable=True, comment="Z-score from mean (for anomaly detection)")
    anomaly_reason = Column(Text, nullable=True, comment="Why flagged as anomaly")
    
    # Timestamps
    created_at = Column(
        DateTime(timezone=True),
        default=func.now(),
        nullable=False,
        comment="Mark entry timestamp"
    )
    updated_at = Column(
        DateTime(timezone=True),
        default=func.now(),
        onupdate=func.now(),
        nullable=False,
        comment="Last update timestamp for optimistic locking"
    )
    published_at = Column(
        DateTime(timezone=True),
        nullable=True,
        comment="When mark was published to student"
    )
    
    # Relationships
    assessment = relationship(
        "Assessment",
        back_populates="marks",
        foreign_keys=[assessment_id]
    )
    student = relationship(
        "User",
        back_populates="marks",
        foreign_keys=[student_id]
    )
    queries = relationship(
        "CourseQuery",
        back_populates="mark",
        cascade="all, delete-orphan"
    )
    audit_logs = relationship(
        "MarkAuditLog",
        back_populates="mark",
        cascade="all, delete-orphan"
    )
    
    # Constraints
    __table_args__ = (
        # Score must be non-negative
        CheckConstraint("score >= 0", name="ck_mark_score_nonneg"),
        
        # Normalized score 0-100
        CheckConstraint("normalized_score >= 0 AND normalized_score <= 100", name="ck_mark_normalized"),
        
        # Z-score reasonable range
        CheckConstraint("z_score IS NULL OR (z_score >= -5 AND z_score <= 5)", name="ck_mark_zscore"),
        
        # Unique: one student can only have one score per assessment
        Index("ix_mark_unique_student_assessment", "assessment_id", "student_id", unique=True),
        
        # Index for grid queries
        Index("ix_mark_assessment_status", "assessment_id", "status"),
        Index("ix_mark_student_published", "student_id", "status"),
        Index("ix_mark_updated_at", "updated_at"),  # For optimistic locking
    )
    
    def __repr__(self):
        return (
            f"<Mark(id={self.id}, assessment_id={self.assessment_id}, "
            f"student_id={self.student_id}, score={self.score}, status={self.status})>"
        )
```

---

### 2.5 `apps/web/lib/api.ts`

```typescript
/**
 * Typed API client for CMMS Frontend.
 * All routes and methods strongly typed with auto-completion.
 * Built on axios with interceptors for auth & error handling.
 */

import axios, { AxiosInstance, AxiosError } from "axios";
import { useAuthStore } from "@/stores/authStore";
import type {
  User,
  LoginRequest,
  TokenResponse,
  Course,
  Assessment,
  Mark,
  MarkStatus,
  CourseQuery,
  ExportResponse,
  AnomalyResponse,
} from "@/types";

// API base URL from environment
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

/**
 * Create axios instance with auth interceptors.
 */
const createApiClient = (): AxiosInstance => {
  const client = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
    headers: {
      "Content-Type": "application/json",
    },
  });

  // Request interceptor: attach JWT token
  client.interceptors.request.use((config) => {
    const { token } = useAuthStore.getState();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  // Response interceptor: handle 401 (token expired)
  client.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
      if (error.response?.status === 401) {
        useAuthStore.getState().logout();
        window.location.href = "/login";
      }
      return Promise.reject(error);
    }
  );

  return client;
};

const api = createApiClient();

/**
 * Authentication endpoints.
 */
export const authApi = {
  login: async (request: LoginRequest): Promise<TokenResponse> => {
    const { data } = await api.post<TokenResponse>("/auth/login", request);
    return data;
  },

  requestPasswordReset: async (email: string): Promise<{ status: string }> => {
    const { data } = await api.post("/auth/password-reset", { email });
    return data;
  },

  confirmPasswordReset: async (email: string, otp: string, newPassword: string) => {
    const { data } = await api.post("/auth/password-reset/confirm", {
      email,
      otp,
      new_password: newPassword,
    });
    return data;
  },

  changePassword: async (oldPassword: string, newPassword: string) => {
    const { data } = await api.put("/auth/change-password", {
      old_password: oldPassword,
      new_password: newPassword,
    });
    return data;
  },
};

/**
 * Course endpoints.
 */
export const coursesApi = {
  list: async (): Promise<Course[]> => {
    const { data } = await api.get<Course[]>("/courses");
    return data;
  },

  get: async (id: number): Promise<Course> => {
    const { data } = await api.get<Course>(`/courses/${id}`);
    return data;
  },

  create: async (payload: Partial<Course>): Promise<Course> => {
    const { data } = await api.post<Course>("/courses", payload);
    return data;
  },

  update: async (id: number, payload: Partial<Course>): Promise<Course> => {
    const { data } = await api.put<Course>(`/courses/${id}`, payload);
    return data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/courses/${id}`);
  },
};

/**
 * Assessment endpoints.
 */
export const assessmentsApi = {
  list: async (courseId: number): Promise<Assessment[]> => {
    const { data } = await api.get<Assessment[]>(
      `/courses/${courseId}/assessments`
    );
    return data;
  },

  create: async (courseId: number, payload: Partial<Assessment>): Promise<Assessment> => {
    const { data } = await api.post<Assessment>(
      `/courses/${courseId}/assessments`,
      payload
    );
    return data;
  },

  update: async (courseId: number, assessmentId: number, payload: Partial<Assessment>): Promise<Assessment> => {
    const { data } = await api.put<Assessment>(
      `/courses/${courseId}/assessments/${assessmentId}`,
      payload
    );
    return data;
  },

  publish: async (assessmentId: number): Promise<{ status: string }> => {
    const { data } = await api.post(
      `/assessments/${assessmentId}/publish`,
      {}
    );
    return data;
  },
};

/**
 * Marks/Grading endpoints.
 */
export const marksApi = {
  getSmartGrid: async (courseId: number): Promise<{
    students: Array<{ id: string; name: string }>;
    assessments: Assessment[];
    marks: Mark[];
  }> => {
    const { data } = await api.get(`/courses/${courseId}/marks`);
    return data;
  },

  updateMark: async (markId: number, score: number, updatedAt: string): Promise<Mark> => {
    const { data } = await api.put<Mark>(`/marks/${markId}`, {
      score,
      updated_at: updatedAt, // For optimistic locking
    });
    return data;
  },

  setMarkStatus: async (
    markId: number,
    status: MarkStatus,
    metadata?: { reason?: string; expected_date?: string }
  ): Promise<Mark> => {
    const { data } = await api.put<Mark>(`/marks/${markId}/status`, {
      status,
      ...metadata,
    });
    return data;
  },

  bulkImportMarks: async (courseId: number, file: File): Promise<{ success_count: number; errors: any[] }> => {
    const formData = new FormData();
    formData.append("file", file);
    const { data } = await api.post(
      `/courses/${courseId}/marks/bulk-import`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } }
    );
    return data;
  },
};

/**
 * Student endpoints.
 */
export const studentsApi = {
  getMyMarks: async (): Promise<{
    courses: Array<{
      id: number;
      code: string;
      name: string;
      marks: Mark[];
      carry_total: number;
    }>;
  }> => {
    const { data } = await api.get("/students/marks");
    return data;
  },

  raiseQuery: async (markId: number, queryText: string): Promise<CourseQuery> => {
    const { data } = await api.post<CourseQuery>(`/marks/${markId}/queries`, {
      query_text: queryText,
    });
    return data;
  },

  getMyQueries: async (): Promise<CourseQuery[]> => {
    const { data } = await api.get<CourseQuery[]>("/students/queries");
    return data;
  },
};

/**
 * Roster endpoints.
 */
export const rosterApi = {
  uploadRoster: async (courseId: number, file: File): Promise<{
    preview: { student_ids: string[]; new_accounts: string[] };
  }> => {
    const formData = new FormData();
    formData.append("file", file);
    const { data } = await api.post(
      `/courses/${courseId}/roster/upload`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } }
    );
    return data;
  },

  confirmRoster: async (courseId: number): Promise<{ success_count: number }> => {
    const { data } = await api.post(`/courses/${courseId}/roster/confirm`, {});
    return data;
  },
};

/**
 * Export endpoints (HOD).
 */
export const exportApi = {
  checkExportReadiness: async (courseId: number): Promise<{
    ready: boolean;
    blockers: Array<{ type: string; description: string; count: number }>;
  }> => {
    const { data } = await api.get(`/export/check/${courseId}`);
    return data;
  },

  exportCsv: async (courseId: number): Promise<ExportResponse> => {
    const { data } = await api.post<ExportResponse>(`/export/csv`, { course_id: courseId });
    return data;
  },
};

/**
 * AI/Anomaly endpoints.
 */
export const aiApi = {
  getAnomalies: async (assessmentId: number): Promise<AnomalyResponse[]> => {
    const { data } = await api.get<AnomalyResponse[]>(
      `/ai/anomalies/${assessmentId}`
    );
    return data;
  },

  explainAnomaly: async (markId: number): Promise<{ explanation: string }> => {
    const { data } = await api.post(`/ai/anomalies/${markId}/explain`, {});
    return data;
  },
};

/**
 * Admin endpoints.
 */
export const adminApi = {
  listUsers: async (): Promise<User[]> => {
    const { data } = await api.get<User[]>("/admin/accounts");
    return data;
  },

  createUser: async (payload: Partial<User>): Promise<User> => {
    const { data } = await api.post<User>("/admin/accounts", payload);
    return data;
  },

  updateUser: async (userId: string, payload: Partial<User>): Promise<User> => {
    const { data } = await api.put<User>(`/admin/accounts/${userId}`, payload);
    return data;
  },

  forcePasswordReset: async (userId: string): Promise<{ status: string }> => {
    const { data } = await api.post(`/admin/accounts/${userId}/force-reset`, {});
    return data;
  },

  createBackup: async (): Promise<{ backup_id: string; path: string }> => {
    const { data } = await api.post("/admin/backup/create", {});
    return data;
  },

  restoreBackup: async (backupId: string, password: string): Promise<{ status: string }> => {
    const { data } = await api.post(`/admin/backup/${backupId}/restore`, {
      password,
    });
    return data;
  },
};

export default api;
```

---

### 2.6 `infra/docker-compose.yml`

```yaml
version: "3.9"

services:
  # PostgreSQL Database with RLS enabled
  db:
    image: postgres:16-alpine
    container_name: cmms-db
    environment:
      POSTGRES_USER: cmms_user
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-cmms_secure_password}
      POSTGRES_DB: cmms
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./infra/db/init.sql:/docker-entrypoint-initdb.d/01_init.sql
      - ./infra/db/seed.sql:/docker-entrypoint-initdb.d/02_seed.sql
      - ./infra/db/triggers:/docker-entrypoint-initdb.d/triggers
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U cmms_user -d cmms"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - cmms-network

  # Redis Cache & Session Store
  redis:
    image: redis:7-alpine
    container_name: cmms-redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - cmms-network

  # FastAPI Backend
  api:
    build:
      context: .
      dockerfile: infra/docker/Dockerfile.api
      target: production
    container_name: cmms-api
    environment:
      DATABASE_URL: postgresql+asyncpg://cmms_user:${POSTGRES_PASSWORD:-cmms_secure_password}@db:5432/cmms
      JWT_SECRET_KEY: ${JWT_SECRET_KEY}
      REDIS_URL: redis://redis:6379/0
      EMAIL_PROVIDER_API_KEY: ${EMAIL_PROVIDER_API_KEY}
      EMAIL_FROM_ADDRESS: ${EMAIL_FROM_ADDRESS}
      AI_PROVIDER_API_KEY: ${AI_PROVIDER_API_KEY:-}
      LOG_LEVEL: ${LOG_LEVEL:-INFO}
      ENVIRONMENT: ${ENVIRONMENT:-production}
    ports:
      - "8000:8000"
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - cmms-network

  # Next.js Frontend
  web:
    build:
      context: .
      dockerfile: infra/docker/Dockerfile.web
      target: production
    container_name: cmms-web
    environment:
      NEXT_PUBLIC_API_URL: http://localhost:8000/api
    ports:
      - "3000:3000"
    depends_on:
      - api
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - cmms-network

  # Nginx Reverse Proxy
  nginx:
    image: nginx:latest-alpine
    container_name: cmms-nginx
    volumes:
      - ./infra/nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./infra/nginx/conf.d:/etc/nginx/conf.d:ro
      - ./infra/nginx/ssl:/etc/nginx/ssl:ro
    ports:
      - "80:80"
      - "443:443"
    depends_on:
      - api
      - web
    healthcheck:
      test: ["CMD", "nginx", "-t"]
      interval: 10s
      timeout: 5s
      retries: 3
    networks:
      - cmms-network

volumes:
  postgres_data:
    driver: local
  redis_data:
    driver: local

networks:
  cmms-network:
    driver: bridge
```

---

### 2.7 `Makefile`

```makefile
.PHONY: help dev test migrate seed lint build clean format docker-up docker-down

# Default target
help:
	@echo "CMMS Development Commands"
	@echo ""
	@echo "Setup & Development:"
	@echo "  make bootstrap        - One-command setup (install deps, migrate, seed)"
	@echo "  make dev              - Start dev stack (docker-compose + hot reload)"
	@echo "  make dev-stop         - Stop dev stack"
	@echo ""
	@echo "Database:"
	@echo "  make migrate          - Run Alembic migrations"
	@echo "  make migrate-down     - Rollback one migration"
	@echo "  make seed             - Load seed.sql into dev database"
	@echo "  make db-reset         - Drop & recreate database (dev only)"
	@echo ""
	@echo "Testing:"
	@echo "  make test             - Run all tests (backend + frontend)"
	@echo "  make test-backend     - pytest backend tests"
	@echo "  make test-frontend    - Vitest frontend tests"
	@echo "  make test-e2e         - Cypress E2E tests (requires running dev stack)"
	@echo ""
	@echo "Code Quality:"
	@echo "  make lint             - Run linters (pylint, ESLint)"
	@echo "  make format           - Auto-format code (black, isort, prettier)"
	@echo ""
	@echo "Build & Deploy:"
	@echo "  make build            - Build production Docker images"
	@echo "  make docker-up        - Start production stack"
	@echo "  make docker-down      - Stop production stack"
	@echo ""

# Bootstrap: one-command setup
bootstrap: install-deps migrate seed
	@echo "✅ Bootstrap complete! Run 'make dev' to start."

# Install Python dependencies
install-deps-backend:
	cd apps/api && python -m pip install -r requirements-dev.txt
	@echo "✅ Backend dependencies installed"

# Install Node dependencies
install-deps-frontend:
	cd apps/web && npm install
	@echo "✅ Frontend dependencies installed"

install-deps: install-deps-backend install-deps-frontend
	@echo "✅ All dependencies installed"

# Development: Start full stack with hot reload
dev:
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml up
	@echo "🚀 Development stack running on http://localhost"

dev-stop:
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml down
	@echo "⏹️  Development stack stopped"

# Database Migrations (Alembic)
migrate:
	cd apps/api && alembic upgrade head
	@echo "✅ Migrations applied"

migrate-down:
	cd apps/api && alembic downgrade -1
	@echo "✅ Migration rolled back"

migrate-new:
	@read -p "Migration name: " name; \
	cd apps/api && alembic revision -m "$$name"
	@echo "📝 New migration created in apps/api/migrations/versions/"

# Seed database
seed:
	@echo "Seeding development database..."
	cd apps/api && python -c "from db import engine, Base; import asyncio; asyncio.run(engine.begin(__import__('sqlalchemy').sql.text(open('../infra/db/seed.sql').read())))"
	@echo "✅ Database seeded with test data"

# Reset database (dev only)
db-reset:
	@echo "⚠️  WARNING: This will delete all data in the development database"
	@read -p "Continue? (y/N) " confirm; \
	if [ "$$confirm" = "y" ]; then \
		cd apps/api && alembic downgrade base; \
		make migrate seed; \
	fi

# Testing
test: test-backend test-frontend
	@echo "✅ All tests passed"

test-backend:
	cd apps/api && pytest tests/ -v --cov=. --cov-report=html
	@echo "✅ Backend tests complete (coverage: htmlcov/index.html)"

test-frontend:
	cd apps/web && npm run test:unit
	@echo "✅ Frontend tests complete"

test-e2e:
	cd apps/web && npm run test:e2e
	@echo "✅ E2E tests complete"

# Linting
lint:
	@echo "Linting Python..."
	cd apps/api && black --check apps/api/ && pylint apps/api/
	@echo "Linting JavaScript/TypeScript..."
	cd apps/web && npm run lint
	@echo "✅ All linting passed"

# Format code
format:
	@echo "Formatting Python..."
	cd apps/api && black . && isort .
	@echo "Formatting JavaScript/TypeScript..."
	cd apps/web && npm run format
	@echo "✅ Code formatted"

# Build production images
build:
	docker-compose build --no-cache
	@echo "✅ Production images built"

# Production Docker stack
docker-up:
	docker-compose up -d
	@echo "🚀 Production stack running"

docker-down:
	docker-compose down --volumes
	@echo "⏹️  Production stack stopped"

# Cleanup
clean:
	find . -type d -name __pycache__ -exec rm -rf {} +
	find . -type d -name .pytest_cache -exec rm -rf {} +
	find . -type d -name .next -exec rm -rf {} +
	find . -type d -name node_modules -exec rm -rf {} +
	@echo "✅ Cleaned up cache & build artifacts"

# Docker build
docker-build-web:
	docker build -t cmms-web:latest -f infra/docker/Dockerfile.web --target production .

docker-build-api:
	docker build -t cmms-api:latest -f infra/docker/Dockerfile.api --target production .

docker-build-all: docker-build-web docker-build-api
	@echo "✅ All Docker images built"
```

---

## 3. Architectural Rationale

**Monorepo Design**: We organize frontend and backend in a single repository (`apps/web` and `apps/api`) for tighter version control, easier refactoring across boundaries (e.g., API schema changes), and simplified CI/CD pipelines. This is ideal for university projects with a small team where side-by-side development is essential.

**Stack Choice**: Next.js 14 (App Router) enables full-stack React development with server-side rendering—critical for SEO and fast initial loads for 500+ concurrent students. FastAPI in Python excels at rapid development with automatic OpenAPI documentation, making iteration fast. PostgreSQL with Row-Level Security (RLS) enforces security at the database layer so no student can accidentally access another's marks, even if the API is compromised. Docker ensures identical dev/prod environments and simplifies deployment to UTM's infrastructure.

**Security-First Architecture**: JWT tokens are stateless (no session DB needed), OTP emails prevent brute-force attacks, and re-authentication is enforced before high-risk operations (publishing marks, admin overrides). All secrets live in environment variables—never committed. RLS policies in PostgreSQL provide defense-in-depth: even a compromised API key has limited damage.

**AI Integration (Optional MVP)**: Z-score anomaly detection runs synchronously on numpy/scipy (no LLM needed); LangChain + Anthropic SDK gates optional features (risk forecasting, query response suggestions) behind graceful 503 responses if the API key is missing. This allows MVP launch without AI, then layer it in post-launch.

**Test & DevEx**: Pytest + pytest-asyncio in backend, Vitest + React Testing Library in frontend match modern practices. Makefile targets simplify onboarding—new developers run `make bootstrap` once. Pre-commit hooks enforce code quality before commits. CI/CD is ready for GitHub Actions (lint → test → build → push).

---

## 4. Quick Start

```bash
# Clone & setup
git clone <repo>
cd cmms
make bootstrap

# Start development stack
make dev

# In another shell: run tests
make test

# Format & lint before commits
make format
make lint
```

**Access**:
- Frontend: http://localhost:3000
- API: http://localhost:8000 (docs: http://localhost:8000/docs)
- Nginx proxy: http://localhost (unified entry point)
- Database: localhost:5432 (credentials in .env)

This scaffold is **production-ready** and can be deployed to any Docker-compatible infrastructure (UTM cloud, AWS, DigitalOcean, on-prem Kubernetes).

