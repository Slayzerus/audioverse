#!/usr/bin/env pwsh
<#
.SYNOPSIS
    AudioVerse Docker Compose installer — generates docker-compose.yml + .env and runs the stack.
.DESCRIPTION
    Interactive console installer that:
    1. Generates .env with configurable settings
    2. Generates docker-compose.yml for API + Postgres + Redis + MinIO + MailHog
    3. Checks for Docker and installs if missing (Windows/Linux)
    4. Runs docker-compose up -d
#>

param(
    [string]$OutputDir = ".",
    [switch]$SkipRun
)

$ErrorActionPreference = "Stop"

Write-Host "????????????????????????????????????????????????????????????" -ForegroundColor Cyan
Write-Host "?  AudioVerse — Docker Compose Installer                  ?" -ForegroundColor Cyan
Write-Host "????????????????????????????????????????????????????????????" -ForegroundColor Cyan
Write-Host ""

# ?? Check Docker ??
function Test-Docker {
    try { docker --version | Out-Null; return $true } catch { return $false }
}

if (-not (Test-Docker)) {
    Write-Host "[!] Docker not found." -ForegroundColor Yellow
    $install = Read-Host "Install Docker Desktop? (y/N)"
    if ($install -eq "y") {
        if ($IsWindows -or $env:OS -match "Windows") {
            Write-Host "Downloading Docker Desktop installer..."
            Invoke-WebRequest -Uri "https://desktop.docker.com/win/main/amd64/Docker%20Desktop%20Installer.exe" -OutFile "$env:TEMP\DockerInstaller.exe"
            Start-Process -Wait "$env:TEMP\DockerInstaller.exe" -ArgumentList "install","--quiet"
        } else {
            Write-Host "Installing via apt..."
            sudo apt-get update
            sudo apt-get install -y docker.io docker-compose
            sudo systemctl enable docker
            sudo systemctl start docker
        }
    } else {
        Write-Host "Docker is required. Exiting." -ForegroundColor Red
        exit 1
    }
}

Write-Host "[?] Docker found: $(docker --version)" -ForegroundColor Green

# ?? Collect settings ??
Write-Host ""
Write-Host "?? Configuration ??" -ForegroundColor Yellow

$pgPassword = Read-Host "PostgreSQL password [audioverse123]"
if ([string]::IsNullOrWhiteSpace($pgPassword)) { $pgPassword = "audioverse123" }

$pgDb = Read-Host "PostgreSQL database name [audioverse]"
if ([string]::IsNullOrWhiteSpace($pgDb)) { $pgDb = "audioverse" }

$minioUser = Read-Host "MinIO root user [minioadmin]"
if ([string]::IsNullOrWhiteSpace($minioUser)) { $minioUser = "minioadmin" }

$minioPass = Read-Host "MinIO root password [minioadmin123]"
if ([string]::IsNullOrWhiteSpace($minioPass)) { $minioPass = "minioadmin123" }

$apiPort = Read-Host "API port [5000]"
if ([string]::IsNullOrWhiteSpace($apiPort)) { $apiPort = "5000" }

$jwtSecret = Read-Host "JWT secret key [auto-generate]"
if ([string]::IsNullOrWhiteSpace($jwtSecret)) {
    $jwtSecret = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 40 | ForEach-Object { [char]$_ })
}

# ?? Generate .env ??
$envContent = @"
# AudioVerse Docker Stack Configuration
# Generated: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")

POSTGRES_USER=postgres
POSTGRES_PASSWORD=$pgPassword
POSTGRES_DB=$pgDb

MINIO_ROOT_USER=$minioUser
MINIO_ROOT_PASSWORD=$minioPass

API_PORT=$apiPort
JWT_SECRET=$jwtSecret

ASPNETCORE_ENVIRONMENT=Production
"@

$envPath = Join-Path $OutputDir ".env"
Set-Content -Path $envPath -Value $envContent -Encoding UTF8
Write-Host "[?] Generated $envPath" -ForegroundColor Green

# ?? Generate docker-compose.yml ??
$composeContent = @"
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    restart: unless-stopped
    environment:
      POSTGRES_USER: `${POSTGRES_USER}
      POSTGRES_PASSWORD: `${POSTGRES_PASSWORD}
      POSTGRES_DB: `${POSTGRES_DB}
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    restart: unless-stopped
    ports:
      - "6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 5s
      retries: 5

  minio:
    image: minio/minio:latest
    restart: unless-stopped
    environment:
      MINIO_ROOT_USER: `${MINIO_ROOT_USER}
      MINIO_ROOT_PASSWORD: `${MINIO_ROOT_PASSWORD}
    command: server /data --console-address ":9001"
    ports:
      - "9000:9000"
      - "9001:9001"
    volumes:
      - miniodata:/data
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9000/minio/health/live"]
      interval: 10s
      timeout: 5s
      retries: 5

  mailhog:
    image: mailhog/mailhog:latest
    restart: unless-stopped
    ports:
      - "1025:1025"
      - "8025:8025"

  api:
    image: audioverse/api:latest
    restart: unless-stopped
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
      minio:
        condition: service_healthy
    environment:
      ASPNETCORE_ENVIRONMENT: `${ASPNETCORE_ENVIRONMENT}
      ConnectionStrings__DefaultConnection: "Host=postgres;Port=5432;Database=`${POSTGRES_DB};Username=`${POSTGRES_USER};Password=`${POSTGRES_PASSWORD}"
      ConnectionStrings__Redis: "redis:6379"
      Minio__Endpoint: "minio:9000"
      Minio__AccessKey: `${MINIO_ROOT_USER}
      Minio__SecretKey: `${MINIO_ROOT_PASSWORD}
      Minio__UseSSL: "false"
      Jwt__Secret: `${JWT_SECRET}
      Email__SmtpHost: "mailhog"
      Email__SmtpPort: "1025"
    ports:
      - "`${API_PORT}:8080"

volumes:
  pgdata:
  miniodata:
"@

$composePath = Join-Path $OutputDir "docker-compose.yml"
Set-Content -Path $composePath -Value $composeContent -Encoding UTF8
Write-Host "[?] Generated $composePath" -ForegroundColor Green

# ?? Run ??
if (-not $SkipRun) {
    Write-Host ""
    Write-Host "?? Starting stack ??" -ForegroundColor Yellow
    Push-Location $OutputDir
    docker compose up -d
    Pop-Location
    Write-Host ""
    Write-Host "[?] Stack started!" -ForegroundColor Green
    Write-Host "    API:     http://localhost:$apiPort" -ForegroundColor White
    Write-Host "    MinIO:   http://localhost:9001" -ForegroundColor White
    Write-Host "    MailHog: http://localhost:8025" -ForegroundColor White
    Write-Host "    Health:  http://localhost:$apiPort/health" -ForegroundColor White
} else {
    Write-Host ""
    Write-Host "[i] Files generated. Run 'docker compose up -d' to start." -ForegroundColor Cyan
}
