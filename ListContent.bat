@echo off
setlocal EnableExtensions EnableDelayedExpansion

REM === Pliki wyjściowe ===
set "OUT_FULL=ListContent.txt"
set "OUT_DIRS=ListContentNoFiles.txt"

REM === Katalog bazowy (do ścieżek względnych) ===
set "ROOT=%CD%"
if not "%ROOT:~-1%"=="\" set "ROOT=%ROOT%\"

REM === Lista katalogów do pominięcia (dopasowanie po NAZWIE katalogu, case-insensitive) ===
REM Dodawaj tutaj kolejne nazwy oddzielone spacją (np. .terraform .cache venv __pycache__ itd.)
set "EXCLUDES=bin obj .git node_modules dist build .vs .idea coverage packages"

REM === Nagłówki ===
> "%OUT_FULL%"  echo Struktura (z wykluczeniami: %EXCLUDES%) dla: %CD%
>>"%OUT_FULL%"  echo.
> "%OUT_DIRS%"  echo Struktura katalogów (bez plików; z wykluczeniami: %EXCLUDES%) dla: %CD%
>>"%OUT_DIRS%"  echo.

REM === Wypisz katalog startowy "." ===
>>"%OUT_FULL%"  echo .
>>"%OUT_DIRS%"  echo .

REM === Start przejścia po drzewie ===
call :Walk "%CD%"

echo Gotowe.
echo   %OUT_FULL%        (katalogi i pliki)
echo   %OUT_DIRS%        (tylko katalogi)
goto :eof


REM ============================================================
REM  :Walk <abs_path>
REM    - najpierw wypisuje PODKATALOGI bieżącego katalogu,
REM    - potem wypisuje PLIKI bieżącego katalogu,
REM    - a następnie rekurencyjnie wchodzi do każdego podkatalogu
REM      (który nie jest na liście wykluczeń).
REM ============================================================
:Walk
set "CUR=%~1"

REM --- 1) PODKATALOGI (wypisz NAZWY, ale nie wchodź jeszcze) ---
for /D %%S in ("%CUR%\*") do (
    call :ShouldSkipName "%%~nxS"
    if not defined SKIP (
        set "rel=%%~fS"
        set "rel=!rel:%ROOT%=!"
        echo !rel!>>"%OUT_FULL%"
        echo !rel!>>"%OUT_DIRS%"
    )
)

REM --- 2) PLIKI bieżącego katalogu ---
for %%F in ("%CUR%\*") do (
    if not exist "%%~fF\" (
        REM to jest plik (nie katalog)
        set "rel=%%~fF"
        set "rel=!rel:%ROOT%=!"
        echo !rel!>>"%OUT_FULL%"
    )
)

REM --- 3) REKURSJA: przejdź do każdego dozwolonego podkatalogu ---
for /D %%S in ("%CUR%\*") do (
    call :ShouldSkipName "%%~nxS"
    if not defined SKIP (
        call :Walk "%%~fS"
    )
)

exit /b


REM ============================================================
REM  :ShouldSkipName <name>
REM    Ustawia SKIP=1 jeśli nazwa katalogu jest na liście EXCLUDES
REM ============================================================
:ShouldSkipName
set "SKIP="
set "NAME=%~1"
for %%E in (%EXCLUDES%) do (
    if /I "%%E"=="%NAME%" set "SKIP=1"
)
exit /b
