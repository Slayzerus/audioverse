<# 
    Export-Ultrastar.ps1
    - Szuka plików tekstowych Ultrastar (zawierających linię #TITLE:)
    - Kopiuje do folderu "UltrastarSongs" w miejscu uruchomienia
    - Deduplikacja wg nazw: jeśli istnieje plik o tej samej nazwie i rozmiarze → pomija,
      jeśli rozmiar inny → zachowuje obie wersje (dokłada sufiks).
#>

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

# Katalog roboczy (tam, gdzie uruchamiasz skrypt)
$Root = Get-Location
$Dest = Join-Path $Root "UltrastarSongs"

# Utwórz folder docelowy
if (-not (Test-Path -LiteralPath $Dest)) {
    New-Item -ItemType Directory -Path $Dest | Out-Null
}

# Funkcja: czy to plik Ultrastar (prosty test nagłówka)
function Test-IsUltrastarFile {
    param([string]$Path)
    try {
        # Sprawdza czy w pliku jest linia zaczynająca się od #TITLE:
        return Select-String -Path $Path -Pattern '^\s*#TITLE\s*:' -Quiet
    } catch {
        return $false
    }
}

# Funkcja: znajdź unikalną nazwę, jeśli w docelowym folderze istnieje plik o tej samej nazwie
function Get-UniqueName {
    param(
        [string]$Directory,
        [string]$FileName
    )
    $base = [System.IO.Path]::GetFileNameWithoutExtension($FileName)
    $ext  = [System.IO.Path]::GetExtension($FileName)
    $i = 2
    $candidate = $FileName
    while (Test-Path -LiteralPath (Join-Path $Directory $candidate)) {
        $candidate = "$base ($i)$ext"
        $i++
    }
    return $candidate
}

# Nie przeszukuj folderu docelowego w czasie rekursji
$destPrefix = ([IO.Path]::GetFullPath($Dest)).TrimEnd('\')

Get-ChildItem -Path $Root -Recurse -File -Filter *.txt |
    Where-Object {
        # Pomiń wszystko, co już jest w UltrastarSongs
        $full = [IO.Path]::GetFullPath($_.FullName).TrimEnd('\')
        -not $full.StartsWith($destPrefix, [System.StringComparison]::OrdinalIgnoreCase)
    } |
    Where-Object { Test-IsUltrastarFile -Path $_.FullName } |
    ForEach-Object {
        $src = $_
        $targetName = $src.Name
        $targetPath = Join-Path $Dest $targetName

        if (Test-Path -LiteralPath $targetPath) {
            $dstItem = Get-Item -LiteralPath $targetPath
            if ($dstItem.Length -eq $src.Length) {
                Write-Host "Pomijam (duplikat tej samej wielkości): $($src.FullName)"
                return
            } else {
                # Inny rozmiar → zachowaj oba (znajdź wolną nazwę)
                $targetName = Get-UniqueName -Directory $Dest -FileName $targetName
                $targetPath = Join-Path $Dest $targetName
            }
        }

        Copy-Item -LiteralPath $src.FullName -Destination $targetPath -Force
        Write-Host "Skopiowano: $($src.FullName) -> $targetPath"
    }

Write-Host "`nGotowe. Pliki znajdziesz w: $Dest"
