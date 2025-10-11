@echo off
REM Start a static file server on port 8000 using npx http-server (Node.js required)
cd /d "%~dp0"
npx http-server -p 8000 -a localhost -c-1
pause
