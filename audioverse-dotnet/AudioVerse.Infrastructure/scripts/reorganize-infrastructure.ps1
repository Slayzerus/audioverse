# ============================================================
# AudioVerse Infrastructure Layer Reorganization Script
# ============================================================
# Run from: AudioVerse.Infrastructure directory
# Usage: powershell -ExecutionPolicy Bypass -File scripts\reorganize-infrastructure.ps1
# ============================================================

param(
    [switch]$DryRun = $false,
    [switch]$Verbose = $false
)

$ErrorActionPreference = "Continue"

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "AudioVerse Infrastructure Layer Reorganization" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
if ($DryRun) { Write-Host "[DRY RUN MODE - no changes will be made]" -ForegroundColor Yellow }
Write-Host ""

# ============================================================
# CONFIGURATION
# ============================================================

$areas = @("Identity", "Karaoke", "Events", "Editor", "Admin", "DMX", "Games", "MediaLibrary", "Common")

$repoToArea = @{
    "UserProfileRepository"   = "Identity"
    "UserProfileRepositoryEF" = "Identity"
    "KaraokeRepository"       = "Karaoke"
    "KaraokeRepositoryEF"     = "Karaoke"
    "EditorRepository"        = "Editor"
    "EditorRepositoryEF"      = "Editor"
    "EventRepositoryEF"       = "Events"
}

$folderToArea = @{
    "DMX"           = "DMX"
    "Email"         = "Common"
    "ExternalApis"  = "MediaLibrary"
    "Helpers"       = "Common"
    "RateLimiting"  = "Common"
    "Realtime"      = "Common"
    "Storage"       = "Common"
    "Telemetry"     = "Common"
    "Validation"    = "Common"
}

# ============================================================
# HELPER FUNCTIONS
# ============================================================

function Write-Step { param([string]$Message) Write-Host ">> $Message" -ForegroundColor Green }
function Write-Info { param([string]$Message) Write-Host "   $Message" -ForegroundColor Gray }

function Ensure-Directory {
    param([string]$Path)
    if (-not (Test-Path $Path) -and -not $DryRun) {
        New-Item -ItemType Directory -Path $Path -Force | Out-Null
    }
}

function Update-NamespaceInFile {
    param([string]$FilePath, [string]$NewNamespace)
    
    $content = Get-Content $FilePath -Raw -Encoding UTF8
    if ($content -match 'namespace\s+([\w\.]+)') {
        $oldNs = $Matches[1]
        $content = $content -replace "namespace\s+$([regex]::Escape($oldNs))", "namespace $NewNamespace"
        return $content
    }
    return $null
}

# ============================================================
# STEP 1: Create Areas directory structure
# ============================================================

Write-Step "Creating Areas directory structure in Infrastructure..."

foreach ($area in $areas) {
    $paths = @(
        "Areas\$area\Repositories",
        "Areas\$area\Services"
    )
    
    foreach ($path in $paths) {
        Ensure-Directory $path
    }
}

# Common infrastructure folders
$commonPaths = @(
    "Areas\Common\Storage",
    "Areas\Common\Email",
    "Areas\Common\RateLimiting",
    "Areas\Common\Realtime",
    "Areas\Common\Telemetry",
    "Areas\Common\Validation",
    "Areas\Common\Helpers"
)
foreach ($path in $commonPaths) {
    Ensure-Directory $path
}

Write-Info "Directory structure created"
Write-Host ""

# ============================================================
# STEP 2: Reorganize Repositories
# ============================================================

Write-Step "Reorganizing Repositories..."

$reposPath = "Repositories"
$movedRepos = 0

if (Test-Path $reposPath) {
    Get-ChildItem $reposPath -Filter "*.cs" | ForEach-Object {
        $baseName = [System.IO.Path]::GetFileNameWithoutExtension($_.Name)
        $area = if ($repoToArea.ContainsKey($baseName)) { $repoToArea[$baseName] } else { "Common" }
        $targetDir = "Areas\$area\Repositories"
        
        Ensure-Directory $targetDir
        
        $newNs = "AudioVerse.Infrastructure.Areas.$area.Repositories"
        $content = Update-NamespaceInFile -FilePath $_.FullName -NewNamespace $newNs
        
        if ($content -and -not $DryRun) {
            $destPath = Join-Path $targetDir $_.Name
            Set-Content -Path $destPath -Value $content -Encoding UTF8
            Remove-Item $_.FullName
            $movedRepos++
        }
        if ($Verbose) { Write-Info "Repository: $($_.Name) -> Areas/$area/Repositories/" }
    }
}

Write-Info "Moved $movedRepos repository files"
Write-Host ""

# ============================================================
# STEP 3: Reorganize other folders
# ============================================================

Write-Step "Reorganizing infrastructure services..."

$movedServices = 0

foreach ($folder in $folderToArea.Keys) {
    $area = $folderToArea[$folder]
    
    if (Test-Path $folder) {
        $targetDir = "Areas\$area\$folder"
        Ensure-Directory $targetDir
        
        Get-ChildItem $folder -Filter "*.cs" | ForEach-Object {
            $newNs = "AudioVerse.Infrastructure.Areas.$area.$folder"
            $content = Update-NamespaceInFile -FilePath $_.FullName -NewNamespace $newNs
            
            if ($content -and -not $DryRun) {
                $destPath = Join-Path $targetDir $_.Name
                Set-Content -Path $destPath -Value $content -Encoding UTF8
                Remove-Item $_.FullName
                $movedServices++
            }
            if ($Verbose) { Write-Info "${folder}: $($_.Name) -> Areas/$area/$folder/" }
        }
        
        # Remove empty folder
        if ((Get-ChildItem $folder -File).Count -eq 0 -and -not $DryRun) {
            Remove-Item $folder -Recurse -Force -ErrorAction SilentlyContinue
        }
    }
}

Write-Info "Moved $movedServices infrastructure files"
Write-Host ""

# ============================================================
# STEP 4: Keep Persistence folder (DbContext stays at root)
# ============================================================

Write-Step "Note: Persistence/DbContext stays at root level"
Write-Info "AudioVerseDbContext should remain in Persistence folder"
Write-Host ""

# ============================================================
# STEP 5: Clean up empty directories
# ============================================================

Write-Step "Cleaning up empty directories..."

if (Test-Path "Repositories") {
    if ((Get-ChildItem "Repositories" -File).Count -eq 0 -and -not $DryRun) {
        Remove-Item "Repositories" -Recurse -Force -ErrorAction SilentlyContinue
        Write-Info "Removed empty: Repositories"
    }
}

Write-Host ""

# ============================================================
# SUMMARY
# ============================================================

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "SUMMARY" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "Repositories moved:         $movedRepos" -ForegroundColor Green
Write-Host "Infrastructure files moved: $movedServices" -ForegroundColor Green
Write-Host ""

if ($DryRun) {
    Write-Host "[DRY RUN] No changes were made." -ForegroundColor Yellow
} else {
    Write-Host "Reorganization complete!" -ForegroundColor Green
}

Write-Host ""
Write-Host "NEXT STEPS:" -ForegroundColor Cyan
Write-Host "1. Run 'dotnet build'"
Write-Host "2. Use Visual Studio 'Sync Namespaces'"
Write-Host "3. Update DependencyInjection.cs registrations"
Write-Host ""
