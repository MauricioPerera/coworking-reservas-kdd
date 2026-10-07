---
type: 'Task Contract'
title: 'Local booking persistence'
description: 'Reviewed acceptance contract for the coworking booking experiment.'
tags: ['kdd', 'bookings', 'acceptance']
task: booking-storage
intent: 'Verify the declared booking criteria with deterministic evidence.'
target: example/booking-storage.mjs
signature: 'loadState(storage), saveState(storage, state)'
test_command: 'node --test tests/storage.test.mjs'
budget:
  cyclomatic_max: 8
  nesting_max: 3
  lines_max: 60
  params_max: 3
tests: tests/storage.test.mjs
tests_sha256: 'bb737ffb6b6e530008a949d8699262a9bb1c166f0a4c5fed28b226f6b1ba1ae2'
touch_only: ['example/booking-storage.mjs']
deps_allowed: ['example/booking-model.mjs']
forbids: ['network', 'subprocess', 'llm']
---

# Local booking persistence

## Intent
Follow [the architecture](../architecture.md) and the exact criteria in specs/CONTRACT-01-reservas.md.

## Interface
loadState(storage), saveState(storage, state)

## Invariants
- A roundtrip preserves confirmed and cancelled bookings, identifiers and nextId.
- Corrupt or unavailable storage is surfaced; existing corrupt bytes are not silently replaced.
- Invalid snapshots, duplicate identifiers and active overlaps are rejected.

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
