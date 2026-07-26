@echo off
echo ====================================================
echo      Iniciando OSINTEYE en Modo Navegador Web
echo ====================================================
echo.

echo [1] Iniciando Backend FastAPI (Puerto 8002)...
start "OSINTEYE Backend" cmd /k "cd backend && .\venv\Scripts\activate.bat && uvicorn main:app --port 8002 --reload"

echo [2] Esperando a que la API encienda...
timeout /t 3 /nobreak > nul

echo [3] Iniciando Frontend React (Puerto 5173)...
start "OSINTEYE Frontend" cmd /k "cd frontend && npm run dev"

echo [4] Esperando a que el frontend encienda...
timeout /t 5 /nobreak > nul

echo [5] Abriendo el navegador...
start "" "http://localhost:5173"

echo.
echo ====================================================
echo Todo esta corriendo. Abre tu navegador y ve a:
echo http://localhost:5173
echo ====================================================
pause
