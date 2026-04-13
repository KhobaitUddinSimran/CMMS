# Carry Mark Management System (CMMS)

A comprehensive web application for digitizing continuous assessment tracking at universities.

## Project Structure

```
CMMS/
├── apps/
│   ├── backend/          # FastAPI REST API
│   └── frontend/         # React/Next.js UI
├── docs/                 # Documentation
├── infra/                # Docker, Kubernetes, Infrastructure
├── scripts/              # Utility scripts
├── tests/                # Test suites
├── docker-compose.yml    # Local development setup
└── README.md
```

## Technologies

- **Frontend**: React, Next.js, TanStack Table
- **Backend**: Python, FastAPI, PostgreSQL
- **DevOps**: Docker, Docker Compose, GitHub Actions
- **AI**: NumPy, SciPy (anomaly detection)

## Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 18+
- Python 3.10+
- PostgreSQL 14+

### Development Setup

```bash
# Clone repository
git clone https://github.com/KhobaitUddinSimran/CMMS.git
cd CMMS

# Copy environment file
cp .env.example .env.local

# Start services
docker-compose up -d

# Frontend: http://localhost:3000
# Backend API: http://localhost:8000
# Database: localhost:5432
```

## Project Timeline

- **Sprint 1** (Apr 9-17): Foundation, Auth & Base UI
- **Sprint 2** (Apr 20-May 1): Course Setup & Roster
- **Sprint 3** (May 4-15): Smart Grid & Publication
- **Sprint 4** (May 18-29): Oversight, Export & AI

## User Roles

1. **Student** - View marks, submit queries
2. **Lecturer** - Entry and grading
3. **Coordinator** - Course provisioning
4. **HOD** - Oversight and analytics
5. **Admin** - System management

## API Documentation

See `docs/api/README.md` for complete API reference.

## Contributing

1. Create feature branch: `git checkout -b CMMS-123-feature-name`
2. Commit changes: `git commit -m "CMMS-123: Description"`
3. Push branch: `git push origin CMMS-123-feature-name`
4. Create Pull Request

## License

MIT

## Contact

Project Lead: Khobait Uddin Simran
Email: khobaituddinsimran@gmail.com
JWT: University Teknologi Malaysia (UTM)
