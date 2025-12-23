#!/bin/bash

# Local acceptance tests - runs .expected.{ruby,js,sql} files directly
# SQL tests require Docker PostgreSQL to be running (docker compose up -d)

set -e

TEST_DIR="test"
FAILED=0
PASSED=0
SKIPPED=0

# PostgreSQL connection settings (for Docker)
PGHOST="${PGHOST:-localhost}"
PGPORT="${PGPORT:-5432}"
PGUSER="${PGUSER:-klang}"
PGPASSWORD="${PGPASSWORD:-klang}"
PGDATABASE="${PGDATABASE:-klang}"
export PGPASSWORD

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

echo "Running local acceptance tests..."
echo ""

# Test Ruby files
echo "Ruby Tests:"
for file in "$TEST_DIR"/*.expected.ruby; do
    if should_skip "$file"; then
        echo "  ⊘ $(basename "$file") (skipped - requires variables)"
        ((SKIPPED++))
        continue
    fi

    if ruby "$file" 2>/dev/null; then
        echo "  ✓ $(basename "$file")"
        ((PASSED++))
    else
        echo "  ✗ $(basename "$file")"
        ((FAILED++))
    fi
done

echo ""

# Test JavaScript files
echo "JavaScript Tests:"
for file in "$TEST_DIR"/*.expected.js; do
    if should_skip "$file"; then
        echo "  ⊘ $(basename "$file") (skipped - requires variables)"
        ((SKIPPED++))
        continue
    fi

    # Run each line separately to avoid IIFE issues
    if while IFS= read -r line; do
        [ -n "$line" ] && echo "$line" | node - || exit 1
    done < "$file" 2>/dev/null; then
        echo "  ✓ $(basename "$file")"
        ((PASSED++))
    else
        echo "  ✗ $(basename "$file")"
        ((FAILED++))
    fi
done

echo ""

# Check if PostgreSQL is available
PG_AVAILABLE=false
if psql -h "$PGHOST" -U "$PGUSER" -d "$PGDATABASE" -c "SELECT 1" >/dev/null 2>&1; then
    PG_AVAILABLE=true
fi

# Test SQL files
echo "SQL Tests:"
if [ "$PG_AVAILABLE" = false ]; then
    echo "  ⚠ PostgreSQL not available - skipping SQL tests"
    echo "    Run 'docker compose up -d' to enable SQL testing"
else
    for file in "$TEST_DIR"/*.expected.sql; do
        if should_skip "$file"; then
            echo "  ⊘ $(basename "$file") (skipped - requires variables)"
            ((SKIPPED++))
            continue
        fi

        # Run each line as a SELECT statement
        file_passed=true
        while IFS= read -r line; do
            if [ -n "$line" ]; then
                if ! echo "SELECT $line;" | psql -h "$PGHOST" -U "$PGUSER" -d "$PGDATABASE" -t >/dev/null 2>&1; then
                    file_passed=false
                    break
                fi
            fi
        done < "$file"

        if [ "$file_passed" = true ]; then
            echo "  ✓ $(basename "$file")"
            ((PASSED++))
        else
            echo "  ✗ $(basename "$file")"
            ((FAILED++))
        fi
    done
fi

echo ""
echo "Results: $PASSED passed, $FAILED failed, $SKIPPED skipped"

if [ $FAILED -gt 0 ]; then
    exit 1
fi
