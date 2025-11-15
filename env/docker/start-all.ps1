# =========================
# start-all.ps1  (v5)
# =========================
[CmdletBinding()]
param(
  [switch]$Build,     # -Build => wykonaj docker compose build przed up
  [switch]$Quiet      # -Quiet => mniej logów na konsoli (w logach pełny zapis)
)

$ErrorActionPreference = 'Stop'

# ---------- Paths & logging ----------
$ScriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ScriptRoot

# --- init shared vars for logging ---
$script:RunStamp = Get-Date -Format 'yyyyMMdd_HHmmss'
$script:LogsDir  = Join-Path $PSScriptRoot 'logs'
if (-not (Test-Path -LiteralPath $script:LogsDir)) {
    New-Item -ItemType Directory -Force -Path $script:LogsDir | Out-Null
}

$LogsDir   = Join-Path $ScriptRoot 'logs'
if (-not (Test-Path $LogsDir)) { New-Item -ItemType Directory -Path $LogsDir | Out-Null }

$Stamp     = (Get-Date).ToString('yyyyMMdd_HHmmss')
$MainLog   = Join-Path $LogsDir ("start-all_{0}.log" -f $Stamp)

function Invoke-External {
    param(
        [Parameter(Mandatory)] [string]  $Exe,
        [Parameter(Mandatory)] [string[]]$Args,
        [Parameter(Mandatory)] [string]  $LogPath
    )
    $psi = New-Object System.Diagnostics.ProcessStartInfo
    $psi.FileName = $Exe
    foreach ($a in $Args) { [void]$psi.ArgumentList.Add($a) }
    $psi.UseShellExecute        = $false
    $psi.RedirectStandardOutput = $true
    $psi.RedirectStandardError  = $true

    $p = [System.Diagnostics.Process]::Start($psi)
    $stdout = $p.StandardOutput.ReadToEnd()
    $stderr = $p.StandardError.ReadToEnd()
    $p.WaitForExit()
    $code = $p.ExitCode

    if ($stdout) { Add-Content -LiteralPath $LogPath -Value $stdout }
    if ($stderr) { Add-Content -LiteralPath $LogPath -Value $stderr }

    [pscustomobject]@{
        ExitCode = $code
        StdOut   = $stdout
        StdErr   = $stderr
    }
}


function Write-Log {
    param(
        [Parameter(Mandatory=$true)][string]$Message,
        [ValidateSet('INFO','STEP','OK','WARN','ERR')][string]$Level = 'INFO',
        [string]$LogPath = $Script:MainLog
    )
    $line = "[{0}][{1}] {2}" -f (Get-Date -Format 'yyyy-MM-dd HH:mm:ss'), $Level, $Message
    if (-not $Quiet) { Write-Host $line }
    Add-Content -LiteralPath $LogPath -Value $line
}

Write-Log "Initializing ..." 'STEP'
Write-Log ("Script root: {0}" -f $ScriptRoot)
Write-Log ("Logs dir:    {0}" -f $LogsDir)
Write-Log ("Main log:    {0}" -f $MainLog)
Write-Log ("Compose pattern: docker-compose.*.yml")
Write-Log ("Build images: {0}" -f [bool]$Build)
Write-Log ("Quiet:        {0}" -f [bool]$Quiet)

# ---------- Docker / Compose detection ----------
Write-Log "Checking Docker installation ..." 'STEP'
$dockerVersion = & docker -v 2>&1
Write-Log ("docker -v: {0}" -f $dockerVersion)

function Get-ComposeRunner {
    # Prefer 'docker compose' (v2). Fallback to 'docker-compose' if needed.
    try {
        $test = & docker compose version 2>$null
        if ($LASTEXITCODE -eq 0) {
            return @{ Kind='v2'; Exe='docker'; Prefix=@('compose') }
        }
    } catch { }
    $dc = Get-Command docker-compose -ErrorAction SilentlyContinue
    if ($dc) { return @{ Kind='v1'; Exe=$dc.Source; Prefix=@() } }
    throw "Neither 'docker compose' nor 'docker-compose' is available."
}
$Compose = Get-ComposeRunner
Write-Log ("Using '{0} {1}'." -f $Compose.Exe, ($Compose.Prefix -join ' ')) 'OK'

# ---------- .env loader (basic KEY=VALUE) ----------
Write-Log "Loading environment from '.env' ..."
$EnvFile = Join-Path $ScriptRoot '.env'
if (Test-Path $EnvFile) {
    Get-Content $EnvFile | ForEach-Object {
        $line = $_.Trim()
        if ($line -eq '' -or $line.StartsWith('#')) { return }
        if ($line -match '^\s*([A-Za-z_]\w*)\s*=\s*(.*)$') {
            $name  = $matches[1]
            $value = $matches[2].Trim()

            # zdejmij cudzysłowy
            if ($value -match '^"(.*)"$') { $value = $matches[1] }
            elseif ($value -match "^'(.*)'$") { $value = $matches[1] }

            # ${VAR} -> wartości z ENV (Process/User/Machine)
            $value = [regex]::Replace($value, '\$\{([^}]+)\}', {
                param($m)
                $vn = $m.Groups[1].Value
                $vv = [Environment]::GetEnvironmentVariable($vn, 'Process')
                if ([string]::IsNullOrEmpty($vv)) { $vv = [Environment]::GetEnvironmentVariable($vn, 'User') }
                if ([string]::IsNullOrEmpty($vv)) { $vv = [Environment]::GetEnvironmentVariable($vn, 'Machine') }
                if ([string]::IsNullOrEmpty($vv)) { $vv = $m.Value }
                $vv
            })

            Set-Item -Path ("Env:{0}" -f $name) -Value $value
        }
    }
} else {
    Write-Log "No .env file found (that's fine)." 'WARN'
}

# ---------- Ensure network ----------
$networkName = if ($env:NETWORK_NAME -and $env:NETWORK_NAME.Trim()) { $env:NETWORK_NAME } else { 'audioverse-net' }
Write-Log ("Ensuring docker network '{0}' exists ..." -f $networkName)
try {
    $netExists = & docker network ls --format '{{.Name}}' 2>$null | Where-Object { $_ -eq $networkName }
    if (-not $netExists) {
        & docker network create $networkName | Out-Null
        Write-Log ("Network '{0}' created." -f $networkName)
    } else {
        Write-Log ("Network '{0}' already exists." -f $networkName)
    }
} catch {
    Write-Log ("Failed to verify/create network '{0}': {1}" -f $networkName, $_.Exception.Message) 'ERR'
    throw
}

# ---------- Helpers ----------
function Invoke-Compose {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)][string]  $Project,
        [Parameter(Mandatory)][string]  $ComposeFile,
        [Parameter()][string[]]         $Args = @(),
        [Parameter()][string]           $LogPath
    )

    # Domyślny plik logu, jeśli nie podano
    if ([string]::IsNullOrWhiteSpace($LogPath)) {
        $LogPath = Join-Path $script:LogsDir ("{0}_{1}.log" -f $Project, $script:RunStamp)
    }

    # Zbuduj pełne argumenty
    $arguments = @('compose', '-p', $Project, '-f', $ComposeFile) + $Args

    Write-Log ("Running: docker {0}" -f ($arguments -join ' '))
    # Użyj Twojej helper-funkcji, która NIE miesza stderr ze stdout i sprawdza ExitCode
    $res = Invoke-External -Exe 'docker' -Args $arguments -LogPath $LogPath

    if ($res.ExitCode -eq 0) {
        Write-Log ("OK (exit {0}): docker {1}" -f $res.ExitCode, ($arguments -join ' ')) 'OK'
    } else {
        Write-Log ("FAIL (exit {0}): docker {1}" -f $res.ExitCode, ($arguments -join ' ')) 'ERROR'
        if ($res.StdErr) { Write-Log ("stderr: " + $res.StdErr.Trim()) 'ERROR' }
        if ($res.StdOut) { Write-Log ("stdout: " + $res.StdOut.Trim()) 'INFO' }
        throw "Compose failed for project '$Project'. See log: $LogPath"
    }
}

function Show-ComposeSummary {
    param(
        [Parameter(Mandatory=$true)][string]$Project,
        [Parameter(Mandatory=$true)][string]$ComposeFile,
        [Parameter(Mandatory=$true)][string]$ProjectLog
    )
    Write-Log ("Summary for {0} ({1}) ..." -f $Project, $ComposeFile) 'INFO' $ProjectLog

    $common = @('-p', $Project, '-f', $ComposeFile)
    $psArgs = @('ps','--format','table {{.Name}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}')

    $args = @()
    $args += $Compose.Prefix
    $args += $common
    $args += $psArgs

    $pretty = "{0} {1}" -f $Compose.Exe, ($args -join ' ')
    Write-Log ("Running: {0}" -f $pretty) 'INFO' $ProjectLog

    $out = & $Compose.Exe @args 2>&1
    if ($out) {
        if (-not $Quiet) { $out | Write-Host }
        $out | Add-Content -LiteralPath $ProjectLog
    }
}

# ---------- Process compose files ----------
Write-Log "Searching compose files by pattern 'docker-compose.*.yml' ..." 'STEP'
$composeFiles = Get-ChildItem -File -Filter 'docker-compose.*.yml' | Sort-Object Name
if (-not $composeFiles) { Write-Log "No docker-compose.*.yml files found. Exiting." 'ERR'; exit 1 }

# Ordered run: ai audio -> core -> videoai (jeśli istnieją)
$ordered = @('docker-compose.aiaudio.yml','docker-compose.core.yml','docker-compose.videoai.yml')
$sorted = foreach ($n in $ordered) { $composeFiles | Where-Object { $_.Name -eq $n } }
$rest   = $composeFiles | Where-Object { $ordered -notcontains $_.Name }
$all    = @($sorted + $rest)

foreach ($file in $all) {
    $proj =
        if ($file.Name -match 'aiaudio') { 'proj-aiaudio' }
        elseif ($file.Name -match 'core') { 'proj-core' }
        elseif ($file.Name -match 'videoai') { 'proj-videoai' }
        else { 'proj-' + ($file.BaseName -replace '^docker-compose\.','') }

    $projectLog = Join-Path $LogsDir ("{0}_{1}.log" -f $proj, $Stamp)

    Write-Log ("Starting {0} (project: {1}) ..." -f $file.Name, $proj) 'STEP' $projectLog

    if ($Build) {
        Invoke-Compose -Project $proj -ComposeFile $file.Name -Args @('build','--pull') -ProjectLog $projectLog | Out-Null
    }

    Invoke-Compose -Project $proj -ComposeFile $file.Name -Args @('up','-d','--remove-orphans') -ProjectLog $projectLog | Out-Null
    Show-ComposeSummary -Project $proj -ComposeFile $file.Name -ProjectLog $projectLog
}

Write-Log "Aggregate summary ..." 'STEP'
foreach ($file in $all) {
    $proj =
        if ($file.Name -match 'aiaudio') { 'proj-aiaudio' }
        elseif ($file.Name -match 'core') { 'proj-core' }
        elseif ($file.Name -match 'videoai') { 'proj-videoai' }
        else { 'proj-' + ($file.BaseName -replace '^docker-compose\.','') }

    $projectLog = Join-Path $LogsDir ("{0}_{1}.log" -f $proj, $Stamp)
    Write-Log ("{0} => Log: {1}" -f $proj, $projectLog) 'INFO'
}

Write-Log "All compose files processed." 'OK'
