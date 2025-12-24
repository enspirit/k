#!/bin/bash

# Test JavaScript compilation - runs .expected.js files directly

set -e

TEST_DIR="${1:-test/fixtures}"
PRELUDE="src/preludes/prelude.js"
FAILED=0
PASSED=0
SKIPPED=0

# Files that require variables - skip for local testing
SKIP_FILES=("member-access" "variables")

should_skip() {
    local file=$1
    for skip in "${SKIP_FILES[@]}"; do
        if [[ $(basename "$file") == "$skip"* ]]; then
            return 0
        fi
    done
    return 1
}

for file in "$TEST_DIR"/*.expected.js; do
    if should_skip "$file"; then
        echo "  ⊘ $(basename "$file") (skipped - requires variables)"
        ((SKIPPED++)) || true
        continue
    fi

    # Run each line separately to avoid IIFE issues
    # Prepend prelude to provide Duration class
    if while IFS= read -r line; do
        [ -n "$line" ] && { cat "$PRELUDE"; echo "$line"; } | node - || exit 1
    done < "$file" 2>/dev/null; then
        echo "  ✓ $(basename "$file")"
        ((PASSED++)) || true
    else
        echo "  ✗ $(basename "$file")"
        ((FAILED++)) || true
    fi
done

echo "JavaScript: $PASSED passed, $FAILED failed, $SKIPPED skipped"

if [ $FAILED -gt 0 ]; then
    exit 1
fi
