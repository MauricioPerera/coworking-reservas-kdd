---
type: 'Task Contract'
title: 'Booking language presentation'
description: 'Spanish, English and Portuguese browser presentation with unchanged booking semantics.'
tags: ['kdd', 'bookings', 'i18n']
task: booking-locales
intent: 'Translate presentation and persist a separate language preference without changing booking data.'
target: example/client.mjs
signature: 'language selection -> translated presentation with unchanged booking state'
test_command: 'node --test tests/locale-ui.test.mjs'
budget:
  cyclomatic_max: 8
  nesting_max: 3
  lines_max: 60
  params_max: 3
tests: tests/locale-ui.test.mjs
tests_sha256: 'c3254038f3d1fbb83db066a85180301543e21ef575cf50869a9be37b552ba258'
touch_only: ['example/client.mjs', 'example/index.html']
deps_allowed: ['example/booking-model.mjs', 'example/booking-storage.mjs']
forbids: ['llm', 'external-network']
---

# Booking language presentation

## Intent
Follow [the architecture](../architecture.md) and specs/CONTRACT-02-idiomas.md.

## Interface
Explicit language selector, translated messages and accessible labels, separate persisted preference.

## Invariants
- Support es-MX, en-US and pt-BR, with Spanish as the default and safe fallback.
- Run seven independent booking flows in each language, without retries or model judgment.
- Switching preserves booking JSON, IDs, room choice, filters, titles and draft fields.
- Calendar dates are displayed in the selected format without a time-zone day shift.
- Preference write failures are surfaced; booking storage failures never announce success.
- Reload and a real browser restart preserve language and bookings within a persistent profile.

## Examples
- 2030-06-12 displays 12/06/2030 in Spanish and Portuguese and 06/12/2030 in English.
- A reservation titled Reunião internacional keeps that exact user text in every language.

## Do / Don't
- DO: persist the locale under a separate key and render user values as text.
- DON'T: translate identifiers or mutate booking JSON when switching languages.

## Tests
The new oracle and contract are committed before the language implementation.
Expected text is declared independently in the oracle. Its output records the
actual Git SHA, input hashes, results, runtime, CI identity and screenshots.
The existing domain, storage, adversarial and seven-case browser oracles remain
unchanged. Complexity budgets are structural metadata, not a measured result.

## Constraints
PARAR y reportar si una traducción requiere alterar reglas de reserva o debilitar el oráculo.
Changes to protected controls need a separately reviewed human-approved baseline.
No historical CI or approval of the original baseline certifies this extension.
