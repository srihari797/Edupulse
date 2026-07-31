import unittest
from fastapi.testclient import TestClient
from app.main import app
from app.core.security import create_access_token

class TestGrowthRouter(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)
        # Generate valid Student token (user_id = 1 is Student in MOCK_USERS)
        self.token = create_access_token(subject=1)
        self.headers = {"Authorization": f"Bearer {self.token}"}

    def test_get_growth_passport(self):
        """Test GET student growth-passport endpoint."""
        response = self.client.get("/api/v1/students/growth-passport", headers=self.headers)
        self.assertEqual(response.status_code, 200)
        json_data = response.json()
        self.assertTrue(json_data["success"])
        self.assertIn("holistic_score", json_data["data"])
        self.assertEqual(json_data["data"]["growth_level"], "Advanced")
        self.assertGreater(len(json_data["data"]["achievements"]), 0)

    def test_get_recognition(self):
        """Test GET student recognition endpoint."""
        response = self.client.get("/api/v1/students/recognition", headers=self.headers)
        self.assertEqual(response.status_code, 200)
        json_data = response.json()
        self.assertTrue(json_data["success"])
        self.assertIn("badges", json_data["data"])
        self.assertIn("milestones", json_data["data"])
        self.assertGreater(len(json_data["data"]["badges"]), 0)

    def test_unauthorized_missing_token(self):
        """Verify endpoint returns 401 when Authorization header is missing."""
        response = self.client.get("/api/v1/students/growth-passport")
        self.assertEqual(response.status_code, 401)

    def test_forbidden_role(self):
        """Verify endpoint returns 403 when user does not have the Student role (e.g. user_id = 2, Parent)."""
        parent_token = create_access_token(subject=2)
        parent_headers = {"Authorization": f"Bearer {parent_token}"}
        response = self.client.get("/api/v1/students/growth-passport", headers=parent_headers)
        self.assertEqual(response.status_code, 403)

if __name__ == "__main__":
    unittest.main()

