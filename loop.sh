#!/bin/bash
set -euo pipefail

# Usage:
#   ./loop.sh                         # Build mode, unlimited iterations
#   ./loop.sh 20                      # Build mode, max 20 iterations
#   ./loop.sh plan                    # Plan mode, unlimited iterations
#   ./loop.sh plan 5                  # Plan mode, max 5 iterations
#   ./loop.sh plan-work "description" # Scoped plan for branch

MODE="build"
PROMPT_FILE="PROMPT_build.md"
MAX_ITERATIONS=0
WORK_SCOPE=""

if [ "${1-}" = "plan" ]; then
  MODE="plan"
  PROMPT_FILE="PROMPT_plan.md"
  MAX_ITERATIONS=${2:-0}
elif [ "${1-}" = "plan-work" ]; then
  if [ -z "${2-}" ]; then
    echo "Error: plan-work requires a work description"
    exit 1
  fi
  MODE="plan-work"
  PROMPT_FILE="PROMPT_plan_work.md"
  WORK_SCOPE=$2
  MAX_ITERATIONS=${3:-5}
elif [[ "${1-}" =~ ^[0-9]+$ ]]; then
  MAX_ITERATIONS=$1
fi

if [ ! -f "$PROMPT_FILE" ]; then
  echo "Error: $PROMPT_FILE not found"
  exit 1
fi

ITERATION=0
CURRENT_BRANCH=$(git branch --show-current)
AGENT_CMD=${AGENT_CMD:-"opencode"}
AGENT_ARGS=${AGENT_ARGS:-"run --model opencode/claude-opus-4-5"}

if [ -n "$WORK_SCOPE" ]; then
  export WORK_SCOPE
fi

printf "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
printf "Mode:   %s\n" "$MODE"
printf "Prompt: %s\n" "$PROMPT_FILE"
printf "Branch: %s\n" "$CURRENT_BRANCH"
if [ "$MAX_ITERATIONS" -gt 0 ]; then
  printf "Max:    %s iterations\n" "$MAX_ITERATIONS"
fi
printf "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"

while true; do
  if [ "$MAX_ITERATIONS" -gt 0 ] && [ "$ITERATION" -ge "$MAX_ITERATIONS" ]; then
    echo "Reached max iterations: $MAX_ITERATIONS"
    break
  fi

  PROMPT_CONTENT=$(cat "$PROMPT_FILE")
  $AGENT_CMD $AGENT_ARGS "$PROMPT_CONTENT"

  echo "Skipping git push (manual only)."

  ITERATION=$((ITERATION + 1))
  printf "\n\n======================== LOOP %s ========================\n\n" "$ITERATION"
done
