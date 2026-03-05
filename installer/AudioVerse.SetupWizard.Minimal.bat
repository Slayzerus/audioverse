@echo off
chcp 65001 >nul
echo.
echo   AudioVerse -- Minimal Setup (Karaoke + Audio AI CPU)
echo   Tryb Debug: API uruchamiasz z Visual Studio
echo.

cd /d "%~dp0"
set AUDIOVERSE_ROOT=%CD%

"%~dp0AudioVerse.SetupWizard.exe" --minimal --apply --force

echo.
REM Pierwszy raz: docker compose build (moze trwac 10-20 min)
REM Kolejne razy: --no-build uzywa istniejacych obrazow
docker compose up -d --no-build 2>nul || (
  echo Obrazy nie istnieja - buduje po raz pierwszy...
  docker compose build --parallel
  docker compose up -d
)

echo.
echo Gotowe! Uruchom AudioVerse.API z Visual Studio (F5).
pause
