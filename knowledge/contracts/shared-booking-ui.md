---
type: 'Task Contract'
title: 'Shared browser booking synchronization'
description: 'Deterministic shared booking acceptance with protected local-mode regressions.'
tags: ['kdd', 'bookings', 'concurrency']
task: shared-booking-ui
intent: 'Verify atomic reservations, durable state and consistent independent browser sessions.'
target: example/client.mjs
signature: 'two isolated sessions -> one authoritative schedule within 5000 ms'
test_command: 'node --test tests/shared-ui.test.mjs'
budget:
  cyclomatic_max: 8
  nesting_max: 3
  lines_max: 60
  params_max: 3
tests: tests/shared-ui.test.mjs
tests_sha256: '8e8a568763ddb6411b31b2ac5b4a787fcf8ee6a8c817198e916e33e3cdb93f7e'
touch_only: ["example/client.mjs","example/index.html","example/shared-client.mjs"]
deps_allowed: ["example/booking-model.mjs","example/booking-storage.mjs"]
forbids: ['llm', 'external-network']
---

# Shared browser booking synchronization

## Intent
Follow [the architecture](../architecture.md) and specs/CONTRACT-03-concurrencia.md.

## Interface
two isolated sessions -> one authoritative schedule within 5000 ms. Successful responses contain revision and a version-1 booking snapshot.

## Invariants
- Two overlapping concurrent requests produce one confirmation and one conflict.
- Adjacent intervals, different rooms and dates preserve every valid accepted write.
- IDs are unique; cancellations retain history and release exactly their interval.
- Shared state survives a real server process restart; write failures never confirm.
- Browser agendas converge without refresh within the declared 5000 ms test bound.
- Local-mode data, user titles, drafts, filters and per-browser locale remain intact.
- Both sessions use Spanish, English and Portuguese, with no production-auth claim.

## Examples
- User A and User B request Atlas 2030-06-12 10:00–11:00 together: one winner.
- Atlas 10:00–11:00 and Atlas 11:00–12:00 both succeed and remain visible.

## Do / Don't
- DO: record actual commit, hashes, trace results, runtime and cleanup status.
- DON'T: weaken historic oracles or infer approval from local passing tests.

## Tests
The 15-case ui oracle and its protected fixture are committed before implementation.
Inputs absent during the initial red run are recorded as null, never certified as
present. A verified candidate must have every input present and unchanged.
The UI conflict cases use a two-request barrier before releasing both browser
requests. API cases use concurrent requests and assert the persisted outcome.
Cleanup and real process-restart traces are preserved; no retries hide test failures.
Complexity budgets are metadata; no measured complexity result is claimed.

## Constraints
PARAR y reportar si implementation needs to weaken an assertion or fabricate evidence.
New controls and implementation paths require human review of the exact baseline.
