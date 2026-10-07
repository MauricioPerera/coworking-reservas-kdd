---
type: 'Task Contract'
title: 'Room booking rules'
description: 'Reviewed acceptance contract for the coworking booking experiment.'
tags: ['kdd', 'bookings', 'acceptance']
task: booking-domain
intent: 'Verify the declared booking criteria with deterministic evidence.'
target: example/booking-model.mjs
signature: 'emptyState, reserveBooking, cancelBooking, isValidState'
test_command: 'node --test tests/domain.test.mjs'
budget:
  cyclomatic_max: 8
  nesting_max: 3
  lines_max: 60
  params_max: 3
tests: tests/domain.test.mjs
tests_sha256: 'd7ca64358f0d1ef28d9ea0a20934d2008bb7bc05483a4e5ec833ebfff8a502f1'
touch_only: ['example/booking-model.mjs']
deps_allowed: []
forbids: ['network', 'subprocess', 'llm']
---

# Room booking rules

## Intent
Follow [the architecture](../architecture.md) and the exact criteria in specs/CONTRACT-01-reservas.md.

## Interface
emptyState, reserveBooking, cancelBooking, isValidState

## Invariants
- Half-open intervals overlap only for the same room and date when both bookings are confirmed.
- Invalid dates, rooms, titles and reversed/equal time intervals are rejected without mutation.
- Cancellation preserves history, changes only its target and releases availability.
- Identifiers are unique and monotonic; operations do not mutate their inputs.

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
