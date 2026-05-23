#!/usr/bin/env bash
#
# install-dark.sh — animated installer for the Dark DeFi Terminal +
# confidential TEE agent stack (@dark-protocol/tee-agents).
#
# Usage:
#   ./scripts/install-dark.sh           # install + build everything
#   ./scripts/install-dark.sh --demo    # ... then run the TEE agent demo
#
set -euo pipefail

# ---------------------------------------------------------------------------
# colors / helpers
# ---------------------------------------------------------------------------
if [[ -t 1 ]]; then
  ESC=$'\033'
  RESET="${ESC}[0m"; BOLD="${ESC}[1m"; DIM="${ESC}[2m"
  GREEN="${ESC}[38;5;47m"; CYAN="${ESC}[38;5;51m"; MAGENTA="${ESC}[38;5;201m"
  YELLOW="${ESC}[38;5;227m"; GRAY="${ESC}[38;5;245m"; RED="${ESC}[38;5;203m"
  TTY=1
else
  RESET=""; BOLD=""; DIM=""; GREEN=""; CYAN=""; MAGENTA=""; YELLOW=""; GRAY=""; RED=""
  TTY=0
fi

# purple→cyan 256-color gradient ramp
GRADIENT=(201 200 199 171 135 99 63 39 45 51)

gradient_line() {
  local line="$1"
  local out="" i ch idx color
  local len=${#line}
  if [[ $TTY -eq 0 ]]; then printf '%s\n' "$line"; return; fi
  for (( i=0; i<len; i++ )); do
    ch="${line:i:1}"
    idx=$(( i * ${#GRADIENT[@]} / (len>0?len:1) ))
    color=${GRADIENT[$(( idx % ${#GRADIENT[@]} ))]}
    out+="${ESC}[38;5;${color}m${ch}"
  done
  printf '%s%s\n' "$out" "$RESET"
}

banner() {
  [[ $TTY -eq 1 ]] && clear || true
  local logo=(
"  ██████╗  █████╗ ██████╗ ██╗  ██╗   ██████╗ ███████╗███████╗██╗"
"  ██╔══██╗██╔══██╗██╔══██╗██║ ██╔╝   ██╔══██╗██╔════╝██╔════╝██║"
"  ██║  ██║███████║██████╔╝█████╔╝    ██║  ██║█████╗  █████╗  ██║"
"  ██║  ██║██╔══██║██╔══██╗██╔═██╗    ██║  ██║██╔══╝  ██╔══╝  ██║"
"  ██████╔╝██║  ██║██║  ██║██║  ██╗   ██████╔╝███████╗██║     ██║"
"  ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝   ╚═════╝ ╚══════╝╚═╝     ╚═╝"
  )
  echo
  for l in "${logo[@]}"; do
    gradient_line "$l"
    [[ $TTY -eq 1 ]] && sleep 0.04 || true
  done
  echo "${GRAY}        privacy-first DeFi · confidential TEE agents · x402 private payments${RESET}"
  echo "${DIM}        Solana Attestation Service · Zcash Sapling · 🦞 OpenClawd${RESET}"
  echo
}

# spinner that wraps a background command; logs to a temp file
run_step() {
  local label="$1"; shift
  local logf; logf="$(mktemp)"
  ( "$@" >"$logf" 2>&1 ) &
  local pid=$!
  local frames='⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏' i=0
  if [[ $TTY -eq 1 ]]; then
    while kill -0 "$pid" 2>/dev/null; do
      local f="${frames:i++%${#frames}:1}"
      printf "\r  ${MAGENTA}%s${RESET} ${GRAY}%s${RESET}" "$f" "$label"
      sleep 0.08
    done
  else
    printf "  - %s\n" "$label"
  fi
  if wait "$pid"; then
    printf "\r  ${GREEN}✓${RESET} %s%*s\n" "$label" 8 ""
    rm -f "$logf"
  else
    printf "\r  ${RED}✗${RESET} %s\n" "$label"
    echo "${RED}--- step failed; last log lines: ---${RESET}"
    tail -n 20 "$logf" || true
    rm -f "$logf"
    exit 1
  fi
}

typeline() {
  local s="$1"
  if [[ $TTY -eq 0 ]]; then printf '%s\n' "$s"; return; fi
  local i
  for (( i=0; i<${#s}; i++ )); do printf '%s' "${s:i:1}"; sleep 0.004; done
  printf '\n'
}

# ---------------------------------------------------------------------------
# preflight
# ---------------------------------------------------------------------------
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

banner

if ! command -v node >/dev/null 2>&1; then
  echo "${RED}Node.js is required (>= 18). Install from https://nodejs.org${RESET}"; exit 1
fi
NODE_MAJOR="$(node -p 'process.versions.node.split(".")[0]')"
if (( NODE_MAJOR < 18 )); then
  echo "${RED}Node.js >= 18 required (found $(node -v)).${RESET}"; exit 1
fi
echo "  ${GREEN}✓${RESET} Node $(node -v) detected"
echo

# ---------------------------------------------------------------------------
# install + build
# ---------------------------------------------------------------------------
run_step "Installing workspace dependencies"            npm install
run_step "Building @dark-protocol/sdk"                  npm run build -w @dark-protocol/sdk
run_step "Building @dark-protocol/tee-agents"           npm run build -w @dark-protocol/tee-agents
run_step "Building dark-x402-terminal"                  npm run build -w dark-x402-terminal

# ---------------------------------------------------------------------------
# secrets scaffold
# ---------------------------------------------------------------------------
if [[ ! -f .secrets/.env ]]; then
  mkdir -p .secrets
  cp .env.example .secrets/.env
  echo "  ${YELLOW}!${RESET} Created ${BOLD}.secrets/.env${RESET} ${GRAY}— add your HELIUS_API_KEY${RESET}"
else
  echo "  ${GREEN}✓${RESET} .secrets/.env already present"
fi

echo
typeline "${GREEN}${BOLD}  Dark DeFi is ready.${RESET}"
echo
echo "  ${BOLD}Next:${RESET}"
echo "    ${CYAN}npm run tee:demo${RESET}        ${GRAY}# confidential agent: attest → pay → infer${RESET}"
echo "    ${CYAN}npx dark-tee spawn${RESET}      ${GRAY}# spawn a TEE agent + derive its SAS addresses${RESET}"
echo "    ${CYAN}npm run terminal${RESET}        ${GRAY}# launch the Dark X402 terminal${RESET}"
echo

if [[ "${1:-}" == "--demo" ]]; then
  echo "${MAGENTA}  launching confidential agent demo…${RESET}"
  sleep 0.4
  npm run tee:demo
fi
