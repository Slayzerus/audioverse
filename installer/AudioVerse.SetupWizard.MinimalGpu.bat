@echo off
chcp 65001 >nul
echo.
echo   AudioVerse -- Minimal Setup (Karaoke + Audio AI GPU)
echo   CREPE pitch detection w trybie GPU (NVIDIA CUDA)
echo   Tryb Debug: API uruchamiasz z Visual Studio
echo.

REM ── Sprawdz NVIDIA prereqs ──
echo [1/3] Sprawdzam NVIDIA GPU na hoscie...
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

echo [2/3] Sprawdzam GPU w kontenerze Docker (--gpus all)...
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

echo [3/3] Generowanie konfiguracji...
"%~dp0AudioVerse.SetupWizard.exe" --minimal --gpu --apply --force

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
echo CREPE dziala w trybie GPU.
pause
