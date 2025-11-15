Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
Set-Location -Path $PSScriptRoot
$compose = "docker compose"

& $compose -p proj-videoai -f docker-compose.videoai.yml down
& $compose -p proj-core    -f docker-compose.core.yml    down
& $compose -p proj-aiaudio -f docker-compose.aiaudio.yml down
