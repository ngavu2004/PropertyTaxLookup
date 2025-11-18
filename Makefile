# Simple Makefile for Property Tax Lookup

start:
	@echo Starting Property Tax Lookup Application...
	@cmd /c start cmd /k "cd backend && python app.py"
	@timeout /t 2 /nobreak > nul
	@cmd /c start cmd /k "cd backend && node index.js"
	@timeout /t 2 /nobreak > nul
	@cmd /c start cmd /k "cd frontend && npm run dev"
	@echo.
	@echo 🚀 Application started!
	@echo AZ Scrapers (Flask):  http://localhost:7000
	@echo Backend:  http://localhost:5000
	@echo Frontend: http://localhost:5173
