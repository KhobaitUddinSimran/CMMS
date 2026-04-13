.PHONY: help bootstrap dev dev-stop test lint format migrate clean

help:
	@echo "=== CMMS Development Commands ==="
	@echo "make bootstrap         Install deps, migrate DB, seed"
	@echo "make dev              Start development stack"
	@echo "make dev-stop         Stop development stack"
	@echo "make test             Run all tests"
	@echo "make lint             Check code quality"  
	@echo "make format           Auto-format code"
	@echo "make migrate          Run database migrations"
	@echo "make clean            Remove build artifacts"

bootstrap: install-deps migrate
	@echo "✅ Bootstrap complete! Run 'make dev' to start."

install-deps:
	@echo "📦 Installing dependencies..."
	cd backend && pip install -r requirements.txt -r requirements-dev.txt
	cd frontend && npm install
	@echo "✅ Dependencies installed"

dev:
	@echo "🚀 Starting development stack..."
	docker-compose up -d
	@echo "✅ Services running at http://localhost"

dev-stop:
	@echo "⏹️ Stopping development stack..."
	docker-compose down
	@echo "✅ Services stopped"

test:
	@echo "🧪 Running tests..."
	cd backend && pytest tests/ -v
	cd frontend && npm test

lint:
	@echo "🔍 Linting code..."
	cd backend && pylint app/ --fail-under=7.0 || true
	cd frontend && npm run lint

format:
	@echo "🎨 Formatting code..."
	cd backend && black app/ && isort app/
	cd frontend && npm run format

migrate:
	@echo "📊 Running migrations..."
	cd backend && alembic upgrade head
	@echo "✅ Migrations complete"

clean:
	@echo "🧹 Cleaning up..."
	find . -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name .pytest_cache -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name node_modules -exec rm -rf {} + 2>/dev/null || true

.env:
	@echo "📝 Creating .env file..."
	cp .env.example .env
