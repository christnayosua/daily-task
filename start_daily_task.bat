@echo off
cd /d "%~dp0"

echo Menjalankan Backend FastAPI...
start /min cmd /c ".\.venv\Scripts\activate.bat && uvicorn main:app --port 8000"

echo Menjalankan Frontend Tauri...
npx tauri dev
