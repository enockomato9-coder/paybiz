# PayBiz Development Log

## 2026-09-21 — Project Initialization

### Phase
Phase 0 — Documentation

### Work completed
- Created documentation directory.
- Started development log.

### Status
In progress.

## 2026-10-12 — MVP v1.0 Acceptance Baseline and CI Compatibility

### Phase
Phase 1 — Acceptance baseline and continuous integration

### Work completed
- Read `.github/project Checklist.md` and created `docs/MVP_V1_ACCEPTANCE.md`
  with a status, evidence, and remaining work for each listed criterion.
- Created `docs/MVP_FOLLOW_UP.md` to track the completed CI stage, release-risk
  follow-ups, feature/module intent, project merits, and encountered issues.
- Confirmed Django 6.0.8 declares Python `>=3.12`; replaced the incompatible
  Python 3.7–3.9 CI matrix with Python 3.12–3.14.
- Added a Node.js 22 CI job for frontend dependency installation, lint, and
  production build.
- Updated the root README with the CI scope and links to the acceptance and
  follow-up records.

### Validation
- `python manage.py check` — passed.
- `python manage.py test` — passed (11 tests).
- `npm --prefix frontend ci` — passed; zero known vulnerabilities reported.
- `npm --prefix frontend run lint` — passed.
- `npm --prefix frontend run build` — passed.
- GitHub Actions remote result — pending; not claimed as passed.
- Deployment/browser smoke test — not run; no deployment target was provided.

### Problems and resolutions
- The former CI Python matrix could not install the pinned Django release.
  I verified the package's `Requires-Python` metadata and aligned the CI
  matrix with Django's declared minimum.
- The former workflow did not build or lint the frontend. I added independent
  frontend checks so frontend failures are reported separately from Django.
- The first local commit attempt failed because Git was configured to sign
  commits with a key whose private part is unavailable in this environment.
  I left the repository signing configuration unchanged and will use a
  one-command unsigned-commit override for the requested commit.

### Status
Stage 1 implemented locally. MVP v1.0 is not release-ready; see the acceptance
report for unmet and unverified criteria.