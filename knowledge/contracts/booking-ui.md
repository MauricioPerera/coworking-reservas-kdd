---
type: 'Task Contract'
title: 'Deterministic booking browser acceptance'
description: 'Reviewed acceptance contract for the coworking booking experiment.'
tags: ['kdd', 'bookings', 'acceptance']
task: booking-ui
intent: 'Verify the declared booking criteria with deterministic evidence.'
target: src/oracle.mjs
signature: 'runAcceptance() -> locally_verified evidence'
test_command: 'node --test tests/ui-oracle.test.mjs'
budget:
  cyclomatic_max: 8
  nesting_max: 3
  lines_max: 60
  params_max: 3
tests: tests/ui-oracle.test.mjs
tests_sha256: '811467e9f8205a9a3f41fde7702ae6a01621dd218c76797e4d248aedab4d2b15'
touch_only: ['src/oracle.mjs']
deps_allowed: []
forbids: ['llm']
---

# Deterministic booking browser acceptance

## Intent
Follow [the architecture](../architecture.md) and the exact criteria in specs/CONTRACT-01-reservas.md.

## Interface
runAcceptance() -> locally_verified evidence

## Invariants
- Exactly the seven reviewed independent browser cases pass with no retries, skips or model use.
- Each case starts from a clean logical session; reload and restart preserve data within the persistence case.
- Evidence links current clean Git revision, input hashes, times and actual browser report.

## Examples
- Correct behavior passes the declared command.
- Deliberate defects are rejected by the independently protected assertions.

## Do / Don't
- DO: preserve actual evidence and protect tests and every imported oracle helper.
- DON'T: infer human approval from hashes, local green tests or the upstream baseline.

## Tests
The oracle and stubs are committed before implementation. Mutation checks validate
the observed strength of the domain and persistence oracles. Level 1 validates
metadata and declared commands; no measured complexity result is claimed.

## Constraints
PARAR y reportar si implementation requires changing the sealed oracle.
Bootstrap controls require explicit human review before quality-gate approval.
