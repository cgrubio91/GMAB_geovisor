from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_create_project():
    payload = {"name": "test_project", "description": "desc prueba"}
    resp = client.post("/api/v1/projects/", json=payload)
    print("STATUS", resp.status_code)
    try:
        print(resp.json())
    except Exception as e:
        print("No JSON response", e)

if __name__ == '__main__':
    test_create_project()
