from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_health_check():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"status": "ok", "message": "MarketFlow AI Backend is running"}

def test_campaign_generate_success():
    payload = {
        "prompt": "Test campaign",
        "minAge": 18,
        "maxAge": 45,
        "gender": "Female",
        "freq": "Everyday",
        "category": "Promotions"
    }
    response = client.post("/api/campaign/generate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"

def test_campaign_generate_missing_field():
    payload = {
        "minAge": 18,
        "maxAge": 45,
        "gender": "Female",
        "freq": "Everyday",
        "category": "Promotions"
        # missing prompt
    }
    response = client.post("/api/campaign/generate", json=payload)
    assert response.status_code == 422 # Unprocessable Entity

def test_campaign_generate_invalid_type():
    payload = {
        "prompt": "Test campaign",
        "minAge": "eighteen",
        "maxAge": "forty-five", # Should be int
        "gender": "Female",
        "freq": "Everyday",
        "category": "Promotions"
    }
    response = client.post("/api/campaign/generate", json=payload)
    assert response.status_code == 422

def test_campaign_generate_out_of_bounds_age_too_low():
    payload = {
        "prompt": "Test campaign",
        "minAge": 10, # Below 13
        "maxAge": 45,
        "gender": "Female",
        "freq": "Everyday",
        "category": "Promotions"
    }
    response = client.post("/api/campaign/generate", json=payload)
    assert response.status_code == 422
    assert "greater than or equal to 13" in response.text or "Input should be greater than or equal to 13" in response.text

def test_campaign_generate_out_of_bounds_age_too_high():
    payload = {
        "prompt": "Test campaign",
        "minAge": 18,
        "maxAge": 150, # Above 100
        "gender": "Female",
        "freq": "Everyday",
        "category": "Promotions"
    }
    response = client.post("/api/campaign/generate", json=payload)
    assert response.status_code == 422

def test_campaign_generate_empty_string():
    payload = {
        "prompt": "", # Empty prompt not allowed
        "minAge": 18,
        "maxAge": 45,
        "gender": "Female",
        "freq": "Everyday",
        "category": "Promotions"
    }
    response = client.post("/api/campaign/generate", json=payload)
    assert response.status_code == 422

# DIG-8 Tests: Publish Campaign
def test_campaign_publish_no_account_connected():
    # Attempt to publish with an unknown tenant_id
    payload = {
        "message": "Test message",
        "tenant_id": 9999
    }
    response = client.post("/api/campaign/publish", json=payload)
    assert response.status_code == 400
    assert response.json()["detail"] == "No Meta account connected"

def test_campaign_publish_mock_success(monkeypatch):
    # We need to simulate a connected MetaAccount in the database.
    # Since we use an in-memory or a real DB without mocking get_db here easily,
    # let's mock the get_db dependency directly.
    from db.schema import MetaAccount
    
    class MockQuery:
        def filter_by(self, **kwargs):
            return self
        def order_by(self, *args, **kwargs):
            return self
        def first(self):
            return MetaAccount(tenant_id=1, page_id="pending_page_selection", page_name="Test", access_token="token")

    class MockSession:
        def query(self, *args, **kwargs):
            return MockQuery()
        def add(self, *args, **kwargs):
            pass
        def commit(self, *args, **kwargs):
            pass

    from db.database import get_db
    app.dependency_overrides[get_db] = lambda: MockSession()
    
    payload = {
        "message": "Test message",
        "tenant_id": 1
    }
    response = client.post("/api/campaign/publish", json=payload)
    assert response.status_code == 200
    assert response.json()["status"] == "success"
    assert "Mock published" in response.json()["message"]
    
    app.dependency_overrides.clear()

def test_campaign_publish_live_flow(monkeypatch):
    from db.schema import MetaAccount
    
    class MockQuery:
        def filter_by(self, **kwargs):
            return self
        def order_by(self, *args, **kwargs):
            return self
        def first(self):
            return MetaAccount(tenant_id=1, page_id="123456789", page_name="Real Page", access_token="token123")

    class MockSession:
        def query(self, *args, **kwargs):
            return MockQuery()
        def add(self, *args, **kwargs):
            pass
        def commit(self, *args, **kwargs):
            pass

    from db.database import get_db
    app.dependency_overrides[get_db] = lambda: MockSession()
    
    # Mock publish_to_facebook
    monkeypatch.setattr("main.publish_to_facebook", lambda req: {"id": "fb_post_999"})

    payload = {
        "message": "Test live post",
        "image_url": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
        "tenant_id": 1
    }
    response = client.post("/api/campaign/publish", json=payload)
    assert response.status_code == 200
    res_data = response.json()
    assert res_data["status"] == "success"
    assert res_data["fb_response"]["id"] == "fb_post_999"
    
    app.dependency_overrides.clear()

def test_calendar_events():
    response = client.get("/api/calendar/events")
    assert response.status_code == 200
    events = response.json()
    assert isinstance(events, list)
    assert len(events) > 0
    # Verify we have Makara Sankranti
    sankranti = [e for e in events if e["name"] == "Makara Sankranti"]
    assert len(sankranti) == 1
    assert sankranti[0]["date"] == "2026-01-15"

def test_timezone_inference():
    from main import infer_timezone_from_location
    assert infer_timezone_from_location("Bengaluru, Karnataka, India") == "Asia/Kolkata"
    assert infer_timezone_from_location("New York City, NY") == "America/New_York"
    assert infer_timezone_from_location("London, UK") == "Europe/London"
    assert infer_timezone_from_location("Tokyo, Japan") == "Asia/Tokyo"
    assert infer_timezone_from_location(None) == "Asia/Kolkata"


# ============================================================
# REGRESSION TESTS: Meta/Facebook Integration
# Prevents a repeat of the bug where the /connect endpoint's
# DB save code was accidentally made unreachable dead code
# (a disconnect_platform route was inserted before the commit).
# ============================================================

def test_meta_connect_saves_to_db(monkeypatch):
    """
    REGRESSION: Verify that POST /api/meta/connect actually persists the
    MetaAccount record to the database. If this test fails, it means
    the DB commit in connect_meta_account() became unreachable again.
    """
    from db.schema import MetaAccount

    saved_accounts = []

    class MockQuery:
        def filter_by(self, **kwargs):
            return self
        def order_by(self, *args, **kwargs):
            return self
        def first(self):
            return None  # Simulate no existing account

    class MockSession:
        def query(self, *args, **kwargs):
            return MockQuery()
        def add(self, obj):
            saved_accounts.append(obj)
        def commit(self):
            pass
        def refresh(self, obj):
            pass

    # Skip token exchange by ensuring META_APP_ID is blank
    monkeypatch.delenv("META_APP_ID", raising=False)
    monkeypatch.delenv("META_APP_SECRET", raising=False)

    # Stub out Instagram lookup (not needed here)
    monkeypatch.setattr("api.meta.get_instagram_accounts", lambda page_id, token: {})

    from db.database import get_db
    app.dependency_overrides[get_db] = lambda: MockSession()

    payload = {
        "tenant_id": 42,
        "page_id": "123456789",
        "page_name": "DigiM Test Page",
        "access_token": "EAAtest_short_lived_token"
    }
    response = client.post("/api/meta/connect", json=payload)

    app.dependency_overrides.clear()

    assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
    data = response.json()
    assert data.get("status") == "success", f"Expected status=success, got: {data}"
    # This is the critical assertion: a MetaAccount must have been added to the DB
    assert len(saved_accounts) == 1, (
        "REGRESSION DETECTED: /api/meta/connect did not save a MetaAccount to the DB. "
        "The DB commit code may have become dead/unreachable code again."
    )
    assert saved_accounts[0].page_id == "123456789"
    assert saved_accounts[0].page_name == "DigiM Test Page"


def test_meta_status_returns_connected_when_account_exists(monkeypatch):
    """
    REGRESSION: Verify that GET /api/meta/status returns connected=True
    when a MetaAccount row exists for the given tenant_id.
    If this returns connected=False when an account exists, the status
    endpoint has a filtering/query bug.
    """
    from db.schema import MetaAccount

    mock_account = MetaAccount(
        tenant_id=1,
        page_id="111222333",
        page_name="My Business Page",
        access_token="non_expiring_token",
        ig_user_id="ig_999"
    )

    class MockQuery:
        def filter_by(self, **kwargs):
            return self
        def order_by(self, *args, **kwargs):
            return self
        def first(self):
            return mock_account

    class MockSession:
        def query(self, *args, **kwargs):
            return MockQuery()

    from db.database import get_db
    app.dependency_overrides[get_db] = lambda: MockSession()

    response = client.get("/api/meta/status?tenant_id=1")

    app.dependency_overrides.clear()

    assert response.status_code == 200
    data = response.json()
    assert data["connected"] is True, "Status endpoint should return connected=True when account exists in DB"
    assert data["page_name"] == "My Business Page"
    assert data["has_instagram"] is True


def test_meta_status_returns_disconnected_when_no_account(monkeypatch):
    """
    Verify that GET /api/meta/status returns connected=False when no account.
    """
    class MockQuery:
        def filter_by(self, **kwargs):
            return self
        def order_by(self, *args, **kwargs):
            return self
        def first(self):
            return None

    class MockSession:
        def query(self, *args, **kwargs):
            return MockQuery()

    from db.database import get_db
    app.dependency_overrides[get_db] = lambda: MockSession()

    response = client.get("/api/meta/status?tenant_id=9999")

    app.dependency_overrides.clear()

    assert response.status_code == 200
    data = response.json()
    assert data["connected"] is False


def test_meta_disconnect_removes_account(monkeypatch):
    """
    REGRESSION: Verify that POST /api/meta/disconnect actually deletes the record.
    Also ensures disconnect is not accidentally conflated with connect.
    """
    from db.schema import MetaAccount

    deleted = []
    mock_account = MetaAccount(
        tenant_id=1, page_id="111", page_name="Page", access_token="tok"
    )

    class MockQuery:
        def filter_by(self, **kwargs):
            return self
        def order_by(self, *args, **kwargs):
            return self
        def first(self):
            return mock_account

    class MockSession:
        def query(self, *args, **kwargs):
            return MockQuery()
        def delete(self, obj):
            deleted.append(obj)
        def commit(self):
            pass

    from db.database import get_db
    app.dependency_overrides[get_db] = lambda: MockSession()

    response = client.post("/api/meta/disconnect?tenant_id=1&platform=all")

    app.dependency_overrides.clear()

    assert response.status_code == 200
    assert response.json()["status"] == "success"
    assert len(deleted) == 1, "disconnect should have deleted the MetaAccount record"
