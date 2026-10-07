# Changelog

## Extensión de idiomas — candidata para revisión

- Spanish (es-MX), English (en-US) and Brazilian Portuguese (pt-BR) presentation.
- Separate persisted language preference, translated accessible labels and statuses,
  locale date display and preserved booking data, draft fields and filters.
- Sealed 34-case language oracle committed before implementation: seven booking
  flows in each language and thirteen additional checks.
- Measured validation cost and an isolated incorrect-translation mutation in
  docs/I18N-IMPACT.md. New baseline and cross-platform CI pending human review.

## 0.1.0 — Bootstrap candidate

- Independent local coworking booking experiment derived from kdd-e2e-acceptance.
- Test-first booking, storage and seven-case browser contracts.
- New controls pending independent review; no inherited approval or CI closure.
