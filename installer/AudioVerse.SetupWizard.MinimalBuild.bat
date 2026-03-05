@echo off
chcp 65001 >nul
echo.
echo   AudioVerse -- Minimal Setup z BUDOWANIEM obrazów
echo   Tryb Debug: API uruchamiasz z Visual Studio
echo.

cd /d "%~dp0"
set AUDIOVERSE_ROOT=%CD%

"%~dp0AudioVerse.SetupWizard.exe" --minimal --apply --force

echo.
echo Budowanie obrazów (może trwać 10-20 min przy pierwszym uruchomieniu)...
docker compose build --parallel
docker compose up -d

echo.
echo Gotowe! Uruchom AudioVerse.API z Visual Studio (F5).
pause
