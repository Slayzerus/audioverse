# ============================================================
# AudioVerse Domain Layer Reorganization Script
# ============================================================
# Run from: AudioVerse.Domain directory
# Usage: powershell -ExecutionPolicy Bypass -File scripts\reorganize-domain.ps1
# ============================================================

param(
    [switch]$DryRun = $false,
    [switch]$Verbose = $false
)

$ErrorActionPreference = "Continue"

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "AudioVerse Domain Layer Reorganization" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
if ($DryRun) { Write-Host "[DRY RUN MODE - no changes will be made]" -ForegroundColor Yellow }
Write-Host ""

# ============================================================
# CONFIGURATION
# ============================================================

$areas = @("Identity", "Karaoke", "Events", "Editor", "Admin", "DMX", "Games", "MediaLibrary", "Common")

$entityToArea = @{
    # Identity
    "UserProfile"           = "Identity"
    "UserProfileSettings"   = "Identity"
    "UserProfileMicrophone" = "Identity"
    "UserProfileDevice"     = "Identity"
    "UserProfilePlayer"     = "Identity"
    "UserBan"               = "Identity"
    "PasswordHistory"       = "Identity"
    "PasswordRequirements"  = "Identity"
    "LoginAttempt"          = "Identity"
    "OneTimePassword"       = "Identity"
    "Captcha"               = "Identity"
    "HoneyToken"            = "Identity"
    "MicrophoneAssignment"  = "Identity"
    
    # Karaoke (folder)
    "Karaoke"               = "Karaoke"
    
    # Events
    "Event"                 = "Events"
    "EventBilling"          = "Events"
    "EventPoll"             = "Events"
    "EventScheduleItem"     = "Events"
    "EventMenuItem"         = "Events"
    "EventAttraction"       = "Events"
    "EventBoardGame"        = "Events"
    "EventCouchGame"        = "Events"
    
    # Editor (folder)
    "Editor"                = "Editor"
    
    # Admin
    "AbuseReport"           = "Admin"
    "AuditLog"              = "Admin"
    "SystemConfiguration"   = "Admin"
    "AdminScoringPreset"    = "Admin"
    
    # DMX (folder)
    "Dmx"                   = "DMX"
    "DmxScene"              = "DMX"
    
    # Games
    "BoardGame"             = "Games"
    "CouchGame"             = "Games"
    
    # MediaLibrary (folder)
    "MediaLibrary"          = "MediaLibrary"
}

$enumToArea = @{
    # Identity
    "DeviceType"            = "Identity"
    "CaptchaOption"         = "Identity"
    
    # Karaoke
    "KaraokeEventEnums"     = "Karaoke"
    "KaraokeFormat"         = "Karaoke"
    "CollaborationPermission" = "Karaoke"
    "SongQueueStatus"       = "Karaoke"
    "EventInviteStatus"     = "Karaoke"
    "PitchDetectionMethod"  = "Karaoke"
    "RecordingType"         = "Karaoke"
    
    # Events
    "EventEnums"            = "Events"
    "EventInviteStatus"     = "Events"
    "BillingEnums"          = "Events"
    "PollType"              = "Events"
    
    # Editor
    "AudioEffectType"       = "Editor"
    "ExportStatus"          = "Editor"
    
    # DMX
    "DmxChannelType"        = "DMX"
    
    # MediaLibrary
    "MediaLibrary"          = "MediaLibrary"
    "AlbumArtistRole"       = "MediaLibrary"
    "ArtistFactType"        = "MediaLibrary"
    "SongDetailType"        = "MediaLibrary"
}

# ============================================================
# HELPER FUNCTIONS
# ============================================================

function Write-Step { param([string]$Message) Write-Host ">> $Message" -ForegroundColor Green }
function Write-Info { param([string]$Message) Write-Host "   $Message" -ForegroundColor Gray }
function Write-Warn { param([string]$Message) Write-Host "   [!] $Message" -ForegroundColor Yellow }

function Ensure-Directory {
    param([string]$Path)
    if (-not (Test-Path $Path) -and -not $DryRun) {
        New-Item -ItemType Directory -Path $Path -Force | Out-Null
    }
}

function Get-AreaFromEntityName {
    param([string]$FileName, [string]$FolderName)
    
    # Check folder first
    foreach ($key in $entityToArea.Keys) {
        if ($FolderName -eq $key) {
            return $entityToArea[$key]
        }
    }
    
    # Check filename
    $baseName = [System.IO.Path]::GetFileNameWithoutExtension($FileName)
    foreach ($key in $entityToArea.Keys) {
        if ($baseName -match "^$key" -or $baseName -eq $key) {
            return $entityToArea[$key]
        }
    }
    
    return "Common"
}

function Get-AreaFromEnumName {
    param([string]$FileName, [string]$FolderName)
    
    # Check folder first
    foreach ($key in $enumToArea.Keys) {
        if ($FolderName -eq $key) {
            return $enumToArea[$key]
        }
    }
    
    # Check filename
    $baseName = [System.IO.Path]::GetFileNameWithoutExtension($FileName)
    foreach ($key in $enumToArea.Keys) {
        if ($baseName -match $key -or $baseName -eq $key) {
            return $enumToArea[$key]
        }
    }
    
    return "Common"
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

Write-Step "Creating Areas directory structure in Domain..."

foreach ($area in $areas) {
    $paths = @(
        "Areas\$area\Entities",
        "Areas\$area\Enums",
        "Areas\$area\Repositories"
    )
    
    foreach ($path in $paths) {
        Ensure-Directory $path
    }
}

Write-Info "Directory structure created for $($areas.Count) areas"
Write-Host ""

# ============================================================
# STEP 2: Reorganize Entities
# ============================================================

Write-Step "Reorganizing Entities..."

$entitiesPath = "Entities"
$movedEntities = 0

if (Test-Path $entitiesPath) {
    # Process subfolders (Editor, Karaoke, Dmx, MediaLibrary)
    Get-ChildItem $entitiesPath -Directory | ForEach-Object {
        $subFolder = $_.Name
        $area = Get-AreaFromEntityName -FileName "" -FolderName $subFolder
        $targetDir = "Areas\$area\Entities"
        
        Ensure-Directory $targetDir
        
        Get-ChildItem $_.FullName -Filter "*.cs" | ForEach-Object {
            $newNs = "AudioVerse.Domain.Areas.$area.Entities"
            $content = Update-NamespaceInFile -FilePath $_.FullName -NewNamespace $newNs
            
            if ($content -and -not $DryRun) {
                $destPath = Join-Path $targetDir $_.Name
                Set-Content -Path $destPath -Value $content -Encoding UTF8
                Remove-Item $_.FullName
                $movedEntities++
            }
            if ($Verbose) { Write-Info "Entity: $($_.Name) -> Areas/$area/Entities/" }
        }
    }
    
    # Process root-level entity files
    Get-ChildItem $entitiesPath -Filter "*.cs" | ForEach-Object {
        $area = Get-AreaFromEntityName -FileName $_.Name -FolderName ""
        $targetDir = "Areas\$area\Entities"
        
        Ensure-Directory $targetDir
        
        $newNs = "AudioVerse.Domain.Areas.$area.Entities"
        $content = Update-NamespaceInFile -FilePath $_.FullName -NewNamespace $newNs
        
        if ($content -and -not $DryRun) {
            $destPath = Join-Path $targetDir $_.Name
            Set-Content -Path $destPath -Value $content -Encoding UTF8
            Remove-Item $_.FullName
            $movedEntities++
        }
        if ($Verbose) { Write-Info "Entity: $($_.Name) -> Areas/$area/Entities/" }
    }
}

Write-Info "Moved $movedEntities entity files"
Write-Host ""

# ============================================================
# STEP 3: Reorganize Enums
# ============================================================

Write-Step "Reorganizing Enums..."

$enumsPath = "Enums"
$movedEnums = 0

if (Test-Path $enumsPath) {
    # Process subfolders
    Get-ChildItem $enumsPath -Directory | ForEach-Object {
        $subFolder = $_.Name
        $area = Get-AreaFromEnumName -FileName "" -FolderName $subFolder
        $targetDir = "Areas\$area\Enums"
        
        Ensure-Directory $targetDir
        
        Get-ChildItem $_.FullName -Filter "*.cs" | ForEach-Object {
            $newNs = "AudioVerse.Domain.Areas.$area.Enums"
            $content = Update-NamespaceInFile -FilePath $_.FullName -NewNamespace $newNs
            
            if ($content -and -not $DryRun) {
                $destPath = Join-Path $targetDir $_.Name
                Set-Content -Path $destPath -Value $content -Encoding UTF8
                Remove-Item $_.FullName
                $movedEnums++
            }
            if ($Verbose) { Write-Info "Enum: $($_.Name) -> Areas/$area/Enums/" }
        }
    }
    
    # Process root-level enum files
    Get-ChildItem $enumsPath -Filter "*.cs" | ForEach-Object {
        $area = Get-AreaFromEnumName -FileName $_.Name -FolderName ""
        $targetDir = "Areas\$area\Enums"
        
        Ensure-Directory $targetDir
        
        $newNs = "AudioVerse.Domain.Areas.$area.Enums"
        $content = Update-NamespaceInFile -FilePath $_.FullName -NewNamespace $newNs
        
        if ($content -and -not $DryRun) {
            $destPath = Join-Path $targetDir $_.Name
            Set-Content -Path $destPath -Value $content -Encoding UTF8
            Remove-Item $_.FullName
            $movedEnums++
        }
        if ($Verbose) { Write-Info "Enum: $($_.Name) -> Areas/$area/Enums/" }
    }
}

Write-Info "Moved $movedEnums enum files"
Write-Host ""

# ============================================================
# STEP 4: Reorganize Repositories (interfaces)
# ============================================================

Write-Step "Reorganizing Repository interfaces..."

$reposPath = "Repositories"
$movedRepos = 0

$repoToArea = @{
    "IUserProfileRepository" = "Identity"
    "IKaraokeRepository"     = "Karaoke"
    "IEfKaraokeRepository"   = "Karaoke"
    "IDapperKaraokeRepository" = "Karaoke"
    "IEditorRepository"      = "Editor"
    "IEventRepository"       = "Events"
}

if (Test-Path $reposPath) {
    Get-ChildItem $reposPath -Filter "*.cs" | ForEach-Object {
        $baseName = [System.IO.Path]::GetFileNameWithoutExtension($_.Name)
        $area = if ($repoToArea.ContainsKey($baseName)) { $repoToArea[$baseName] } else { "Common" }
        $targetDir = "Areas\$area\Repositories"
        
        Ensure-Directory $targetDir
        
        $newNs = "AudioVerse.Domain.Areas.$area.Repositories"
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

Write-Info "Moved $movedRepos repository interface files"
Write-Host ""

# ============================================================
# STEP 5: Clean up empty directories
# ============================================================

Write-Step "Cleaning up empty directories..."

$dirsToClean = @("Entities", "Enums", "Repositories")
foreach ($dir in $dirsToClean) {
    if (Test-Path $dir) {
        Get-ChildItem $dir -Directory -Recurse | 
            Sort-Object { $_.FullName.Length } -Descending | 
            Where-Object { (Get-ChildItem $_.FullName -File).Count -eq 0 } |
            ForEach-Object {
                if (-not $DryRun) {
                    Remove-Item $_.FullName -Force -ErrorAction SilentlyContinue
                }
            }
        
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
Write-Host "Entities moved:     $movedEntities" -ForegroundColor Green
Write-Host "Enums moved:        $movedEnums" -ForegroundColor Green
Write-Host "Repositories moved: $movedRepos" -ForegroundColor Green
Write-Host ""

if ($DryRun) {
    Write-Host "[DRY RUN] No changes were made." -ForegroundColor Yellow
} else {
    Write-Host "Reorganization complete!" -ForegroundColor Green
}

Write-Host ""
Write-Host "NEXT STEPS:" -ForegroundColor Cyan
Write-Host "1. Run 'dotnet build' to check for compilation errors"
Write-Host "2. Use Visual Studio 'Sync Namespaces'"
Write-Host "3. Update DbContext entity configurations"
Write-Host ""
