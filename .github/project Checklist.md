1. Codebase and stability
- [ ] Existing code and dependencies audited; Git changes preserved.
- [ ] Django system checks pass.
- [ ] Frontend production build succeeds.
- [ ] Database migrations apply to a clean database and the configured deployment database.
- [ ] No unresolved critical errors in browser or backend logs.

2. Authentication and accounts
- [ ] A user can sign in and sign out securely.
- [ ] Unauthenticated users cannot access private dashboard or wallet endpoints.
- [ ] Passwords use Django's secure password hashing.
- [ ] Public registration cannot grant administrator privileges.
- [ ] A user can view their own profile and account details.

3. Wallet and transaction data
- [ ] Dashboard data comes from the backend, not hardcoded financial placeholders.
- [ ] Wallet balance is calculated or retrieved from authoritative backend data.
- [ ] Transaction history displays the user's own persisted records.
- [ ] Transaction references, amounts, types, statuses and timestamps are shown when available.
- [ ] Empty, loading and error states work correctly.
- [ ] Changing an account or transaction ID cannot expose another user's data.

4. Financial safety
- [ ] No UI claims demo money is real money.
- [ ] Any enabled demo transaction validates inputs and permissions on the backend.
- [ ] Wallet-changing operations are atomic and prevent duplicate processing.
- [ ] Insufficient balance and invalid amounts are rejected without corrupting balances.
- [ ] Fees and limits are calculated and enforced on the backend if applicable.
- [ ] Financial records and administrative actions are traceable.

5. UI and usability
- [ ] PayBiz branding and logo display correctly.
- [ ] Main navigation and every enabled action work.
- [ ] Layout is usable on desktop and mobile-sized screens.
- [ ] Forms have validation and understandable error messages.
- [ ] Success, failure, loading and empty states are clear.
- [ ] No dead buttons, fake activity, or misleading success messages remain.

6. Security and configuration
- [ ] No secrets or real customer data are committed.
- [ ] Production DEBUG is disabled.
- [ ] Production hosts, HTTPS, CSRF and CORS settings are correctly configured where applicable.
- [ ] Private endpoints enforce authentication and object-level authorization.
- [ ] Sensitive documents and credentials are not publicly exposed.
- [ ] Errors do not leak secrets or sensitive information.

7. Deployment and handover
- [ ] A fresh environment can be configured using documented instructions.
- [ ] Required environment variables and database setup are documented.
- [ ] The deployed frontend and backend communicate successfully over HTTPS.
- [ ] Data persists after application restart or redeployment.
- [ ] A basic end-to-end smoke test passes on the deployed instance.
- [ ] Known limitations and demo-only features are documented.