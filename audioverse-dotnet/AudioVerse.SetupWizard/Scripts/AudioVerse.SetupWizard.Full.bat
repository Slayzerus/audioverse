@echo off
chcp 65001 >nul
echo.
echo   AudioVerse -- Full Interactive Setup
echo.

cd /d "%~dp0"
set AUDIOVERSE_ROOT=%CD%

"%~dp0AudioVerse.SetupWizard.exe" --apply

echo.
docker compose up -d --no-build 2>nul || (
  echo Obrazy nie istnieja - buduje po raz pierwszy...
  docker compose build --parallel
  docker compose up -d
)

echo.
echo Gotowe!
pause
