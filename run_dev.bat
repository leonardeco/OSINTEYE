@echo off
echo ====================================================
echo      Iniciando Entorno de Desarrollo OSINTOJO
echo ====================================================
echo.

echo [1] Iniciando Backend FastAPI (Puerto 8000)...
start "OSINTOJO Backend" cmd /k "cd backend && .\venv\Scripts\activate.bat && uvicorn main:app --port 8000 --reload"

echo [2] Esperando 3 segundos para que la API encienda...
timeout /t 3 /nobreak > nul

echo [3] Iniciando Frontend Tauri (React + Vite)...
cd frontend
call npm run tauri dev

echo.
echo ====================================================
echo      Tauri se ha cerrado. Apagando todo...
echo ====================================================
pause
