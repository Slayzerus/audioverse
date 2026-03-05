# ============================================================
# AudioVerse Application Layer Reorganization Script
# ============================================================
# Run from: AudioVerse.Application directory
# Usage: powershell -ExecutionPolicy Bypass -File scripts\reorganize-application.ps1
# ============================================================

param(
    [switch]$DryRun = $false,
    [switch]$Verbose = $false
)

$ErrorActionPreference = "Continue"

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "AudioVerse Application Layer Reorganization" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
if ($DryRun) { Write-Host "[DRY RUN MODE - no changes will be made]" -ForegroundColor Yellow }
Write-Host ""

# ============================================================
# CONFIGURATION - Area mappings
# ============================================================

$areas = @(
    "Identity",      # User, Auth, Permissions
    "Karaoke",       # Event, Song, Session, Round, Singing
    "Events",        # Event, Poll, Billing
    "Editor",        # AudioProject, AudioClip, Layers
    "Admin",         # SystemConfig, AuditLog, Moderation
    "DMX",           # DMX hardware control
    "Games",         # BoardGames, CouchGames
    "MediaLibrary",  # Songs, Artists, Albums, Platforms
    "Common"         # Shared models, utilities
)

# Mapping: existing folder/prefix -> target Area
$folderToArea = @{
    "User"        = "Identity"
    "Karaoke"     = "Karaoke"
    "Events"      = "Events"
    "Editor"      = "Editor"
    "Admin"       = "Admin"
    "Moderation"  = "Admin"
    "DMX"         = "DMX"
    "Audio"       = "MediaLibrary"
    "Platforms"   = "MediaLibrary"
    "MediaLibrary"= "MediaLibrary"
    "SongInformations" = "MediaLibrary"
    "Utils"       = "Common"
    "Security"    = "Identity"
    "Common"      = "Common"
}

# ============================================================
# HELPER FUNCTIONS
# ============================================================

function Write-Step { param([string]$Message) Write-Host ">> $Message" -ForegroundColor Green }
function Write-Info { param([string]$Message) Write-Host "   $Message" -ForegroundColor Gray }
function Write-Warn { param([string]$Message) Write-Host "   [!] $Message" -ForegroundColor Yellow }
function Write-Err  { param([string]$Message) Write-Host "   [X] $Message" -ForegroundColor Red }

function Get-AreaFromPath {
    param([string]$Path)
    
    foreach ($key in $folderToArea.Keys) {
        if ($Path -match "\\$key\\" -or $Path -match "\\$key$" -or $Path -match "^$key\\") {
            return $folderToArea[$key]
        }
    }
    return "Common"
}

function Update-NamespaceInFile {
    param(
        [string]$FilePath,
        [string]$NewNamespace
    )
    
    $content = Get-Content $FilePath -Raw -Encoding UTF8
    
    # Extract current namespace
    if ($content -match 'namespace\s+([\w\.]+)') {
        $oldNs = $Matches[1]
        $content = $content -replace "namespace\s+$([regex]::Escape($oldNs))", "namespace $NewNamespace"
        return $content
    }
    return $null
}

function Ensure-Directory {
    param([string]$Path)
    if (-not (Test-Path $Path) -and -not $DryRun) {
        New-Item -ItemType Directory -Path $Path -Force | Out-Null
    }
}

# ============================================================
# STEP 1: Create Areas directory structure
# ============================================================

Write-Step "Creating Areas directory structure in Application..."

foreach ($area in $areas) {
    $paths = @(
        "Areas\$area\Commands",
        "Areas\$area\Queries",
        "Areas\$area\Handlers",
        "Areas\$area\Validators",
        "Areas\$area\Services",
        "Areas\$area\Models\Dto",
        "Areas\$area\Models\Requests",
        "Areas\$area\Models\Results"
    )
    
    foreach ($path in $paths) {
        Ensure-Directory $path
        if ($Verbose) { Write-Info "Created: $path" }
    }
}

Write-Info "Directory structure created for $($areas.Count) areas"
Write-Host ""

# ============================================================
# STEP 2: Reorganize Commands
# ============================================================

Write-Step "Reorganizing Commands..."

$commandsPath = "Commands"
$movedCommands = 0

if (Test-Path $commandsPath) {
    Get-ChildItem $commandsPath -Directory | ForEach-Object {
        $subFolder = $_.Name
        $area = Get-AreaFromPath $subFolder
        $targetDir = "Areas\$area\Commands"
        
        Ensure-Directory $targetDir
        
        Get-ChildItem $_.FullName -Filter "*.cs" | ForEach-Object {
            $newNs = "AudioVerse.Application.Areas.$area.Commands"
            $content = Update-NamespaceInFile -FilePath $_.FullName -NewNamespace $newNs
            
            if ($content -and -not $DryRun) {
                $destPath = Join-Path $targetDir $_.Name
                Set-Content -Path $destPath -Value $content -Encoding UTF8
                Remove-Item $_.FullName
                $movedCommands++
            }
            if ($Verbose) { Write-Info "Command: $($_.Name) -> Areas/$area/Commands/" }
        }
    }
}

Write-Info "Moved $movedCommands command files"
Write-Host ""

# ============================================================
# STEP 3: Reorganize Queries
# ============================================================

Write-Step "Reorganizing Queries..."

$queriesPath = "Queries"
$movedQueries = 0

if (Test-Path $queriesPath) {
    Get-ChildItem $queriesPath -Directory | ForEach-Object {
        $subFolder = $_.Name
        $area = Get-AreaFromPath $subFolder
        $targetDir = "Areas\$area\Queries"
        
        Ensure-Directory $targetDir
        
        Get-ChildItem $_.FullName -Filter "*.cs" | ForEach-Object {
            $newNs = "AudioVerse.Application.Areas.$area.Queries"
            $content = Update-NamespaceInFile -FilePath $_.FullName -NewNamespace $newNs
            
            if ($content -and -not $DryRun) {
                $destPath = Join-Path $targetDir $_.Name
                Set-Content -Path $destPath -Value $content -Encoding UTF8
                Remove-Item $_.FullName
                $movedQueries++
            }
            if ($Verbose) { Write-Info "Query: $($_.Name) -> Areas/$area/Queries/" }
        }
    }
}

Write-Info "Moved $movedQueries query files"
Write-Host ""

# ============================================================
# STEP 4: Reorganize Handlers
# ============================================================

Write-Step "Reorganizing Handlers..."

$handlersPath = "Handlers"
$movedHandlers = 0

if (Test-Path $handlersPath) {
    Get-ChildItem $handlersPath -Directory | ForEach-Object {
        $subFolder = $_.Name
        $area = Get-AreaFromPath $subFolder
        $targetDir = "Areas\$area\Handlers"
        
        Ensure-Directory $targetDir
        
        Get-ChildItem $_.FullName -Filter "*.cs" | ForEach-Object {
            $newNs = "AudioVerse.Application.Areas.$area.Handlers"
            $content = Update-NamespaceInFile -FilePath $_.FullName -NewNamespace $newNs
            
            if ($content -and -not $DryRun) {
                $destPath = Join-Path $targetDir $_.Name
                Set-Content -Path $destPath -Value $content -Encoding UTF8
                Remove-Item $_.FullName
                $movedHandlers++
            }
            if ($Verbose) { Write-Info "Handler: $($_.Name) -> Areas/$area/Handlers/" }
        }
    }
}

Write-Info "Moved $movedHandlers handler files"
Write-Host ""

# ============================================================
# STEP 5: Reorganize Validators
# ============================================================

Write-Step "Reorganizing Validators..."

$validatorsPath = "Validators"
$movedValidators = 0

if (Test-Path $validatorsPath) {
    Get-ChildItem $validatorsPath -Directory | ForEach-Object {
        $subFolder = $_.Name
        $area = Get-AreaFromPath $subFolder
        $targetDir = "Areas\$area\Validators"
        
        Ensure-Directory $targetDir
        
        Get-ChildItem $_.FullName -Filter "*.cs" | ForEach-Object {
            $newNs = "AudioVerse.Application.Areas.$area.Validators"
            $content = Update-NamespaceInFile -FilePath $_.FullName -NewNamespace $newNs
            
            if ($content -and -not $DryRun) {
                $destPath = Join-Path $targetDir $_.Name
                Set-Content -Path $destPath -Value $content -Encoding UTF8
                Remove-Item $_.FullName
                $movedValidators++
            }
            if ($Verbose) { Write-Info "Validator: $($_.Name) -> Areas/$area/Validators/" }
        }
    }
}

Write-Info "Moved $movedValidators validator files"
Write-Host ""

# ============================================================
# STEP 6: Reorganize Services
# ============================================================

Write-Step "Reorganizing Services..."

$servicesPath = "Services"
$movedServices = 0

if (Test-Path $servicesPath) {
    Get-ChildItem $servicesPath -Directory | ForEach-Object {
        $subFolder = $_.Name
        $area = Get-AreaFromPath $subFolder
        $targetDir = "Areas\$area\Services"
        
        Ensure-Directory $targetDir
        
        Get-ChildItem $_.FullName -Filter "*.cs" -Recurse | ForEach-Object {
            $relativePath = $_.FullName.Substring((Get-Location).Path.Length + 1)
            $newNs = "AudioVerse.Application.Areas.$area.Services"
            
            # Handle nested folders (e.g., Services/Platforms/Spotify)
            $nestedPath = $_.Directory.FullName.Replace((Join-Path (Get-Location).Path $servicesPath), "").TrimStart('\')
            if ($nestedPath -and $nestedPath -ne $subFolder) {
                $nestedPath = $nestedPath.Replace($subFolder + "\", "")
                $targetSubDir = Join-Path $targetDir $nestedPath
                Ensure-Directory $targetSubDir
                $newNs = "AudioVerse.Application.Areas.$area.Services.$($nestedPath.Replace('\', '.'))"
            }
            
            $content = Update-NamespaceInFile -FilePath $_.FullName -NewNamespace $newNs
            
            if ($content -and -not $DryRun) {
                $destFile = if ($nestedPath -and $nestedPath -ne $subFolder) { 
                    Join-Path $targetSubDir $_.Name 
                } else { 
                    Join-Path $targetDir $_.Name 
                }
                Set-Content -Path $destFile -Value $content -Encoding UTF8
                Remove-Item $_.FullName
                $movedServices++
            }
            if ($Verbose) { Write-Info "Service: $($_.Name) -> Areas/$area/Services/" }
        }
    }
    
    # Move root-level services to Common
    Get-ChildItem $servicesPath -Filter "*.cs" | ForEach-Object {
        $targetDir = "Areas\Common\Services"
        Ensure-Directory $targetDir
        
        $newNs = "AudioVerse.Application.Areas.Common.Services"
        $content = Update-NamespaceInFile -FilePath $_.FullName -NewNamespace $newNs
        
        if ($content -and -not $DryRun) {
            $destPath = Join-Path $targetDir $_.Name
            Set-Content -Path $destPath -Value $content -Encoding UTF8
            Remove-Item $_.FullName
            $movedServices++
        }
        if ($Verbose) { Write-Info "Service (root): $($_.Name) -> Areas/Common/Services/" }
    }
}

Write-Info "Moved $movedServices service files"
Write-Host ""

# ============================================================
# STEP 7: Reorganize Models
# ============================================================

Write-Step "Reorganizing Models..."

$modelsPath = "Models"
$movedModels = 0

# Model type detection
function Get-ModelType {
    param([string]$FileName, [string]$FolderName)
    
    if ($FileName -match "Dto\.cs$" -or $FolderName -eq "Dtos" -or $FolderName -eq "Dto") { return "Dto" }
    if ($FileName -match "Request\.cs$" -or $FolderName -eq "Requests") { return "Requests" }
    if ($FileName -match "Response\.cs$" -or $FileName -match "Result\.cs$" -or $FolderName -eq "Results") { return "Results" }
    return "Dto"  # Default to Dto
}

if (Test-Path $modelsPath) {
    # Process nested folders
    Get-ChildItem $modelsPath -Directory | ForEach-Object {
        $subFolder = $_.Name
        $area = Get-AreaFromPath $subFolder
        
        Get-ChildItem $_.FullName -Filter "*.cs" -Recurse | ForEach-Object {
            $modelType = Get-ModelType -FileName $_.Name -FolderName $_.Directory.Name
            $targetDir = "Areas\$area\Models\$modelType"
            
            Ensure-Directory $targetDir
            
            $newNs = "AudioVerse.Application.Areas.$area.Models.$modelType"
            $content = Update-NamespaceInFile -FilePath $_.FullName -NewNamespace $newNs
            
            if ($content -and -not $DryRun) {
                $destPath = Join-Path $targetDir $_.Name
                Set-Content -Path $destPath -Value $content -Encoding UTF8
                Remove-Item $_.FullName
                $movedModels++
            }
            if ($Verbose) { Write-Info "Model: $($_.Name) -> Areas/$area/Models/$modelType/" }
        }
    }
    
    # Process root-level model files
    Get-ChildItem $modelsPath -Filter "*.cs" | ForEach-Object {
        $modelType = Get-ModelType -FileName $_.Name -FolderName ""
        
        # Try to determine area from filename
        $area = "Common"
        foreach ($key in $folderToArea.Keys) {
            if ($_.Name -match $key) {
                $area = $folderToArea[$key]
                break
            }
        }
        
        $targetDir = "Areas\$area\Models\$modelType"
        Ensure-Directory $targetDir
        
        $newNs = "AudioVerse.Application.Areas.$area.Models.$modelType"
        $content = Update-NamespaceInFile -FilePath $_.FullName -NewNamespace $newNs
        
        if ($content -and -not $DryRun) {
            $destPath = Join-Path $targetDir $_.Name
            Set-Content -Path $destPath -Value $content -Encoding UTF8
            Remove-Item $_.FullName
            $movedModels++
        }
        if ($Verbose) { Write-Info "Model (root): $($_.Name) -> Areas/$area/Models/$modelType/" }
    }
}

Write-Info "Moved $movedModels model files"
Write-Host ""

# ============================================================
# STEP 8: Clean up empty directories
# ============================================================

Write-Step "Cleaning up empty directories..."

$dirsToClean = @("Commands", "Queries", "Handlers", "Validators", "Services", "Models")
foreach ($dir in $dirsToClean) {
    if (Test-Path $dir) {
        Get-ChildItem $dir -Directory -Recurse | 
            Sort-Object { $_.FullName.Length } -Descending | 
            Where-Object { (Get-ChildItem $_.FullName -File).Count -eq 0 } |
            ForEach-Object {
                if (-not $DryRun) {
                    Remove-Item $_.FullName -Force -ErrorAction SilentlyContinue
                }
                if ($Verbose) { Write-Info "Removed empty: $($_.FullName)" }
            }
        
        # Remove root if empty
        if ((Get-ChildItem $dir -Recurse -File).Count -eq 0 -and -not $DryRun) {
            Remove-Item $dir -Recurse -Force -ErrorAction SilentlyContinue
            Write-Info "Removed empty root: $dir"
        }
    }
}

Write-Host ""

# ============================================================
# SUMMARY
# ============================================================

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "SUMMARY" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "Commands moved:   $movedCommands" -ForegroundColor Green
Write-Host "Queries moved:    $movedQueries" -ForegroundColor Green
Write-Host "Handlers moved:   $movedHandlers" -ForegroundColor Green
Write-Host "Validators moved: $movedValidators" -ForegroundColor Green
Write-Host "Services moved:   $movedServices" -ForegroundColor Green
Write-Host "Models moved:     $movedModels" -ForegroundColor Green
Write-Host ""

if ($DryRun) {
    Write-Host "[DRY RUN] No changes were made. Run without -DryRun to apply." -ForegroundColor Yellow
} else {
    Write-Host "Reorganization complete!" -ForegroundColor Green
}

Write-Host ""
Write-Host "NEXT STEPS:" -ForegroundColor Cyan
Write-Host "1. Run 'dotnet build' to check for compilation errors"
Write-Host "2. Use Visual Studio 'Sync Namespaces' (right-click solution)"
Write-Host "3. Fix remaining using statements"
Write-Host "4. Update DependencyInjection.cs registrations if needed"
Write-Host ""
