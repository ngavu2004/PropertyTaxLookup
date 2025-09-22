# Property Tax Lookup Application Makefile

# Variables
BACKEND_DIR = backend
FRONTEND_DIR = frontend
BACKEND_PORT = 5000
FRONTEND_PORT = 5173
BACKEND_PID_FILE = backend.pid
FRONTEND_PID_FILE = frontend.pid

# Default target
.DEFAULT_GOAL := help

# Help target - shows available commands
.PHONY: help
help: ## Show this help message
	@echo "Property Tax Lookup Application - Available Commands:"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'
	@echo ""

# Install dependencies
.PHONY: install
install: ## Install all dependencies (backend and frontend)
	@echo "Installing backend dependencies..."
	cd $(BACKEND_DIR) && npm install
	@echo "Installing frontend dependencies..."
	cd $(FRONTEND_DIR) && npm install
	@echo "Dependencies installed successfully!"

# Start backend server
.PHONY: start-backend
start-backend: ## Start the backend server
	@echo "Starting backend server on port $(BACKEND_PORT)..."
	@if [ -f $(BACKEND_PID_FILE) ]; then \
		echo "Backend server is already running (PID: $$(cat $(BACKEND_PID_FILE)))"; \
	else \
		cd $(BACKEND_DIR) && nohup node index.js > ../backend.log 2>&1 & echo $$! > ../$(BACKEND_PID_FILE); \
		echo "Backend server started (PID: $$(cat $(BACKEND_PID_FILE)))"; \
		echo "Backend logs: backend.log"; \
	fi

# Start frontend server
.PHONY: start-frontend
start-frontend: ## Start the frontend development server
	@echo "Starting frontend server on port $(FRONTEND_PORT)..."
	@if [ -f $(FRONTEND_PID_FILE) ]; then \
		echo "Frontend server is already running (PID: $$(cat $(FRONTEND_PID_FILE)))"; \
	else \
		cd $(FRONTEND_DIR) && nohup npm run dev > ../frontend.log 2>&1 & echo $$! > ../$(FRONTEND_PID_FILE); \
		echo "Frontend server started (PID: $$(cat $(FRONTEND_PID_FILE)))"; \
		echo "Frontend logs: frontend.log"; \
	fi

# Start both servers
.PHONY: start
start: start-backend start-frontend ## Start both backend and frontend servers
	@echo ""
	@echo "🚀 Application started!"
	@echo "Backend:  http://localhost:$(BACKEND_PORT)"
	@echo "Frontend: http://localhost:$(FRONTEND_PORT)"
	@echo ""
	@echo "To stop servers: make stop"
	@echo "To view logs: make logs"

# Stop backend server
.PHONY: stop-backend
stop-backend: ## Stop the backend server
	@if [ -f $(BACKEND_PID_FILE) ]; then \
		PID=$$(cat $(BACKEND_PID_FILE)); \
		if ps -p $$PID > /dev/null 2>&1; then \
			kill $$PID && echo "Backend server stopped (PID: $$PID)"; \
		else \
			echo "Backend server was not running"; \
		fi; \
		rm -f $(BACKEND_PID_FILE); \
	else \
		echo "Backend server is not running"; \
	fi

# Stop frontend server
.PHONY: stop-frontend
stop-frontend: ## Stop the frontend server
	@if [ -f $(FRONTEND_PID_FILE) ]; then \
		PID=$$(cat $(FRONTEND_PID_FILE)); \
		if ps -p $$PID > /dev/null 2>&1; then \
			kill $$PID && echo "Frontend server stopped (PID: $$PID)"; \
		else \
			echo "Frontend server was not running"; \
		fi; \
		rm -f $(FRONTEND_PID_FILE); \
	else \
		echo "Frontend server is not running"; \
	fi

# Stop both servers
.PHONY: stop
stop: stop-backend stop-frontend ## Stop both backend and frontend servers
	@echo "🛑 All servers stopped!"

# Restart servers
.PHONY: restart
restart: stop start ## Restart both servers

# Show server status
.PHONY: status
status: ## Show status of both servers
	@echo "Server Status:"
	@echo "=============="
	@if [ -f $(BACKEND_PID_FILE) ]; then \
		PID=$$(cat $(BACKEND_PID_FILE)); \
		if ps -p $$PID > /dev/null 2>&1; then \
			echo "Backend:  Running (PID: $$PID)"; \
		else \
			echo "Backend:  Not running (stale PID file)"; \
		fi; \
	else \
		echo "Backend:  Not running"; \
	fi
	@if [ -f $(FRONTEND_PID_FILE) ]; then \
		PID=$$(cat $(FRONTEND_PID_FILE)); \
		if ps -p $$PID > /dev/null 2>&1; then \
			echo "Frontend: Running (PID: $$PID)"; \
		else \
			echo "Frontend: Not running (stale PID file)"; \
		fi; \
	else \
		echo "Frontend: Not running"; \
	fi

# View logs
.PHONY: logs
logs: ## Show logs from both servers
	@echo "Backend logs:"
	@echo "============="
	@if [ -f backend.log ]; then tail -20 backend.log; else echo "No backend logs found"; fi
	@echo ""
	@echo "Frontend logs:"
	@echo "=============="
	@if [ -f frontend.log ]; then tail -20 frontend.log; else echo "No frontend logs found"; fi

# Follow logs in real-time
.PHONY: logs-follow
logs-follow: ## Follow logs in real-time (Ctrl+C to stop)
	@echo "Following logs (Ctrl+C to stop)..."
	@tail -f backend.log frontend.log 2>/dev/null || echo "No log files found"

# Clean up
.PHONY: clean
clean: stop ## Stop servers and clean up PID files and logs
	@echo "Cleaning up..."
	@rm -f $(BACKEND_PID_FILE) $(FRONTEND_PID_FILE)
	@rm -f backend.log frontend.log
	@echo "Cleanup complete!"

# Development mode (with logs)
.PHONY: dev
dev: start logs-follow ## Start servers and follow logs

# Build frontend for production
.PHONY: build
build: ## Build frontend for production
	@echo "Building frontend for production..."
	cd $(FRONTEND_DIR) && npm run build
	@echo "Frontend built successfully!"

# Test both servers
.PHONY: test
test: ## Test if both servers are responding
	@echo "Testing servers..."
	@echo -n "Backend:  "
	@curl -s http://localhost:$(BACKEND_PORT)/api/search > /dev/null && echo "✅ OK" || echo "❌ Failed"
	@echo -n "Frontend: "
	@curl -s http://localhost:$(FRONTEND_PORT) > /dev/null && echo "✅ OK" || echo "❌ Failed"

# Windows compatibility (if using Git Bash or WSL)
.PHONY: start-windows
start-windows: ## Start servers on Windows (Git Bash/WSL)
	@echo "Starting servers for Windows..."
	@start "Backend Server" cmd /k "cd $(BACKEND_DIR) && node index.js"
	@timeout /t 3 /nobreak > nul
	@start "Frontend Server" cmd /k "cd $(FRONTEND_DIR) && npm run dev"
