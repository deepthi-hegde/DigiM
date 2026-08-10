# DigiM Project Rules

## Critical Safety Rules

### 1. Never Edit Multiple Functions in a Single File Block Without Verification
When editing `backend/api/meta.py` or any other multi-function file:
- **Always read the entire function body** before editing it — not just the snippet around the change
- After any multi-function edit, **verify the function boundaries** by reading the file from the start of the edited function to the next `@router` decorator
- Python will NOT error on dead code after a `return` — a DB commit after a misplaced `return` is completely silent and catastrophically wrong

### 2. Run Regression Tests Before Any Commit Touching Meta Integration
Before committing changes to `backend/api/meta.py` or `backend/main.py`, always run:
```bash
cd backend && source venv/bin/activate && pytest test_main.py::test_meta_connect_saves_to_db test_main.py::test_meta_status_returns_connected_when_account_exists test_main.py::test_meta_disconnect_removes_account -v
```
If any of these fail, **do not commit**. Fix the structural issue first.

### 3. The /connect Endpoint Must Always Commit to the DB
The `connect_meta_account()` function in `backend/api/meta.py` MUST end with:
```python
db.commit()
return { "status": "success", ... }
```
There must be **no `return` statement** anywhere before the `db.commit()` inside `connect_meta_account`. Any refactor that moves code after the `db.commit()` will silently break the entire Facebook integration.

### 4. Do Not Restructure Functions Implicitly
When adding a new route (e.g., `/disconnect`) to `backend/api/meta.py`, always:
- Add it as a **completely separate function** below all existing functions
- Never insert new function code between the body and `return`/`db.commit()` of an existing function
- Verify with `grep -n "def \|return\|db.commit" backend/api/meta.py` after every edit

### 5. Read the Full Function Before Editing Any Route Handler
Before editing any route handler function:
```bash
# Find function boundaries first
grep -n "^@\|^def " backend/api/meta.py
```
This shows the exact line ranges of each function. Never assume a function ends where you think it does.

### 6. Test Critical API Endpoints After Backend Changes
After any change to `backend/api/meta.py`, always verify the backend returns correct responses by running the full test suite:
```bash
cd backend && source venv/bin/activate && pytest test_main.py -v
```

### 7. Frontend: Always Pass `tenant_id` to All Backend API Calls
All frontend calls to `/api/meta/*` endpoints must include `?tenant_id=${savedTenantId}` where `savedTenantId = localStorage.getItem('tenant_id') || '1'`. A missing `tenant_id` will query `tenant_id=1` by default, which will return wrong data for logged-in users who have a different tenant ID.

### 8. Deploy Only After Explicit User Approval
Do not run `./deploy.sh` automatically after code fixes. Always:
1. Fix the code locally
2. Commit and push to GitHub
3. Wait for explicit user confirmation before running `./deploy.sh`
