import pytest
from fastapi.testclient import TestClient
from main import app
from db.database import get_db
from db.schema import Tenant

client = TestClient(app)

class MockQuery:
    def __init__(self, tenant=None):
        self.tenant = tenant
    def filter_by(self, **kwargs):
        return self
    def order_by(self, *args, **kwargs):
        return self
    def first(self):
        return self.tenant

class MockSession:
    def __init__(self, tenant=None):
        self.tenant = tenant
        self.added = []
        self.committed = False

    def query(self, model, *args, **kwargs):
        if model == Tenant:
            return MockQuery(self.tenant)
        return MockQuery()

    def add(self, instance):
        self.added.append(instance)

    def commit(self):
        self.committed = True

    def refresh(self, instance):
        pass

def test_whatsapp_status_not_connected():
    # Force get_db to return a mock session with no tenant
    app.dependency_overrides[get_db] = lambda: MockSession(tenant=None)
    
    response = client.get("/api/whatsapp/status?tenant_id=1")
    assert response.status_code == 200
    assert response.json()["connected"] is False
    
    app.dependency_overrides.clear()

def test_whatsapp_save_settings():
    mock_session = MockSession(tenant=None)
    app.dependency_overrides[get_db] = lambda: mock_session
    
    payload = {
        "tenant_id": 1,
        "whatsapp_phone_number_id": "12345",
        "whatsapp_access_token": "mock_token"
    }
    response = client.post("/api/whatsapp/settings", json=payload)
    assert response.status_code == 200
    assert response.json()["status"] == "success"
    
    # Verify tenant settings were updated
    assert len(mock_session.added) > 0
    tenant = mock_session.added[0]
    assert tenant.whatsapp_phone_number_id == "12345"
    assert tenant.whatsapp_access_token == "mock_token"
    
    app.dependency_overrides.clear()

def test_whatsapp_status_connected():
    connected_tenant = Tenant(
        id=1,
        whatsapp_phone_number_id="12345",
        whatsapp_access_token="mock_token"
    )
    app.dependency_overrides[get_db] = lambda: MockSession(tenant=connected_tenant)
    
    response = client.get("/api/whatsapp/status?tenant_id=1")
    assert response.status_code == 200
    data = response.json()
    assert data["connected"] is True
    assert data["whatsapp_phone_number_id"] == "12345"
    assert data["has_token"] is True
    
    app.dependency_overrides.clear()

@pytest.mark.asyncio
def test_whatsapp_send_template_incomplete_settings():
    # Mock database with no credentials
    app.dependency_overrides[get_db] = lambda: MockSession(tenant=None)
    
    payload = {
        "tenant_id": 1,
        "recipient_phone": "1234567890",
        "template_name": "hello_world"
    }
    response = client.post("/api/whatsapp/send-template", json=payload)
    assert response.status_code == 400
    assert "WhatsApp settings are incomplete" in response.json()["detail"]
    
    app.dependency_overrides.clear()
