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
        "maxAge": 45,
        "gender": "Female",
        "freq": "Everyday",
        "category": "Promotions"
    }
    response = client.post("/api/campaign/generate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert "Female" in data["generated_text"]
    assert "45" in data["generated_text"]
    assert "Everyday" in data["generated_text"]

def test_campaign_generate_missing_field():
    payload = {
        "prompt": "Test campaign",
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
        "maxAge": 10, # Below 13
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
        "maxAge": 45,
        "gender": "Female",
        "freq": "Everyday",
        "category": "Promotions"
    }
    response = client.post("/api/campaign/generate", json=payload)
    assert response.status_code == 422
