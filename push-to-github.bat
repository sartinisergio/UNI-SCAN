@echo off
REM Script per aggiornare GitHub con i file di uni-scan
REM Posizionare questo file nella cartella uni-scan-complete

setlocal enabledelayedexpansion

REM Colori per output
color 0A

echo.
echo ============================================
echo  UNI-SCAN - Push to GitHub
echo ============================================
echo.

REM Vai nella cartella uni-scan
cd /d "%~dp0uni-scan"

if errorlevel 1 (
    echo ERRORE: Cartella uni-scan non trovata!
    echo Assicurati che questo file sia nella cartella uni-scan-complete
    pause
    exit /b 1
)

echo [1/5] Verifico lo stato del repository...
git status
if errorlevel 1 (
    echo ERRORE: Non sei in un repository Git!
    pause
    exit /b 1
)

echo.
echo [2/5] Aggiungo tutti i file modificati...
git add .
echo OK - File aggiunti

echo.
echo [3/5] Creo il commit...
set /p commit_msg="Inserisci il messaggio del commit (premi Invio per il messaggio di default): "
if "!commit_msg!"=="" (
    set commit_msg=Update: HTML export, bug fixes, pnpm lockfile
)

git commit -m "!commit_msg!"
if errorlevel 1 (
    echo ERRORE: Commit fallito!
    pause
    exit /b 1
)
echo OK - Commit creato

echo.
echo [4/5] Verifico il branch corrente...
for /f "tokens=*" %%i in ('git rev-parse --abbrev-ref HEAD') do set branch=%%i
echo Branch corrente: !branch!

echo.
echo [5/5] Faccio il push su GitHub...
git push origin !branch!
if errorlevel 1 (
    echo ERRORE: Push fallito!
    echo Verifica la connessione a GitHub e i permessi
    pause
    exit /b 1
)

echo.
echo ============================================
echo  SUCCESSO! I file sono stati aggiornati su GitHub
echo ============================================
echo.
pause
