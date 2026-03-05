@echo off
chcp 65001 >nul
echo.
echo   AudioVerse -- Minimal GPU REBUILD (--no-cache)
echo   Przebudowuje WSZYSTKIE obrazy Docker od zera (GPU mode)
echo   Moze trwac 15-30 min!
echo.

REM ── Sprawdz NVIDIA prereqs ──
echo [1/4] Sprawdzam NVIDIA GPU na hoscie...
nvidia-smi >nul 2>&1
if errorlevel 1 (
    echo.
    echo   BLAD: nvidia-smi nie znalezione!
    echo   Zainstaluj sterowniki NVIDIA: https://www.nvidia.com/drivers
    echo.
    pause
    exit /b 1
)
nvidia-smi --query-gpu=name,driver_version,memory.total --format=csv,noheader 2>nul
echo.

echo [2/4] Sprawdzam GPU w kontenerze Docker (--gpus all)...
echo   (przy pierwszym uruchomieniu moze pobrac obraz ~80 MB)
docker run --rm --gpus all nvidia/cuda:12.8.1-base-ubuntu22.04 nvidia-smi --query-gpu=name --format=csv,noheader 2>nul
if errorlevel 1 (
    echo.
    echo   BLAD: Docker nie moze uzyc GPU w kontenerze!
    echo.
    echo   Uwaga: RTX 50xx ^(Blackwell^) wymaga CUDA 12.8+.
    echo   Jesli masz RTX 40xx lub starsza, sprawdz ponizsze kroki.
    echo.
    echo   === Windows ^(Docker Desktop + WSL2^) ===
    echo   1. Zainstaluj najnowszy sterownik NVIDIA ^(Game Ready / Studio^)
    echo   2. Docker Desktop ^> Settings ^> General ^> "Use WSL 2 based engine" = ON
    echo   3. Restart Docker Desktop
    echo   4. Upewnij sie ze WSL2 jest zainstalowany: wsl --install
    echo   5. Sprawdz: wsl --list --verbose ^(powinna byc dystrybucja z VERSION 2^)
    echo.
    echo   === Linux ===
    echo   sudo apt-get install -y nvidia-container-toolkit
    echo   sudo nvidia-ctk runtime configure --runtime=docker
    echo   sudo systemctl restart docker
    echo.
    pause
    exit /b 1
)
echo   OK: GPU dostepne w kontenerze Docker.
echo.

cd /d "%~dp0"
set AUDIOVERSE_ROOT=%CD%

echo [3/4] Generowanie konfiguracji (GPU mode)...
"%~dp0AudioVerse.SetupWizard.exe" --minimal --gpu --apply --force

echo.
echo [4/4] Zatrzymywanie kontenerow i przebudowywanie WSZYSTKICH obrazow (--no-cache)...
docker compose down 2>nul
echo.
echo === REBUILD START (--no-cache --parallel) ===
echo To moze trwac 15-30 min przy wolnym polaczeniu.
echo.
docker compose build --no-cache --parallel
if errorlevel 1 (
    echo.
    echo   BLAD: docker compose build nie powiodl sie!
    echo   Sprawdz logi powyzej.
    pause
    exit /b 1
)

echo.
echo Uruchamianie kontenerow...
docker compose up -d

echo.
echo ============================================
echo   REBUILD GOTOWY!
echo   CREPE dziala w trybie GPU.
echo   Sprawdz: curl http://localhost:8084/health
echo   Oczekiwany wynik: {"device":"cuda","gpu":"..."}
echo ============================================
echo.
echo Uruchom AudioVerse.API z Visual Studio (F5).
pause
