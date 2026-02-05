#!/usr/bin/env bash
#
# pre-push-checks.sh — Run the same checks as CI and PR Checks workflows locally.
#
# Usage:
#   ./scripts/pre-push-checks.sh              # Run all checks (CI + PR coverage)
#   ./scripts/pre-push-checks.sh --ci         # Run only CI checks (ci.yml)
#   ./scripts/pre-push-checks.sh --pr         # Run only PR checks (pr-checks.yml)
#   ./scripts/pre-push-checks.sh --verbose    # Show full command output
#

set -uo pipefail

# ── Colors ───────────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
RESET='\033[0m'

# ── State ────────────────────────────────────────────────────────────────────
PASSED=0
FAILED=0
WARNED=0
FAILURES=()
LOGDIR=$(mktemp -d)

# ── Helpers ──────────────────────────────────────────────────────────────────
step() {
  printf "\n${BLUE}${BOLD}▶ %s${RESET} " "$1"
}

pass() {
  printf "${GREEN}✓ passed${RESET}\n"
  ((PASSED++))
}

fail() {
  local name="$1"
  local logfile="$2"
  printf "${RED}✗ FAILED${RESET}\n"
  if [[ -s "$logfile" ]]; then
    echo -e "  ${RED}── output ──${RESET}"
    sed 's/^/    /' "$logfile" | tail -20
    echo -e "  ${RED}────────────${RESET}"
  fi
  ((FAILED++))
  FAILURES+=("$name")
}

warn() {
  local name="$1"
  printf "${YELLOW}⚠ warning${RESET}\n"
  echo -e "  ${YELLOW}$name${RESET}"
  ((WARNED++))
}

# Run a command, capture output, return its exit code
run() {
  local logfile="$LOGDIR/$1.log"
  shift
  if $VERBOSE; then
    "$@" 2>&1 | tee "$logfile"
  else
    "$@" > "$logfile" 2>&1
  fi
  return $?
}

cleanup() {
  rm -rf "$LOGDIR"
}
trap cleanup EXIT

# ── Parse args ───────────────────────────────────────────────────────────────
RUN_CI=true
RUN_PR=true
VERBOSE=false

for arg in "$@"; do
  case "$arg" in
    --ci) RUN_PR=false ;;
    --pr) RUN_CI=false ;;
    --verbose) VERBOSE=true ;;
  esac
done

# ── Navigate to repo root ───────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/.."

echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo -e "${BOLD}  CareVault — Local CI / PR Checks${RESET}"
echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"

# ══════════════════════════════════════════════════════════════════════════════
#  CI checks (ci.yml — runs on every push and PR)
# ══════════════════════════════════════════════════════════════════════════════
if $RUN_CI; then
  echo ""
  echo -e "${BOLD}── ci.yml checks ──────────────────────────────────────${RESET}"

  # 1. Security audit (non-blocking in CI)
  step "Security audit (npm audit)"
  if run "audit" npm audit --audit-level=moderate; then
    pass
  else
    warn "Security audit found issues (non-blocking)"
  fi

  # 2. Formatting check (non-blocking in CI)
  step "Formatting check (prettier)"
  if run "format" npm run format:check; then
    pass
  else
    warn "Formatting issues found (run 'npm run format' to fix)"
  fi

  # 3. Lint (blocking)
  step "Lint (eslint)"
  if run "lint" npm run lint; then
    pass
  else
    fail "Lint" "$LOGDIR/lint.log"
  fi

  # 4. Type check (blocking)
  step "Type check (tsc)"
  if run "typecheck" npx tsc --noEmit; then
    pass
  else
    fail "Type check" "$LOGDIR/typecheck.log"
  fi

  # 5. Unit tests (blocking)
  step "Unit tests (jest)"
  if run "test" npm run test; then
    pass
  else
    fail "Unit tests" "$LOGDIR/test.log"
  fi

  # 6. Build (blocking)
  step "Build (next build)"
  if run "build" npm run build; then
    pass
  else
    fail "Build" "$LOGDIR/build.log"
  fi
fi

# ══════════════════════════════════════════════════════════════════════════════
#  PR checks (pr-checks.yml — runs on PRs targeting main)
# ══════════════════════════════════════════════════════════════════════════════
if $RUN_PR; then
  echo ""
  echo -e "${BOLD}── pr-checks.yml checks ───────────────────────────────${RESET}"

  step "Tests with coverage"
  if run "coverage" npm run test:coverage -- --coverageReporters=text --coverageReporters=text-summary; then
    pass
  else
    fail "Tests with coverage" "$LOGDIR/coverage.log"
  fi
fi

# ══════════════════════════════════════════════════════════════════════════════
#  Summary
# ══════════════════════════════════════════════════════════════════════════════
echo ""
echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo -e "${BOLD}  Summary${RESET}"
echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo -e "  ${GREEN}✓ Passed:  ${PASSED}${RESET}"
[[ $WARNED -gt 0 ]] && echo -e "  ${YELLOW}⚠ Warnings: ${WARNED}${RESET}"
echo -e "  ${RED}✗ Failed:  ${FAILED}${RESET}"
echo ""

if [[ $FAILED -gt 0 ]]; then
  echo -e "${RED}${BOLD}  CI will fail. Fix these issues:${RESET}"
  for f in "${FAILURES[@]}"; do
    echo -e "  ${RED}  • $f${RESET}"
  done
  echo ""
  exit 1
else
  echo -e "${GREEN}${BOLD}  All checks passed — safe to push!${RESET}"
  echo ""
  exit 0
fi
