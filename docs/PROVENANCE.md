# Provenance

Acceptance integration reused from https://github.com/MauricioPerera/kdd-e2e-acceptance
at commit 57852337604118c448fa9e07c93fbe8f15132d11 (Apache-2.0).
The schema, report validator, process boundary, approval checks, pinned KDD runtime
and quality workflow retain their upstream design. Booking criteria and oracles
are new and require a new independently reviewed baseline.

tests/fixtures/passed.report.json is schema-test data adapted to the new case IDs,
not an actual booking browser run. Actual evidence is collected under .e2e/runs.
No upstream closure report is imported. LICENSE and NOTICE retain attribution.
