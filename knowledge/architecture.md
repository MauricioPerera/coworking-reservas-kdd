---
type: 'Architecture'
title: 'Coworking bookings with KDD acceptance'
description: 'Pure booking rules, local persistence and deterministic browser evidence.'
tags: ['kdd', 'bookings', 'acceptance']
---

# Architecture

The production model defines half-open intervals for two rooms. The browser client
renders text safely and persists validated state in localStorage. This is a local
single-browser application; it does not claim multi-user concurrency protection.

The inherited protected Node oracle runs the pinned e2e CLI with fresh output and
validates schema, exact selection, clean commit, timing, attempts, cleanup and zero
model use. The seven cases are independent and use fixed calendar data. Board
recognizes one outer Node test; evidence preserves seven inner browser cases.

The policy protects all acceptance controls and authorizes five exact production
paths. A human supplies the approved reference independently. Local evidence is
locally_verified; only successful authenticated CI can support closure.
No upstream approval or historical CI report certifies this new project.

## Language presentation

The browser supports Spanish (es-MX), English (en-US) and Brazilian Portuguese
(pt-BR). Spanish is the default. An explicit selector persists a separate locale
preference; booking identifiers, room IDs, ISO calendar dates, 24-hour times and
the version-1 booking storage schema remain language independent. The presentation
formats dates with an explicit UTC calendar boundary and translates visible text,
statuses and accessible labels while preserving entered titles and draft inputs.

The original seven-case browser oracle is retained. A separately sealed Node
browser oracle runs the seven booking flows in each language plus thirteen
checks for translation completeness, switching, failures, responsive layout and
time zones. Its reports and screenshots are kept in .e2e/locale-runs. Adding the
oracle, its contract and policy entries requires a new explicit human-reviewed
baseline before the quality gate can certify this revision. Historical closure
reports retain their original SHA and CI run.
