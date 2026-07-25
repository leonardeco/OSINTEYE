@echo off
echo ====================================================
echo      Compilando OSINTOJO (Aplicacion de Escritorio)
echo ====================================================
echo.

echo [1] Compilando el Frontend y empaquetando con Tauri...
cd frontend
call npm run tauri build

echo.
echo ====================================================
echo ¡Compilacion Finalizada!
echo Revisa la carpeta: OSINTOJO/frontend/src-tauri/target/release/
echo Ahi encontraras tu archivo OSINTOJO.exe listo para instalar o ejecutar.
echo ====================================================
pause
