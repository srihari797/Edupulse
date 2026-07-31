import unittest
from fastapi.testclient import TestClient
from app.main import app
from app.core.security import create_access_token

class TestNotificationRouter(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)
        # Generate valid Student token (user_id = 1 is Student in MOCK_USERS)
        self.token = create_access_token(subject=1)
        self.headers = {"Authorization": f"Bearer {self.token}"}

    def test_get_notifications(self):
        """Test GET notifications list endpoint."""
        response = self.client.get("/api/v1/notifications?page=1&size=10", headers=self.headers)
        self.assertEqual(response.status_code, 200)
        json_data = response.json()
        self.assertTrue(json_data["success"])
        self.assertIn("items", json_data["data"])
        self.assertEqual(json_data["data"]["page"], 1)
        self.assertEqual(json_data["data"]["size"], 10)
        self.assertGreater(len(json_data["data"]["items"]), 0)

    def test_mark_read(self):
        """Test PUT mark notification as read and verify state persistence."""
        # 1. Math Homework 4 notification has id=1
        response = self.client.put("/api/v1/notifications/1/read", headers=self.headers)
        self.assertEqual(response.status_code, 200)
        json_data = response.json()
        self.assertTrue(json_data["success"])
        self.assertTrue(json_data["data"]["is_read"])
        self.assertEqual(json_data["data"]["id"], 1)

        # 2. Get list again to ensure statefulness persists across request lifecycle
        list_response = self.client.get("/api/v1/notifications?page=1&size=10", headers=self.headers)
        self.assertEqual(list_response.status_code, 200)
        items = list_response.json()["data"]["items"]
        matched = [i for i in items if i["id"] == 1]
        self.assertEqual(len(matched), 1)
        self.assertTrue(matched[0]["is_read"])

    def test_mark_read_not_found(self):
        """Test PUT mark notification as read for non-existing id."""
        response = self.client.put("/api/v1/notifications/999/read", headers=self.headers)
        self.assertEqual(response.status_code, 404)

    def test_unauthorized_missing_token(self):
        """Verify endpoint returns 401 when Authorization header is missing."""
        response = self.client.get("/api/v1/notifications")
        self.assertEqual(response.status_code, 401)

if __name__ == "__main__":
    unittest.main()

