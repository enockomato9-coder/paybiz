# paybiz
PayBiz — A secure digital wallet and agent-based payment simulation built with Django for learning, portfolio development, and future BizFlow integration.

## Run the application locally

The dashboard reads account, wallet, and transaction records from Django. It
does not include sample financial records: an empty database displays empty
states until real records are created.

1. Install Python 3.12 or newer and Node.js 22, then create the backend
   environment and install the pinned requirements:

   ```bash
   python3.12 -m venv .venv
   .venv/bin/python -m pip install --upgrade pip
   .venv/bin/python -m pip install -r requirements.txt
   ```

2. Create a local environment file only if one does not already exist, then
   replace its placeholder `SECRET_KEY` with a private development secret.
   Keep `.env` private and never commit it:

   ```bash
   cp -n .env.example .env
   ```

   `DEBUG` and `ALLOWED_HOSTS` in `.env` are local-development settings. Set
   `DEBUG=False` and explicit production hosts in the deployment environment.
   The current Django settings use a local SQLite database at `db.sqlite3`;
   no production database backend is configured.
3. Run database migrations and create an administrator account:

   ```bash
   .venv/bin/python manage.py migrate
   .venv/bin/python manage.py createsuperuser
   .venv/bin/python manage.py runserver 0.0.0.0:8000
   ```

3. In another terminal, install the frontend dependencies and start Vite:

   ```bash
   cd frontend
   npm ci
   npm run dev -- --host 0.0.0.0
   ```

   Vite proxies `/api` and `/admin` requests to Django at
   `http://127.0.0.1:8000`.
4. Sign in to the dashboard with the Django username and password.

## Dashboard API

The session-authenticated dashboard API is served by Django:

- `GET /api/auth/csrf/`, `GET /api/auth/me/`, `POST /api/auth/login/`, and
  `POST /api/auth/logout/` manage the browser session.
- `GET /api/dashboard/` returns transaction totals, wallet balances, daily
  completed volume, transaction-type counts, and recent transactions.
- `GET /api/transactions/` supports `search`, `status`, `type`, `page`, and
  `page_size` query parameters. `GET /api/transactions/export.csv` exports the
  matching records.
- `GET /api/wallets/` and `GET /api/accounts/` expose saved wallet and account
  records.

Staff accounts can view platform-wide records. Other signed-in accounts are
restricted to transactions involving their own account and to their own
wallet/account records. API keys, webhooks, and workspace preferences are not
implemented in the current data model, so their dashboard pages identify them
as unconfigured rather than showing fabricated values.

## Validate changes

```bash
.venv/bin/python manage.py test wallets.tests
cd frontend && npm run lint && npm run build
```

GitHub Actions runs Django checks and tests against Python 3.12, 3.13, and
3.14, plus frontend lint and a production build on Node.js 22. The CI-only
`SECRET_KEY` is supplied by the workflow and must not be reused in a deployed
environment.

See [the MVP v1.0 acceptance report](./docs/MVP_V1_ACCEPTANCE.md) for
criterion-by-criterion evidence and [the MVP follow-up tracker](./docs/MVP_FOLLOW_UP.md)
for release blockers and the next implementation stages.
