# PayBiz — Project Brief and Development Roadmap

**Project:** PayBiz
**Purpose:** Build a professional, secure, Kenya-oriented payment and wallet platform, starting with a deployable MVP and expanding through incremental releases.

**Document status:** Living document. Update this file whenever significant implementation decisions, product requirements, or architecture change.

---

## 1. What Is PayBiz?

PayBiz is a payment-platform foundation designed to provide wallet-style account management, transaction records, and eventually payment services for individuals, businesses, and authorized agents.

The long-term goal is to make PayBiz reusable across the developer's future software products. One planned integration is **BizMall**, a multi-vendor marketplace where businesses can sell products and services and use PayBiz for eligible payments.

PayBiz must be developed incrementally. We want to build, test, and deploy a reliable MVP first, then improve it without repeatedly rebuilding the entire application.

### Core principles

- Build a functional application, not just a dashboard design.
- Use free or open-source tools where practical.
- Keep the source code under the project owner's control.
- Separate frontend presentation, backend business logic, and data storage.
- Keep the architecture suitable for future API integrations.
- Prioritize security, reliability, usability, and maintainability.
- Use automated tests to prevent regressions.
- Do not pretend a feature is complete when it is only a visual mockup.
- Never represent simulated money or demo transactions as real financial activity.

---

## 2. Product Vision

The following describes the intended long-term product. It does not mean every feature has already been implemented.

### 2.1 Individual accounts

Individuals should eventually be able to:

- Register and sign in securely.
- Receive a unique PayBiz account number.
- View their account profile and wallet balance.
- View transaction history and transaction details.
- Deposit funds through an authorized agent or approved provider.
- Transfer funds to eligible PayBiz accounts.
- Withdraw funds through an authorized agent or approved provider.
- Receive transaction confirmations and notifications.
- View applicable fees, transaction references, statuses, and timestamps.
- Access additional savings features if they are designed and approved in a later release.

### 2.2 Business accounts

Businesses should eventually be able to:

- Apply for a PayBiz business account.
- Submit the required registration and verification documents.
- Track their application status.
- Receive administrator approval before accessing restricted business features.
- Manage their business profile.
- View eligible business transactions and reports.
- Generate or manage API credentials after approval.
- Integrate PayBiz into external websites, applications, and marketplaces.
- Use a documented developer interface and test environment.

Business onboarding and API access must be protected by server-side authorization. A submitted application must not automatically become an approved account.

### 2.3 Agents

Authorized agents should eventually be able to:

- Sign in with approved credentials.
- Access only their permitted agent functions.
- Process eligible deposit or withdrawal requests.
- Operate within configured float and transaction limits.
- View their authorized transaction records.
- Receive clear confirmations when operations succeed or fail.

Agents must not be able to set customer balances arbitrarily, approve themselves, or bypass financial controls.

### 2.4 Administrators

Administrators should eventually be able to:

- Review user and business accounts.
- Approve or reject business applications.
- Authorize, suspend, or manage agents.
- Configure transaction fees and limits.
- Review transaction records and exceptions.
- Manage platform funding and relevant ledger records.
- Review security-sensitive actions through audit records.
- Manage approved integrations and API access.

Administrator access must be restricted on the backend. Hiding an administrative page in the frontend is not sufficient authorization.

---

## 3. MVP: What We Build First

The first release must be small enough to complete and test properly.

The MVP should establish the working foundation for future wallet operations without attempting to implement the entire payment ecosystem immediately.

### 3.1 Core foundation

- React and Vite frontend.
- Django backend.
- A persistent database configured for the intended environment.
- Consistent configuration using environment variables where appropriate.
- Reliable communication between the frontend and backend.
- Organized, maintainable source code.
- Clear setup and deployment instructions.
- Automated backend checks and relevant frontend tests.
- Safe error handling and logging.

### 3.2 Authentication and accounts

The MVP should provide a secure account-access flow appropriate to the existing architecture.

Expected capabilities:

- User registration, where supported by the agreed onboarding policy.
- Sign-in and sign-out.
- Secure password handling.
- Account profile information.
- Backend permission checks.
- Protection against accessing another user's private records.
- Clear authentication errors and session-expiration handling.

Never grant administrator privileges through public registration.

### 3.3 Functional dashboard

The dashboard must use real data returned by the backend rather than hardcoded placeholder values.

Expected capabilities:

- Account information for the signed-in user.
- Wallet balance when supported by authoritative backend data.
- Transaction history belonging to that user.
- Clear transaction types, amounts, statuses, references, and dates.
- Loading, empty, success, and error states.
- Responsive navigation and layouts.

If a value cannot yet be retrieved from the backend, show an honest empty, unavailable, or not-yet-implemented state instead of inventing a value.

### 3.4 Transaction functionality

Transaction creation should only be included in the MVP if the underlying logic can be implemented and tested safely.

A demonstration wallet flow must:

- Be clearly labelled as a test or demo operation.
- Validate the amount and account status on the backend.
- Check permissions, limits, and available balance.
- Use safe database transactions and concurrency controls.
- Prevent duplicate processing.
- Generate a unique transaction reference.
- Record transaction status and applicable fees.
- Preserve an auditable transaction history.
- Handle failed operations without incorrectly changing balances.

If this scope cannot be completed safely, deploy the first MVP with authentication, account information, and read-only transaction views, then add controlled demo transactions in the next release.

### 3.5 MVP deployment

The MVP should be deployed to a test or staging environment before being treated as production-ready.

Deployment preparation includes:

- Correct environment variables and secret handling.
- Secure production settings.
- Database migrations.
- Persistent database storage.
- HTTPS and appropriate security configuration.
- Working frontend/backend communication.
- A successful production build.
- Tests for critical behavior.
- Clear documentation of limitations.

A successful deployment does not, by itself, mean PayBiz is ready to handle real money.

---

## 4. What Is Outside the Initial MVP?

Unless the current repository already contains a working implementation that is verified by tests, the following should be treated as later-stage capabilities:

- Real M-Pesa or Daraja money movement.
- Live bank and external payment-provider integrations.
- Production cash-in and cash-out operations.
- Live payment APIs for external businesses.
- Complex locked savings or investment products.
- Native Android and iOS applications.
- Microservices or unnecessarily complex infrastructure.
- AI-based financial features.
- Claims of regulatory approval, licensing, or compliance that have not been independently verified.

We can prepare the architecture for future integration without pretending those integrations already work.

---

## 5. Technology and Architecture

### 5.1 Known technology

The project has been developed using:

- **Frontend:** React and Vite.
- **Backend:** Python and Django.
- **Development environment:** GitHub Codespaces.
- **Version control:** Git and GitHub.
- **Database:** SQLite has been used during development; the production database and configuration must be verified before deployment.

Django 6.0.8 was present in the development environment at the last reported checkpoint.

Do not assume any additional packages, frameworks, endpoints, or deployment services exist until you inspect the repository.

### 5.2 Architectural direction

The intended architecture is:

```text
User's browser
      |
      v
React / Vite frontend
      |
      | HTTP requests and API responses
      v
Django backend
      |
      +-- Authentication and authorization
      |
      +-- Input validation
      |
      +-- Account and wallet services
      |
      +-- Transaction and fee logic
      |
      +-- Audit records
      |
      v
Database
```

The frontend is responsible for the user experience and presentation.

The Django backend is authoritative for:

- Account ownership.
- User permissions.
- Wallet balances.
- Transaction creation and status.
- Fees and limits.
- Business approval.
- Agent authorization.
- API access.

Financial rules must not be implemented only in React components.

### 5.3 Existing implementation checkpoint

Development notes indicate that the repository has included Django apps named `accounts`, `users`, and `wallets`.

The `wallets` app has included files such as:

- `models.py`
- `views.py`
- `utils.py`
- `services.py`
- `signals.py`

Previous development checkpoints also recorded migrations for transaction models, transaction-code configuration, fees, transaction limits, platform ledger entries, and platform funding.

A `PlatformFunding` model and a `fund_platform(amount, reference, created_by, description='')` service function were previously added.

The platform account number constant has been `PBZ00000001`.

At the last reported checkpoint, `python manage.py check` completed without issues.

**Important:** These are historical development notes. Inspect the current files, models, migrations, URLs, services, and tests to confirm what still exists and works. Do not recreate existing functionality blindly.

### 5.4 Existing frontend checkpoint

The frontend has an initial React/Vite dashboard and styling.

The main interface files include:

- `frontend/src/App.jsx`
- `frontend/src/App.css`

The PayBiz logo was reported at:

- `frontend/src/assets/PayBizlogo.png`

Verify the actual file paths and current imports before editing them.

The dashboard may have static or incomplete sections. Confirm which elements are connected to real backend endpoints before treating them as functional.

---

## 6. Account Numbers and Business Rules

### 6.1 Account numbers

The planned account-number format has these requirements:

- Total length of 10–13 characters.
- No more than four letters.
- A consistent documented format.
- Uniqueness enforced by the database.
- Server-side validation.

The platform account number recorded in earlier development is `PBZ00000001`.

Inspect the existing implementation before changing account-number rules, because existing accounts and integrations may depend on them.

### 6.2 Business verification

Business onboarding is intended to involve appropriate documentation, which may include business registration and KRA/tax information depending on the final verification policy.

The system must:

- Restrict private documents to authorized personnel.
- Protect uploaded files from public access.
- Record application status and review decisions.
- Require backend-enforced approval.
- Prevent unauthorized access to another business's records.

Do not collect unnecessary sensitive information.

### 6.3 Fees

The product direction has included applying transaction costs only to transactions above KES 100.

Treat this as a requirement to confirm against the existing code and then implement explicitly.

Define and test:

- Which transaction types incur fees.
- Whether the threshold is inclusive or exclusive.
- How fees are calculated and rounded.
- How fee configuration changes are handled.
- How the applicable fee appears in receipts and transaction records.

Store the fee applied to a completed transaction so a later configuration change does not alter historical receipts.

### 6.4 Transaction limits

Limits should be configurable where appropriate and enforced by the backend.

Potential limits include:

- Minimum and maximum transaction amounts.
- Per-transaction limits.
- Daily or periodic limits.
- Agent float restrictions.
- Business-specific limits.

Do not introduce arbitrary limits without documenting their purpose and expected behavior.

---

## 7. Financial Integrity

Wallet-changing functionality requires special care.

For each relevant operation:

1. Validate the request and amount.
2. Confirm the requesting user's identity and permissions.
3. Verify account ownership and account status.
4. Check available balance and configured limits.
5. Calculate fees using the applicable configuration.
6. Apply the operation atomically.
7. Record transaction details and references.
8. Prevent duplicate requests from being processed twice.
9. Return a clear success or failure response.
10. Preserve an audit trail for sensitive actions.

Use appropriate decimal-based money fields and arithmetic, not binary floating-point numbers.

Use database transactions and appropriate locking or concurrency controls to prevent race conditions and double spending.

Do not casually edit or delete completed financial records. Use explicit reversal or correction records with audit history where required.

For future external payment providers, design for idempotency, callback verification, retries, reconciliation, and uncertain transaction outcomes.

A successful API response must not be fabricated simply because the frontend expects success.

---

## 8. Security and Privacy

Security is a core product requirement.

- Never commit secrets, passwords, provider credentials, or private environment files.
- Use environment variables or a suitable secret manager.
- Never use `DEBUG=True` in production.
- Configure allowed hosts, HTTPS, CSRF, CORS, and secure cookies according to the actual deployment architecture.
- Use secure password hashing and supported authentication mechanisms.
- Validate inputs on the backend.
- Enforce permissions on every private endpoint.
- Prevent users from accessing another user's account, wallet, transaction, documents, or API credentials.
- Apply least privilege to administrators, agents, and business integrations.
- Avoid logging passwords, tokens, or unnecessary sensitive personal information.
- Protect sensitive business documents.
- Add rate limiting and abuse prevention where appropriate before public exposure.
- Back up important production data and understand the restoration process.
- Keep dependencies maintained and test upgrades.
- Do not claim legal compliance or regulatory approval without verification.

Before enabling real-money functionality, verify the necessary provider arrangements, operational controls, and applicable legal and compliance requirements.

---

## 9. UI/UX and Branding

PayBiz should look and feel like a professional, trustworthy Kenyan fintech product.

The current brand direction uses dark green or emerald with a gold accent.

The interface should have:

- Consistent typography and spacing.
- A clear visual hierarchy.
- Responsive desktop and mobile layouts.
- Accessible forms, labels, focus states, and contrast.
- Clear transaction and account information.
- Helpful validation messages.
- Loading and empty states.
- Clear success and failure feedback.
- Confirmation for consequential actions.
- No fake balances or fabricated transaction history.
- No nonfunctional buttons presented as completed features.

Copilot may redesign weak sections when doing so improves usability, consistency, and product quality.

Preserve the established brand unless a redesign offers a clear improvement.

---

## 10. Development and Release Roadmap

### Phase 0 — Audit and stabilize

- Inspect Git status and the current branch.
- Inspect the frontend and backend.
- Review models, migrations, URLs, services, dependencies, and tests.
- Identify incomplete and static features.
- Run backend checks and frontend validation.
- Fix clear defects and stabilize the development environment.

**Goal:** Know what works and establish a reliable baseline.

### Phase 1 — Functional MVP foundation

- Connect the frontend to the actual backend.
- Establish secure authentication and authorization.
- Display genuine account information.
- Display genuine transaction history.
- Implement consistent loading, empty, and error states.
- Test access control and data isolation.
- Prepare deployment configuration.

**Goal:** Deliver a useful application with real, persisted data.

### Phase 2 — Controlled demo wallet operations

- Verify the ledger and transaction models.
- Implement tested backend transaction services.
- Add appropriate fee and limit handling.
- Prevent duplicate operations and inconsistent balances.
- Add transaction references and receipts.
- Test insufficient funds, invalid amounts, unauthorized requests, and failures.

**Goal:** Establish reliable internal wallet behavior without claiming to move real money.

### Phase 3 — Business onboarding and API groundwork

- Implement business applications and approval workflows.
- Protect business documents.
- Add business profiles and integration settings.
- Introduce scoped, revocable API credentials when the security model is ready.
- Document API endpoints.
- Provide a safe integration sandbox.

**Goal:** Prepare PayBiz for approved business integrations.

### Phase 4 — External provider integration

- Select and verify the intended provider's official integration requirements.
- Use provider sandbox environments first.
- Isolate provider-specific code behind appropriate services or adapters.
- Implement callback verification, idempotency, reconciliation, and failure handling.
- Complete the required security, operational, legal, and compliance reviews.

**Goal:** Establish verified external payment flows before any real-money launch.

### Phase 5 — Expansion

Potential future capabilities include:

- Agent operations and float reconciliation.
- More transaction types and reporting.
- Developer portal and API management.
- Integration with BizMall.
- Additional business services based on user needs.

Prioritize features according to value, risk, cost, and readiness.

---

## 11. Testing and Definition of Done

A feature is not complete merely because its interface looks correct.

Before declaring it complete:

- Verify the intended behavior.
- Implement server-side validation and authorization.
- Add tests for normal behavior and important failure cases.
- Verify database migrations.
- Run relevant backend checks and tests.
- Run frontend linting, tests, or production build where configured.
- Check that the UI works in the browser.
- Verify loading, empty, success, and failure states.
- Check for security and data exposure issues.
- Confirm that no secrets or private data were committed.
- Update documentation where necessary.
- Report any remaining limitations honestly.

Never claim that a test passed unless it was actually run and its result was observed.

---

## 12. How GitHub Copilot Should Work

Copilot is authorized to take initiative as a senior engineering partner.

It may independently:

- Fix bugs and runtime errors.
- Improve the UI and responsive design.
- Refactor fragile or duplicated code.
- Add sensible features aligned with PayBiz.
- Improve API integration.
- Improve validation, error handling, and permissions.
- Add automated tests and documentation.
- Correct architectural problems when justified.
- Add necessary dependencies after evaluating the benefits and risks.
- Create and verify migrations when database changes are needed.
- Improve deployment preparation.
- Fix related defects discovered during development.

Copilot should not stop at identifying problems or proposing a plan. After inspecting the code, it should implement safe, high-value improvements, run the relevant checks, and report what was actually completed.

### Required working rules

1. Inspect existing code and Git status before making changes.
2. Preserve unrelated user modifications and working functionality.
3. Prefer small, coherent, verifiable changes.
4. Do not invent endpoints, model fields, or dependencies.
5. Keep business rules and permissions on the backend.
6. Explain substantial changes in beginner-friendly language.
7. Run relevant checks and report results honestly.
8. Do not delete databases, migrations, important files, or Git history without prior approval.
9. Ask before irreversible changes, paid services, or changes that could enable real-money processing.
10. Do not expose secrets or sensitive data.
11. Do not deploy potentially breaking or security-sensitive changes automatically without appropriate review.
12. Update this document when major decisions change.

### Preferred workflow

For each meaningful task:

1. Inspect the relevant code.
2. Identify the problem and the smallest sensible solution.
3. Implement the change.
4. Run the relevant checks and tests.
5. Fix problems caused by the change.
6. Explain what changed and what remains incomplete.
7. Identify the next highest-priority improvement.

Ask questions only when a missing decision materially affects product behavior, security, cost, data integrity, or an irreversible choice.

---

## 13. First Task for Copilot

Inspect the actual repository before deciding what to build next.

Determine:

- Which features are implemented and verified.
- Which features are static, incomplete, or broken.
- Which models, services, endpoints, and tests already exist.
- Whether the frontend uses real backend data.
- Whether authentication and authorization are correctly enforced.
- Which defects or security issues need immediate attention.
- What is needed to deploy the MVP safely.

Then proceed to fix clear, low-risk defects and implement the highest-priority improvements without unnecessarily rewriting working code.

Do not assume historical checkpoint notes describe the current code perfectly.

**Final objective: Build PayBiz into a reliable, professional, deployable MVP, then continue improving it through tested, incremental releases.**