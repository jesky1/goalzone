#!/bin/bash
# ============================================================
# GOALZONE — Pre-push Security Check
# ============================================================
# Mencegah file sensitif dari ter-push ke remote
# ============================================================

RED='\033[0;31m'
NC='\033[0m' # No Color

# 1. Cek apakah ada .env files yang akan di-push
STAGED_ENV=$(git diff --cached --name-only --diff-filter=ACM | grep -E '\.env$|\.env\.local$|\.env\.production' || true)
if [ -n "$STAGED_ENV" ]; then
    echo -e "${RED}🚫 SECURITY BLOCK: .env files detected in staged files:${NC}"
    echo "$STAGED_ENV"
    echo -e "${RED}File .env TIDAK BOLEH di-push! Gunakan .env.local.example sebagai template.${NC}"
    exit 1
fi

# 2. Scan staged content untuk patterns sensitif
SECRETS_FOUND=0

# Check for JWT secrets
if git diff --cached | grep -iE '^\+.*JWT_SECRET\s*[:=]\s*["\x27][^"\x27]{10,}' | grep -v 'process\.env' | grep -v 'your-' | grep -v 'example' > /dev/null 2>&1; then
    echo -e "${RED}🚨 WARNING: Possible hardcoded JWT_SECRET detected in staged changes${NC}"
    SECRETS_FOUND=1
fi

# Check for passwords
if git diff --cached | grep -iE '^\+.*password\s*[:=]\s*["\x27][^"\x27]{4,}' | grep -v 'process\.env' | grep -v 'your-' | grep -v 'example' | grep -v 'placeholder' | grep -v '\.env\.local\.example' > /dev/null 2>&1; then
    echo -e "${RED}🚨 WARNING: Possible hardcoded password detected in staged changes${NC}"
    SECRETS_FOUND=1
fi

# Check for API keys
if git diff --cached | grep -iE '^\+.*(api[_-]?key|apikey|api[_-]?football)\s*[:=]\s*["\x27][a-zA-Z0-9]{20,}' | grep -v 'process\.env' | grep -v 'your-' | grep -v 'example' > /dev/null 2>&1; then
    echo -e "${RED}🚨 WARNING: Possible hardcoded API key detected in staged changes${NC}"
    SECRETS_FOUND=1
fi

# Check for Supabase service role keys
if git diff --cached | grep -iE '^\+.*eyJ[a-zA-Z0-9_-]{50,}' > /dev/null 2>&1; then
    echo -e "${RED}🚨 WARNING: Possible JWT token / Supabase key detected in staged changes${NC}"
    SECRETS_FOUND=1
fi

if [ $SECRETS_FOUND -eq 1 ]; then
    echo -e "${RED}${NC}"
    echo -e "${RED}Push BLOCKED. Review changes above and move secrets to .env.local${NC}"
    echo -e "${RED}If this is a false positive, use: git push --no-verify${NC}"
    exit 1
fi

echo "✅ Pre-push security check passed"
exit 0
