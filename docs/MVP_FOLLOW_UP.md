# PayBiz MVP v1.0 Follow-up Tracker

The release specification is [.github/project Checklist.md](../.github/project%20Checklist.md).
I will complete one reviewable stage at a time and update
[the acceptance report](./MVP_V1_ACCEPTANCE.md) with evidence after each stage.
All checklist items remain release gates unless the owner explicitly changes
the specification.

## Stage 1 — Make CI compatible with the pinned stack

**Status:** Implemented locally; remote GitHub Actions run pending.

- Replace the obsolete Python 3.7–3.9 matrix with 3.12–3.14. Django 6.0.8
  declares Python `>=3.12`.
- Run Django checks and tests with an isolated CI-only secret and no production
  credentials.
- Add Node.js 22 CI steps for deterministic `npm ci`, lint, and production
  build.
- Keep the frontend and backend checks separate so failures are attributable.
- Add regression coverage for sign-out invalidation, non-staff profile data,
  unauthenticated CSV export, and exact transaction visibility.
- Local evidence: Django check passed; all 11 Django tests passed; clean-lock
  npm install reported zero vulnerabilities; frontend lint and Vite production
  build passed.
- Remaining: push the reviewed change and inspect the actual remote workflow
  result. A local build does not prove GitHub Actions or deployment readiness.

## Next stages, ordered by release risk

1. **Verify authentication and deployment configuration.** Define the target
   deployment, secret/host/HTTPS/CSRF configuration, database, and a safe
   smoke-test path. Backend regression tests now cover sign-out, non-staff
   profile data, and unauthenticated CSV export. Do not apply migrations to or
   overwrite production data without explicit confirmation.
2. **Harden financial invariants before enabling operations.** Add focused
   tests for platform funding atomicity, duplicate references, rollback, and
   immutable ledger records. Implement transfer/withdrawal flows only as
   explicitly labeled sandbox operations with server-side permissions,
   idempotency, balance/fee/limit checks, and concurrency protection. Do not
   connect a real payment provider or move real money without independent
   approval.
3. **Test account and transaction UI behavior.** Add browser-level tests for
   authentication, account scoping, transaction detail, filters/export, empty
   and error states, reduced motion, keyboard navigation, and desktop/tablet/
   mobile layouts.
4. **Prepare and verify a deployment.** Complete clean-environment setup
   documentation, configure persistent database/storage, deploy to the
   selected test environment, inspect browser/server logs, and run an
   authenticated end-to-end smoke test over HTTPS.

## What is in the current dashboard slice and why

- **Django session/auth API:** uses the existing Django user/password/session
  system instead of inventing a parallel frontend identity store. This gives
  the browser an established password-hashing and CSRF boundary.
- **Scoped financial read APIs:** summary, transactions, wallets, accounts,
  and CSV export read persisted models and restrict non-staff users to their
  own account records. This avoids fabricated dashboard metrics and prevents
  the UI from being its own data authority.
- **Responsive React dashboard:** overview, transaction search/filter/paging,
  details, account directories, wallet display, and reports are wired to
  backend results. Honest loading/error/empty states make missing data
  distinguishable from zero data.
- **Explicitly unconfigured modules:** API credentials, webhooks, and
  preferences have no supporting backend model yet. The interface explains
  that gap rather than displaying pretend credentials or settings.
- **Kenyan-inspired theme:** forest green, savanna gold, and terracotta support
  PayBiz identity while preserving contrast and reduced-motion preferences.
- **Automated release gates:** the CI workflow now targets supported Python
  versions and checks the React frontend as well as Django.

## Risks and boundaries

- There is no deployment target or deployment database configured in the
  inspected repository. Production acceptance therefore remains open.
- There is no public transaction-create, transfer, or withdrawal API. This is
  intentional; the current work does not enable financial movement.
- The existing platform funding service is a server-side financial operation
  and still needs dedicated atomicity/idempotency tests before it is exposed.
- Browser-level visual/accessibility coverage is absent; responsive CSS and
  component code are not proof of a successful real-device smoke test.
- The local `.env` was not read or added to Git. Its tracked status was
  verified as ignored.

## Issues found and resolution

| Issue | Evidence | Resolution | Remaining verification |
|---|---|---|---|
| GitHub Actions requested Python versions too old for pinned Django | Workflow matrix named Python 3.7, 3.8, and 3.9; installed Django 6.0.8 metadata says `>=3.12`. | Updated CI to Python 3.12–3.14 and added a separate Node 22 frontend job. | Remote Actions run must complete successfully. |
| CI frontend quality/build checks were absent | Previous workflow ran only `python manage.py test`. | Added `npm ci`, `npm run lint`, and `npm run build`. | Remote Actions run must complete successfully. |
| Release status could not be tracked criterion by criterion | No evidence-linked checklist report existed. | Added `docs/MVP_V1_ACCEPTANCE.md` with status, evidence, and remaining work for every checklist item. | Keep statuses synchronized with actual test/deployment evidence. |
| Local commit signing could not find the configured private key | `git commit` reported that the configured `GitHub <noreply@github.com>` signing key has no local secret key. | I will use a one-command `commit.gpgsign=false` override for this requested local commit rather than changing repository-wide signing settings or creating a key. | Configure an approved signing key separately if signed commits are required by repository policy. |
