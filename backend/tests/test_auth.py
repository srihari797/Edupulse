import unittest
from fastapi.testclient import TestClient
from app.main import app

class TestAuthRouter(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_login_student_success(self):
        """Test successful login for a student."""
        payload = {
            "username": "rahul.b@edupulse.edu",
            "password": "password"
        }
        response = self.client.post("/api/v1/auth/login", json=payload)
        self.assertEqual(response.status_code, 200)
        json_data = response.json()
        self.assertTrue(json_data["success"])
        self.assertIn("access_token", json_data["data"])
        self.assertEqual(json_data["data"]["user"]["email"], payload["username"])
        self.assertEqual(json_data["data"]["user"]["id"], 1)

    def test_login_parent_success(self):
        """Test successful login for a parent."""
        payload = {
            "username": "sarah.b@parent.edupulse.edu",
            "password": "password"
        }
        response = self.client.post("/api/v1/auth/login", json=payload)
        self.assertEqual(response.status_code, 200)
        json_data = response.json()
        self.assertTrue(json_data["success"])
        self.assertEqual(json_data["data"]["user"]["id"], 2)

    def test_login_failure(self):
        """Test login with incorrect password."""
        payload = {
            "username": "rahul.b@edupulse.edu",
            "password": "wrongpassword"
        }
        response = self.client.post("/api/v1/auth/login", json=payload)
        self.assertEqual(response.status_code, 401)

    def test_logout(self):
        """Test logout returns success."""
        response = self.client.post("/api/v1/auth/logout")
        self.assertEqual(response.status_code, 200)
        json_data = response.json()
        self.assertTrue(json_data["success"])

    def test_get_me_unauthorized(self):
        """Test GET /auth/me returns 401 without token."""
        response = self.client.get("/api/v1/auth/me")
        self.assertEqual(response.status_code, 401)

    def test_get_me_success(self):
        """Test GET /auth/me returns user profile with valid token."""
        # First login to get a token
        login_payload = {
            "username": "rahul.b@edupulse.edu",
            "password": "password"
        }
        login_response = self.client.post("/api/v1/auth/login", json=login_payload)
        token = login_response.json()["data"]["access_token"]
        
        # GET /auth/me
        headers = {"Authorization": f"Bearer {token}"}
        response = self.client.get("/api/v1/auth/me", headers=headers)
        self.assertEqual(response.status_code, 200)
        json_data = response.json()
        self.assertTrue(json_data["success"])
        self.assertEqual(json_data["data"]["id"], 1)

if __name__ == "__main__":
    unittest.main()
