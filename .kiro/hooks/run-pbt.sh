#!/usr/bin/env bash
# run property-based tests for teletext invariants
set -e
echo "[kiro-hook] running teletext property-based test suite..."
bun test run tests/teletext.pbt.test.ts
