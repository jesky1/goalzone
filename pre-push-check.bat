@echo off
chcp 65001 >nul 2>&1
title GOALZONE Pre-Push Security Check
setlocal enabledelayedexpansion

set ERRORS=0
set PASSED=0

echo.
echo ══════════════════════════════════════════════════
echo   GOALZONE Pre-Push Security Check
echo ══════════════════════════════════════════════════
echo.

:: ─── Check if git repo exists ───
if not exist ".git" (
    echo [WARNING] Git repo belum di-initialize.
    echo    Jalankan: git init dulu.
    echo.
    pause
    exit /b 1
)

:: ══════════════════════════════════════════════════
:: SECTION 1: Check .gitignore exists
:: ══════════════════════════════════════════════════
echo [1/5] Checking .gitignore...

if not exist ".gitignore" (
    echo   [BAHAYA] .gitignore TIDAK DITEMUKAN!
    set /a ERRORS+=1
) else (
    echo   [OK] .gitignore ditemukan

    for %%E in (.env .env.local .env.production.local db\ download\ upload\ dev.log) do (
        findstr /C:"%%E" .gitignore >nul 2>&1
        if !errorlevel! equ 0 (
            echo     [OK] "%%E" found in .gitignore
            set /a PASSED+=1
        ) else (
            echo     [BAHAYA] "%%E" MISSING dari .gitignore!
            set /a ERRORS+=1
        )
    )
)

echo.

:: ══════════════════════════════════════════════════
:: SECTION 2: Check sensitive files on disk
:: ══════════════════════════════════════════════════
echo [2/5] Checking sensitive files on disk...

for %%F in (.env .env.local .env.production.local .env.development.local .env.test.local) do (
    if exist "%%F" (
        git check-ignore "%%F" >nul 2>&1
        if !errorlevel! equ 0 (
            echo   [OK] %%F — di-ignore
            set /a PASSED+=1
        ) else (
            echo   [BAHAYA] %%F ADA tapi TIDAK di-ignore!
            set /a ERRORS+=1
        )
    ) else (
        echo   [INFO] %%F — tidak ada di disk ^(ok^)
    )
)

if exist "db\custom.db" (
    git check-ignore "db\custom.db" >nul 2>&1
    if !errorlevel! equ 0 (
        echo   [OK] db\custom.db — di-ignore
        set /a PASSED+=1
    ) else (
        echo   [BAHAYA] db\custom.db ADA tapi TIDAK di-ignore!
        set /a ERRORS+=1
    )
)

echo.

:: ══════════════════════════════════════════════════
:: SECTION 3: Check sensitive directories
:: ══════════════════════════════════════════════════
echo [3/5] Checking sensitive directories...

for %%D in (download upload db agent-ctx .vercel node_modules .next) do (
    if exist "%%D" (
        git check-ignore "%%D" >nul 2>&1
        if !errorlevel! equ 0 (
            echo   [OK] %%D\ — di-ignore
            set /a PASSED+=1
        ) else (
            echo   [BAHAYA] %%D\ ADA tapi TIDAK di-ignore!
            set /a ERRORS+=1
        )
    ) else (
        echo   [INFO] %%D\ — tidak ada di disk ^(ok^)
    )
)

echo.

:: ══════════════════════════════════════════════════
:: SECTION 4: Check staged files for secrets
:: ══════════════════════════════════════════════════
echo [4/5] Scanning staged files for secrets...

set FOUND_DANGER=0

:: Check if any .env files are staged
for /f "tokens=*" %%F in ('git diff --cached --name-only --diff-filter=ACMR 2^>nul') do (
    set "fname=%%~nxF"
    
    :: Skip .example files
    echo !fname! | findstr /I ".example" >nul 2>&1
    if !errorlevel! neq 0 (
        echo !fname! | findstr /I ".env .env.local credentials secret password private_key .pem .key .db .sql" >nul 2>&1
        if !errorlevel! equ 0 (
            echo   [BAHAYA] DITEMUKAN: %%F ^(matches dangerous pattern^)
            set /a ERRORS+=1
            set FOUND_DANGER=1
        )
    )
)

if !FOUND_DANGER! equ 0 (
    echo   [OK] No dangerous files detected in staging
    set /a PASSED+=1
)

echo.

:: ══════════════════════════════════════════════════
:: SECTION 5: Summary
:: ══════════════════════════════════════════════════
echo ══════════════════════════════════════════════════

if !ERRORS! gtr 0 (
    echo   [FAILED] !ERRORS! error^(s^) found!
    echo.
    echo   JANGAN PUSH! Fix masalah di atas dulu.
    echo.
    echo   Tips:
    echo   - git rm --cached ^<file^>    — hapus dari tracking
    echo   - echo "file" ^>^> .gitignore — tambah ke ignore
    echo   - git status                — cek ulang
    echo.
) else (
    echo   [ALL CLEAR] Safe to push!
    echo.
    echo   Aman untuk menjalankan:
    echo     git add .
    echo     git commit -m "your message"
    echo     git push
    echo.
)

echo ══════════════════════════════════════════════════
echo.

pause
