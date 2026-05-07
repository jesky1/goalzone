#!/bin/bash
# ============================================================
# GOALZONE — Pre-Push Security Check
# ============================================================
# Run this script BEFORE `git push` to ensure
# no sensitive files are accidentally committed.
# Usage: bash pre-push-check.sh
# ============================================================

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color
BOLD='\033[1m'

ERRORS=0
WARNINGS=0
PASSED=0

echo ""
echo "══════════════════════════════════════════════════"
echo -e "${BOLD}${CYAN}  GOALZONE Pre-Push Security Check${NC}"
echo "══════════════════════════════════════════════════"
echo ""

# ─── Check if git repo exists ───
if [ ! -d ".git" ]; then
  echo -e "${YELLOW}⚠️  Git repo belum di-initialize.${NC}"
  echo -e "   Jalankan: ${CYAN}git init${NC} dulu."
  echo ""
  exit 1
fi

# ══════════════════════════════════════════════════
# SECTION 1: Check .gitignore exists
# ══════════════════════════════════════════════════
echo -e "${BOLD}[1/5] Checking .gitignore...${NC}"

if [ ! -f ".gitignore" ]; then
  echo -e "  ${RED}❌ BAHAYA: .gitignore TIDAK DITEMUKAN!${NC}"
  ERRORS=$((ERRORS + 1))
else
  echo -e "  ${GREEN}✅ .gitignore ditemukan${NC}"
  
  # Check critical entries
  CRITICAL=".env
.env.local
.env.production.local
.env.development.local
db/
download/
upload/
*.log"

  for entry in $CRITICAL; do
    if grep -qF "$entry" .gitignore; then
      echo -e "  ${GREEN}  ✓ \"$entry\"${NC}"
      PASSED=$((PASSED + 1))
    else
      echo -e "  ${RED}  ✗ \"$entry\" MISSING dari .gitignore!${NC}"
      ERRORS=$((ERRORS + 1))
    fi
  done
fi

echo ""

# ══════════════════════════════════════════════════
# SECTION 2: Check sensitive files on disk
# ══════════════════════════════════════════════════
echo -e "${BOLD}[2/5] Checking sensitive files on disk...${NC}"

SENSITIVE_FILES=(
  ".env"
  ".env.local"
  ".env.production.local"
  ".env.development.local"
  ".env.test.local"
  "db/custom.db"
)

for file in "${SENSITIVE_FILES[@]}"; do
  if [ -f "$file" ]; then
    result=$(git check-ignore "$file" 2>/dev/null)
    if [ -n "$result" ]; then
      echo -e "  ${GREEN}✅ $file — di-ignore${NC}"
      PASSED=$((PASSED + 1))
    else
      echo -e "  ${RED}❌ BAHAYA: $file ADA tapi TIDAK di-ignore!${NC}"
      ERRORS=$((ERRORS + 1))
    fi
  else
    echo -e "  ${YELLOW}⚠️  $file — tidak ada di disk (ok)${NC}"
  fi
done

echo ""

# ══════════════════════════════════════════════════
# SECTION 3: Check sensitive directories
# ══════════════════════════════════════════════════
echo -e "${BOLD}[3/5] Checking sensitive directories...${NC}"

SENSITIVE_DIRS=(
  "download"
  "upload"
  "db"
  ".claude"
  ".z-ai-config"
  "agent-ctx"
  ".vercel"
  "node_modules"
  ".next"
)

for dir in "${SENSITIVE_DIRS[@]}"; do
  if [ -d "$dir" ]; then
    result=$(git check-ignore "$dir" 2>/dev/null)
    if [ -n "$result" ]; then
      echo -e "  ${GREEN}✅ $dir/ — di-ignore${NC}"
      PASSED=$((PASSED + 1))
    else
      echo -e "  ${RED}❌ BAHAYA: $dir/ ADA tapi TIDAK di-ignore!${NC}"
      ERRORS=$((ERRORS + 1))
    fi
  else
    echo -e "  ${YELLOW}⚠️  $dir/ — tidak ada di disk (ok)${NC}"
  fi
done

echo ""

# ══════════════════════════════════════════════════
# SECTION 4: Scan staged files for secrets
# ══════════════════════════════════════════════════
echo -e "${BOLD}[4/5] Scanning staged files for secrets...${NC}"

# Get ONLY files being ADDED (not deleted) to catch dangerous files
# Filter out deletions — they're safe (we're removing sensitive files)
STAGED_ADDED=$(git diff --cached --name-only --diff-filter=ACMR 2>/dev/null)
UNSTAGED_ADDED=$(git ls-files --others --exclude-standard 2>/dev/null)
ALL_TRACKED="$STAGED_ADDED
$UNSTAGED_ADDED"

if [ -z "$ALL_TRACKED" ]; then
  echo -e "  ${CYAN}ℹ️  Tidak ada staged/untracked files${NC}"
else
  # Check for dangerous files
  DANGEROUS_PATTERNS=(
    ".env"
    ".env.local"
    ".env.production"
    ".env.development"
    "credentials"
    "secret"
    "password"
    "private_key"
    "*.pem"
    "*.key"
    "custom.db"
    ".sql"
  )

  FOUND_DANGER=0
  while IFS= read -r file; do
    [ -z "$file" ] && continue
    filename=$(basename "$file")
    # Skip .example and .template files (safe to push — no real keys)
    case "$filename" in
      *.example|*.template) continue ;;
    esac
    for pattern in "${DANGEROUS_PATTERNS[@]}"; do
      case "$filename" in
        *$pattern*)
          echo -e "  ${RED}🚨 DITEMUKAN: $file (matches \"$pattern\")${NC}"
          ERRORS=$((ERRORS + 1))
          FOUND_DANGER=1
          break
          ;;
      esac
    done
  done <<< "$ALL_TRACKED"

  if [ $FOUND_DANGER -eq 0 ]; then
    FILE_COUNT=$(echo "$ALL_TRACKED" | grep -c . 2>/dev/null || echo "0")
    echo -e "  ${GREEN}✅ $FILE_COUNT files scanned — no secrets detected${NC}"
  fi
fi

echo ""

# ══════════════════════════════════════════════════
# SECTION 5: Check for API keys in code
# ══════════════════════════════════════════════════
echo -e "${BOLD}[5/5] Checking for hardcoded API keys in source...${NC}"

# Only check src/ and mini-services/ directories
SOURCE_FILES=$(git ls-files -- '*.ts' '*.tsx' '*.js' '*.jsx' '*.json' 2>/dev/null | grep -v 'node_modules' | grep -v '.next' | grep -v 'package-lock' | grep -v 'bun.lock')

if [ -z "$SOURCE_FILES" ]; then
  echo -e "  ${CYAN}ℹ️  No source files tracked yet${NC}"
else
  DANGER=0
  
  # Check for real-looking API keys (not placeholder patterns)
  while IFS= read -r file; do
    [ -z "$file" ] && continue
    
    # Skip .env.example files (they should have placeholder values)
    case "$file" in
      *.example) continue ;;
    esac
    
    # Check for Supabase service role keys (long JWT tokens)
    if grep -q 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.[A-Za-z0-9_-]*\.[A-Za-z0-9_-]*' "$file" 2>/dev/null; then
      # Check if it looks like a real key (not example)
      if ! grep -q 'your-' "$file" 2>/dev/null || ! grep -q 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.xxxx' "$file" 2>/dev/null; then
        echo -e "  ${RED}🚨 Possible Supabase key in: $file${NC}"
        ERRORS=$((ERRORS + 1))
        DANGER=1
      fi
    fi
  done <<< "$SOURCE_FILES"
  
  if [ $DANGER -eq 0 ]; then
    echo -e "  ${GREEN}✅ No hardcoded secrets detected in source code${NC}"
    PASSED=$((PASSED + 1))
  fi
fi

echo ""

# ══════════════════════════════════════════════════
# RESULT
# ══════════════════════════════════════════════════
echo "══════════════════════════════════════════════════"

if [ $ERRORS -gt 0 ]; then
  echo -e "${RED}${BOLD}  ❌ FAILED — $ERRORS error(s) found!${NC}"
  echo ""
  echo -e "  ${RED}JANGAN PUSH! Fix masalah di atas dulu.${NC}"
  echo ""
  echo "  Tips:"
  echo "  • git rm --cached <file>    — hapus dari tracking"
  echo "  • echo 'file' >> .gitignore — tambah ke ignore"
  echo "  • git status                — cek ulang"
  echo ""
else
  echo -e "${GREEN}${BOLD}  ✅ ALL CLEAR — Safe to push!${NC}"
  echo ""
  echo -e "  ${GREEN}Aman untuk menjalankan:${NC}"
  echo -e "    ${CYAN}git add .${NC}"
  echo -e "    ${CYAN}git commit -m \"your message\"${NC}"
  echo -e "    ${CYAN}git push${NC}"
  echo ""
fi

echo "══════════════════════════════════════════════════"
echo ""

exit $ERRORS
