---
type: 'Task Contract'
title: 'Validate deterministic browser evidence'
description: 'Executable contract for the KDD e2e acceptance integration.'
tags: ['kdd', 'e2e', 'acceptance']
task: report-validation
intent: 'Verify the declared acceptance behavior.'
target: src/report-validator.mjs
signature: 'validateReport(report, expected) -> run evidence'
test_command: 'node --test tests/report.functional.test.mjs tests/report.adversarial.test.mjs'
budget:
  cyclomatic_max: 8
  nesting_max: 3
tests: tests/report.functional.test.mjs
tests_sha256: 'cc4ab8a8b207c358381cbe7ab5d344dec7ed7f0c045b1a9fb2ccc35537de6358'
touch_only: ['src/report-validator.mjs']
deps_allowed: []
forbids: ['network', 'subprocess', 'llm']
---

# Validate deterministic browser evidence

## Intent
Follow the [integration architecture](../architecture.md) and its trust boundary.

## Interface
validateReport(report, expected) -> run evidence

## Invariants
- Observed results must satisfy the reviewed acceptance criteria.
- Tests and their imported helpers must remain protected by the quality policy.
- Unselected results must be filtered skips without attempts or serial execution.
- Every step must be deterministic: model events and nonzero event token counts
  are rejected even when run-level usage reports zero.

## Examples
- Correct behavior passes the declared command.
- A changed outcome is rejected by its relevant assertion.

## Do / Don't
- DO: use deterministic assertions and retain actual evidence.
- DON'T: infer approval from a test hash or a green local process.

## Tests
The declared oracle was written before implementation. Complementary adversarial
checks and dependency protection are part of the project quality policy.
The hardening regressions are proposed for a separately reviewed baseline; their
local results and test hashes do not grant approval.

## Constraints
PARAR y reportar si implementation requires changing the protected oracle.
This initial profile uses structural budgets; no complexity measurement is claimed.
