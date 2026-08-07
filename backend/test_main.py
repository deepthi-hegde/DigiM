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
        "prompt": "Test campaign",
        "minAge": 18,
        "maxAge": 45,
        "gender": "Female",
        "freq": "Everyday"
        # missing category
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


