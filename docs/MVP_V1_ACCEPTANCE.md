# PayBiz MVP v1.0 Acceptance Report

**Reviewed:** 2026-10-12
**Specification:** [.github/project Checklist.md](../.github/project%20Checklist.md)
**Release decision:** **Not accepted for release.** The local code and build
checks pass, but critical deployment, security, financial-operation, and
browser/deployment smoke-test criteria remain incomplete or unverified.

I used the checklist as the complete acceptance specification. No criterion is
considered passed merely because the UI looks finished. `PARTIAL` means there
is relevant implementation evidence but an acceptance condition is missing or
not independently verified. `NOT TESTED` means the repository or available
environment provides no evidence sufficient to decide. The checklist does not
identify a separate non-mandatory subset; I treat its listed criteria as
release gates.

## Verification performed

- `.venv/bin/python manage.py check` — passed; no issues reported.
- `.venv/bin/python manage.py test` — passed; **11 tests**, including persisted
  summary data, account-scoped records, authentication, CSRF, search, and CSV
  export. Django's test runner created and migrated a temporary test database.
- `npm --prefix frontend ci` — passed from the lockfile; npm reported zero
  known vulnerabilities in the installed dependency tree.
- `npm --prefix frontend run lint` — passed.
- `npm --prefix frontend run build` — passed with Vite.
- Django 6.0.8 package metadata requires Python `>=3.12`. The local interpreter
  is Python 3.14.2. The previous CI matrix specified Python 3.7–3.9, which
  cannot install the pinned Django dependency. I updated the workflow matrix
  to Python 3.12–3.14 and added frontend lint/build jobs.
- I committed the inspected work locally as `0d0364d`; `.env` and `db.sqlite3`
  are ignored and were not included. GitHub CLI reports no authenticated
  account, and `git push origin main` failed because Git could not obtain
  credentials. The change is committed locally but **not pushed**; the updated
  GitHub Actions workflow has not yet been verified by a remote run.
- The configured local database uses SQLite. No deployment database or
  deployed application was available, and I did not run a deployed smoke test.
- I confirmed `.env` is ignored and is not a tracked Git file. Its contents
  were not read or copied.

## Criterion results

### 1. Codebase and stability

| Acceptance test ID | Status | Evidence | Remaining work |
|---|---|---|---|
| STAB-01 — Audit code/dependencies and preserve Git changes | PARTIAL | I inspected the Django, React, dependency, and workflow configuration. I preserved the pre-existing work and committed it locally as `0d0364d`. `requirements.txt` pins Django 6.0.8, whose installed package metadata requires Python `>=3.12`. | Authenticate GitHub CLI, push the local commit, and verify the updated GitHub Actions run. |
| STAB-02 — Django system checks pass | PASS | `.venv/bin/python manage.py check` — passed with no issues. | None identified for the local check. |
| STAB-03 — Frontend production build succeeds | PASS | `npm --prefix frontend run lint` and `npm --prefix frontend run build` both passed. | Verify the same jobs complete in GitHub Actions. |
| STAB-04 — Migrations apply to a clean and deployment database | PARTIAL | The full Django test suite created a fresh temporary database and applied the installed migrations. `config/settings.py` configures SQLite only. | Configure a supported deployment database and verify migrations against that target without replacing existing data. |
| STAB-05 — No unresolved critical browser/backend log errors | NOT TESTED | No deployed/browser session or production log source was available. | Run and inspect the application in the intended deployment environment and review its browser and server logs. |

### 2. Authentication and accounts

| Acceptance test ID | Status | Evidence | Remaining work |
|---|---|---|---|
| AUTH-01 — Secure sign-in and sign-out | PASS | `wallets/views.py` uses Django `authenticate`, `login`, and `logout`; `test_login_creates_a_session_for_valid_credentials`, `test_login_requires_a_valid_csrf_token`, and `test_sign_out_invalidates_the_session` pass. | Verify the browser sign-in/sign-out flow end to end. |
| AUTH-02 — Unauthenticated users cannot access private dashboard/wallet endpoints | PASS | `test_financial_apis_require_authentication` verifies 401 for dashboard, transaction, CSV export, wallet, and account APIs when signed out. | None identified for the currently exposed private read endpoints. |
| AUTH-03 — Passwords use Django secure password hashing | PASS | Login succeeds only through Django's configured authentication backend in `wallets/views.py`; the sign-in test creates a Django user and authenticates with its password. | Add an explicit stored-hash assertion if the authentication implementation is changed. |
| AUTH-04 — Public registration cannot grant administrator privileges | PASS | `config/urls.py` has no public registration route; account records are created by the existing Django account signal or through privileged administration. | Reassess if self-service registration is introduced. |
| AUTH-05 — Users can view their own profile/account details | PASS | `GET /api/auth/me/` returns the authenticated identity and account type; `test_authenticated_profile_returns_the_current_account` verifies the non-staff profile and `test_account_users_only_see_their_own_financial_records` verifies account scoping. | Verify profile presentation in a browser. |

### 3. Wallet and transaction data

| Acceptance test ID | Status | Evidence | Remaining work |
|---|---|---|---|
| DATA-01 — Dashboard uses backend data, not hard-coded financial placeholders | PASS | `wallets/views.py` aggregates persisted `Transaction` and `Wallet` records; `test_dashboard_uses_persisted_records_for_summary` verifies returned totals. | None identified for current read-only dashboard data. |
| DATA-02 — Wallet balance comes from authoritative backend data | PASS | Dashboard and wallet APIs read `Wallet.balance`; the dashboard test sets and verifies a persisted wallet balance. | Define and test authoritative balance reconciliation once wallet mutation operations are implemented. |
| DATA-03 — Transaction history shows the user's own persisted records | PASS | `_visible_transactions` scopes non-staff users by source/destination account; `test_account_users_only_see_their_own_financial_records` asserts the exact visible transaction codes and wallet/account counts. | None identified for the current list endpoint. |
| DATA-04 — Available references, amounts, types, statuses, and timestamps are displayed | PARTIAL | The API serializes these fields and `TransactionRows` renders them; backend coverage verifies transaction results and CSV records, but no browser assertion checks all displayed fields. | Add frontend/API integration coverage for each rendered field. |
| DATA-05 — Empty, loading, and error states work | PARTIAL | `frontend/src/App.jsx` defines loading, error, and empty states for data-backed pages. No browser tests exercise those states. | Exercise success, empty, loading, server-error, and expired-session states in browser tests. |
| DATA-06 — Changing an account or transaction ID cannot expose another user's data | PASS | Current read endpoints do not provide arbitrary transaction-ID lookup; list, wallet, and account querysets are account-scoped. `test_account_users_only_see_their_own_financial_records` verifies scope. | Add object-ID authorization tests before introducing any detail endpoint. |

### 4. Financial safety

| Acceptance test ID | Status | Evidence | Remaining work |
|---|---|---|---|
| SAFE-01 — UI does not claim demo funds are real money | PASS | Active `frontend/src/App.jsx` uses persisted API data and contains no demo balance/transaction claims; the project overview describes a sandbox with no real money. | Retain clear sandbox labeling if simulated money-moving operations are added. |
| SAFE-02 — Enabled demo transactions validate inputs/permissions on the backend | PASS | There is no public transaction-creation or transfer endpoint and no transaction-creation UI action. No money movement was enabled by this work. | Implement and test server-side validation before enabling any simulated transaction flow. |
| SAFE-03 — Wallet-changing operations are atomic and prevent duplicates | PARTIAL | `wallets/services.py` applies `transaction.atomic`, locks the platform wallet with `select_for_update`, and checks unique funding references. Funding-operation tests are absent. | Add tests for successful funding, duplicate references, rollback, and concurrent duplicate requests before exposing funding actions. |
| SAFE-04 — Insufficient balance/invalid amounts are rejected without corrupting balances | PARTIAL | The only existing funding service rejects non-positive amounts; no user transfer/withdrawal endpoint or insufficient-funds flow is enabled or tested. | Add and test those invariants before implementing wallet transfers or withdrawals. |
| SAFE-05 — Fees and limits are enforced on applicable operations | PARTIAL | Fee and limit models/calculation helpers exist, but no send/withdraw operation currently enforces them end to end. | Enforce fee/limit configuration in the backend when transaction operations are implemented, and add boundary tests. |
| SAFE-06 — Financial records and administrative actions are traceable | PARTIAL | `PlatformFunding` and `PlatformLedgerEntry` persist funding records; ledger entries are read-only in Django admin. Broader action audit coverage is absent. | Define, test, and expose the required audit trail for privileged and wallet-changing actions. |

### 5. UI and usability

| Acceptance test ID | Status | Evidence | Remaining work |
|---|---|---|---|
| UI-01 — PayBiz branding/logo display correctly | PARTIAL | Active `frontend/src/App.jsx` renders the PayBiz logo asset in the navigation and sign-in screen. Visual rendering has not been browser-tested. | Verify logo appearance at desktop, tablet, mobile, and high-density display sizes. |
| UI-02 — Navigation and every enabled action work | PARTIAL | Active navigation, search/filter, pagination, CSV export, transaction details, sign-in, and sign-out are wired in `frontend/src/App.jsx`; automated tests cover backend APIs only. | Exercise each user-facing action and keyboard path in browser tests. |
| UI-03 — Layout works on desktop, tablet, and mobile | PARTIAL | `frontend/src/App.css` contains responsive breakpoints and mobile navigation. No viewport/browser layout test was run. | Verify target viewport sizes and fix any observed overflow or touch-target issues. |
| UI-04 — Forms validate and explain errors | PARTIAL | Sign-in form uses required fields; API errors are displayed. Automated coverage tests API errors and CSRF, not interactive field validation. | Add browser checks for missing credentials, invalid credentials, and server/network failure. |
| UI-05 — Success, failure, loading, and empty states are clear | PARTIAL | Data-backed components define these states; no browser test validates visibility or messaging. | Cover each state in frontend integration tests and the deployment smoke test. |
| UI-06 — No dead buttons, fake activity, or misleading success messages | PARTIAL | Active `App.jsx` has no fabricated financial fixtures; the UI only exposes read operations and explicit unconfigured states. Browser-level interaction coverage is absent. | Verify every visible control and retain sample-data exclusion in release checks. |

### 6. Security and configuration

| Acceptance test ID | Status | Evidence | Remaining work |
|---|---|---|---|
| SEC-01 — No secrets or real customer data are committed | PARTIAL | `.env` and `db.sqlite3` are ignored, are not tracked, and were not included in local commit `0d0364d`. The commit is not pushed; no automated secret scan or repository visibility review was available. | Run an approved secret scan and review repository visibility/access before pushing. |
| SEC-02 — Production DEBUG is disabled | PARTIAL | `config/settings.py` defaults `DEBUG` to false, but reads the deployment value from environment and no production deployment was available. | Set and verify `DEBUG=False` in the intended deployment environment and run deployment checks. |
| SEC-03 — Production hosts, HTTPS, CSRF, and CORS are correctly configured | PARTIAL | Local CSRF handling and trusted Vite development origins exist in `config/settings.py`; no production host/HTTPS configuration or deployed origin was verified. The frontend uses same-origin `/api` requests. | Configure and verify exact production hosts, TLS/proxy security, CSRF origin, and any required cross-origin policy. |
| SEC-04 — Private endpoints enforce authentication and object authorization | PASS | API views explicitly reject unauthenticated users and scope non-staff querysets; authentication and cross-account tests pass. | Retest object authorization on any future mutation or detail endpoint. |
| SEC-05 — Sensitive documents and credentials are not publicly exposed | NOT TESTED | `.env` is not tracked, but no production repository visibility/deployment access review was performed. | Review repository/deployment visibility, secret stores, and access controls with the owner. |
| SEC-06 — Errors do not leak secrets or sensitive information | PARTIAL | Auth, validation, and CSRF errors return generic JSON messages. No production error/log review or full exception-path test was performed. | Verify 4xx/5xx behavior and logs with production-safe settings. |

### 7. Deployment and handover

| Acceptance test ID | Status | Evidence | Remaining work |
|---|---|---|---|
| DEPLOY-01 — Fresh environment can be configured from instructions | PARTIAL | `README.md` documents migration, superuser, backend, and frontend commands, but does not create a virtual environment or install Python requirements before using `.venv`. | Complete the clean-machine setup steps and verify them from a fresh environment. |
| DEPLOY-02 — Environment variables and database setup are documented | PARTIAL | `README.md` names `SECRET_KEY`, `DEBUG`, and `ALLOWED_HOSTS` and documents migrations; `config/settings.py` supports SQLite only. | Document a production database and all deployment settings after the target provider is selected. |
| DEPLOY-03 — Deployed frontend/backend communicate over HTTPS | NOT TESTED | No deployed URL or deployment configuration was supplied. | Deploy to the intended environment and verify authenticated API calls over HTTPS. |
| DEPLOY-04 — Data persists after restart/redeployment | NOT TESTED | Local settings use `db.sqlite3`, which is ignored; no persistence/redeployment test was run. | Verify persistent storage against the chosen deployment database. |
| DEPLOY-05 — Deployed end-to-end smoke test passes | NOT TESTED | Local automated API tests and build are not a deployment smoke test. No deployment target was available. | Run the documented smoke test against the live test deployment. |
| DEPLOY-06 — Limitations and demo-only features are documented | PASS | `docs/01-project-overview.md` states the sandbox/no-real-money model; `README.md` identifies unconfigured API-key, webhook, and preference modules. | Keep these disclosures current as features change. |

## Stage completed in this review

I replaced the incompatible legacy Python 3.7–3.9 CI matrix with Django test
jobs on Python 3.12–3.14 and added a Node.js 22 job for frontend install, lint,
and production build. The selected Python versions are compatible with the
installed Django 6.0.8 package's declared `Requires-Python: >=3.12`.

The local Django tests, check, frontend lint, and production build passed after
this change. I committed the work locally as `0d0364d`. The push is blocked
because GitHub CLI is unauthenticated and Git could not obtain credentials;
the CI configuration is therefore still **not remotely verified**. No
real-money behavior, database reset, or deployment action was performed.
