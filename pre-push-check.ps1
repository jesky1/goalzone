# ============================================================
# GOALZONE — Pre-Push Security Check (PowerShell)
# ============================================================
# Usage: Klik kanan > Run with PowerShell
#   atau: powershell -ExecutionPolicy Bypass -File pre-push-check.ps1
# ============================================================

$ErrorActionPreference = "SilentlyContinue"
$errors = 0
$passed = 0

Write-Host ""
Write-Host "══════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  GOALZONE Pre-Push Security Check" -ForegroundColor Cyan -Bold
Write-Host "══════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# ─── Check git repo ───
if (-not (Test-Path ".git")) {
    Write-Host "  Git repo belum di-initialize." -ForegroundColor Yellow
    Write-Host "  Jalankan: git init" -ForegroundColor Cyan
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

# ══════════════════════════════════════════════════
# SECTION 1: .gitignore check
# ══════════════════════════════════════════════════
Write-Host "[1/5] Checking .gitignore..." -ForegroundColor White -Bold

if (-not (Test-Path ".gitignore")) {
    Write-Host "  ❌ BAHAYA: .gitignore TIDAK DITEMUKAN!" -ForegroundColor Red
    $errors++
} else {
    Write-Host "  ✅ .gitignore ditemukan" -ForegroundColor Green

    $entries = @(".env", ".env.local", ".env.production.local", "db/", "download/", "upload/", "dev.log")
    foreach ($entry in $entries) {
        $content = Get-Content ".gitignore" -Raw
        if ($content -match [regex]::Escape($entry)) {
            Write-Host "    ✅ `"$entry`" found" -ForegroundColor Green
            $passed++
        } else {
            Write-Host "    ❌ `"$entry`" MISSING!" -ForegroundColor Red
            $errors++
        }
    }
}

Write-Host ""

# ══════════════════════════════════════════════════
# SECTION 2: Sensitive files on disk
# ══════════════════════════════════════════════════
Write-Host "[2/5] Checking sensitive files on disk..." -ForegroundColor White -Bold

$sensitiveFiles = @(".env", ".env.local", ".env.production.local", ".env.development.local", ".env.test.local", "db\custom.db")

foreach ($file in $sensitiveFiles) {
    if (Test-Path $file) {
        $ignored = git check-ignore $file 2>$null
        if ($ignored) {
            Write-Host "  ✅ $file — di-ignore" -ForegroundColor Green
            $passed++
        } else {
            Write-Host "  ❌ BAHAYA: $file ADA tapi TIDAK di-ignore!" -ForegroundColor Red
            $errors++
        }
    } else {
        Write-Host "  ⚠️  $file — tidak ada di disk (ok)" -ForegroundColor Yellow
    }
}

Write-Host ""

# ══════════════════════════════════════════════════
# SECTION 3: Sensitive directories
# ══════════════════════════════════════════════════
Write-Host "[3/5] Checking sensitive directories..." -ForegroundColor White -Bold

$sensitiveDirs = @("download", "upload", "db", "agent-ctx", ".vercel", "node_modules", ".next")

foreach ($dir in $sensitiveDirs) {
    if (Test-Path $dir) {
        $ignored = git check-ignore $dir 2>$null
        if ($ignored) {
            Write-Host "  ✅ $dir/ — di-ignore" -ForegroundColor Green
            $passed++
        } else {
            Write-Host "  ❌ BAHAYA: $dir/ ADA tapi TIDAK di-ignore!" -ForegroundColor Red
            $errors++
        }
    } else {
        Write-Host "  ⚠️  $dir/ — tidak ada di disk (ok)" -ForegroundColor Yellow
    }
}

Write-Host ""

# ══════════════════════════════════════════════════
# SECTION 4: Scan staged files
# ══════════════════════════════════════════════════
Write-Host "[4/5] Scanning staged files for secrets..." -ForegroundColor White -Bold

$staged = git diff --cached --name-only --diff-filter=ACMR 2>$null
$untracked = git ls-files --others --exclude-standard 2>$null
$allFiles = @()

if ($staged) { $allFiles += $staged }
if ($untracked) { $allFiles += $untracked }

if ($allFiles.Count -eq 0) {
    Write-Host "  ℹ️  Tidak ada staged/untracked files" -ForegroundColor Cyan
} else {
    $dangerPatterns = @(".env", ".env.local", "credentials", "secret", "password", "private_key", ".pem", ".key", ".db", ".sql")
    $foundDanger = $false

    foreach ($file in $allFiles) {
        $filename = Split-Path $file -Leaf

        # Skip .example files
        if ($filename -match "\.example$") { continue }

        foreach ($pattern in $dangerPatterns) {
            if ($filename -match [regex]::Escape($pattern)) {
                Write-Host "  🚨 DITEMUKAN: $file (matches `"$pattern`")" -ForegroundColor Red
                $errors++
                $foundDanger = $true
                break
            }
        }
    }

    if (-not $foundDanger) {
        Write-Host "  ✅ $($allFiles.Count) files scanned — no secrets detected" -ForegroundColor Green
        $passed++
    }
}

Write-Host ""

# ══════════════════════════════════════════════════
# RESULT
# ══════════════════════════════════════════════════
Write-Host "══════════════════════════════════════════════════" -ForegroundColor Cyan

if ($errors -gt 0) {
    Write-Host "  ❌ FAILED — $errors error(s) found!" -ForegroundColor Red -Bold
    Write-Host ""
    Write-Host "  JANGAN PUSH! Fix masalah di atas dulu." -ForegroundColor Red
    Write-Host ""
    Write-Host "  Tips:" -ForegroundColor White
    Write-Host "  - git rm --cached <file>    — hapus dari tracking" -ForegroundColor Cyan
    Write-Host "  - echo `"file`" >> .gitignore — tambah ke ignore" -ForegroundColor Cyan
    Write-Host "  - git status                — cek ulang" -ForegroundColor Cyan
} else {
    Write-Host "  ✅ ALL CLEAR — Safe to push!" -ForegroundColor Green -Bold
    Write-Host ""
    Write-Host "  Aman untuk menjalankan:" -ForegroundColor Green
    Write-Host "    git add ." -ForegroundColor Cyan
    Write-Host '    git commit -m "your message"' -ForegroundColor Cyan
    Write-Host "    git push" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "══════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Read-Host "Press Enter to exit"
