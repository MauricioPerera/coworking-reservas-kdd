# Working on this integration

Read knowledge/index.md and the relevant sealed contract before changing code.
Run npm run validate:kdd and the checks relevant to the proposed change.

The adapter, tests, helpers, configuration, dependency lockfile and workflow are
trusted acceptance controls protected by quality.json. Changes to those controls
require a separately reviewed baseline. A test hash does not grant approval.
KDD_QUALITY_APPROVED_REF must be supplied explicitly by the human reviewer; do
not derive approval from HEAD or create an approval file on the reviewer's behalf.

Only exact implementation paths in the reviewed policy are authorized for
ordinary product implementation. The first delivery is a bootstrap candidate
for review, not a claim that a human-approved quality gate or remote CI passed.
Keep specs open until authenticated CI evidence supports their closure.

Use deterministic assertions for mandatory criteria. AI exploration can propose
tests before review. Preserve actual command results and declare inconclusive
environment failures. Do not put credentials into tests, reports or contracts.
