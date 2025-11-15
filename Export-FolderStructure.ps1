# Zapisz jako np. Export-FolderStructure.ps1
param(
    [string]$Path = ".",
    [string]$OutputFile = "folder-structure.txt"
)

# Funkcja do rekurencyjnego budowania drzewa
function Get-Tree($dir, $prefix = "") {
    $items = Get-ChildItem -LiteralPath $dir | Where-Object { $_.PSIsContainer -and $_.Name -notin @("bin","obj") }

    foreach ($item in $items) {
        "$prefix├─ $($item.Name)" | Out-File -Append -FilePath $OutputFile
        Get-Tree -dir $item.FullName -prefix "$prefix│  "
    }
}

# Start
"Struktura folderu: $Path" | Out-File $OutputFile
Get-Tree $Path

Write-Host "Struktura zapisana w pliku: $OutputFile"
