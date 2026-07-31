import unittest
from fastapi.testclient import TestClient
from app.main import app
from app.core.security import create_access_token

class TestParentRouter(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)
        # Generate valid Parent token (user_id = 2 is Sarah B - Parent in MOCK_USERS)
        self.token = create_access_token(subject=2)
        self.headers = {"Authorization": f"Bearer {self.token}"}

    def test_get_dashboard(self):
        """Test GET parent dashboard endpoint."""
        response = self.client.get("/api/v1/parents/dashboard", headers=self.headers)
        self.assertEqual(response.status_code, 200)
        json_data = response.json()
        self.assertTrue(json_data["success"])
        self.assertIn("linked_students", json_data["data"])
        self.assertGreater(len(json_data["data"]["linked_students"]), 0)
        self.assertEqual(json_data["data"]["linked_students"][0]["first_name"], "Rahul")

    def test_get_bus_tracking(self):
        """Test GET parent bus-tracking endpoint."""
        response = self.client.get("/api/v1/parents/bus-tracking", headers=self.headers)
        self.assertEqual(response.status_code, 200)
        json_data = response.json()
        self.assertTrue(json_data["success"])
        self.assertEqual(json_data["data"]["route_name"], "Route 12 - South Side")
        self.assertEqual(json_data["data"]["boarding_status"], "Boarded")

    def test_ask_ai_coach(self):
        """Test POST ask AI coach advice endpoint."""
        payload = {"query": "How to handle homework reluctance?"}
        response = self.client.post("/api/v1/parents/ai-coach", json=payload, headers=self.headers)
        self.assertEqual(response.status_code, 200)
        json_data = response.json()
        self.assertTrue(json_data["success"])
        self.assertIn("response", json_data["data"])
        self.assertEqual(json_data["data"]["query"], payload["query"])

    def test_get_ai_coach_history(self):
        """Test GET AI coach history endpoint and verify persistence."""
        # 1. Ask a question
        payload = {"query": "Verify stateful storage flow query"}
        post_response = self.client.post("/api/v1/parents/ai-coach", json=payload, headers=self.headers)
        self.assertEqual(post_response.status_code, 200)
        post_data = post_response.json()
        new_advice_id = post_data["data"]["id"]

        # 2. Retrieve history and ensure it contains the transaction (verifying state persistence)
        response = self.client.get("/api/v1/parents/ai-coach/history", headers=self.headers)
        self.assertEqual(response.status_code, 200)
        json_data = response.json()
        self.assertTrue(json_data["success"])
        
        matched_items = [item for item in json_data["data"] if item["id"] == new_advice_id]
        self.assertEqual(len(matched_items), 1)
        self.assertEqual(matched_items[0]["query"], "Verify stateful storage flow query")

    def test_unauthorized_missing_token(self):
        """Verify endpoint returns 401 when Authorization header is missing."""
        response = self.client.get("/api/v1/parents/dashboard")
        self.assertEqual(response.status_code, 401)

    def test_forbidden_role(self):
        """Verify endpoint returns 403 when user does not have the Parent role (e.g. user_id = 1, Student)."""
        # User ID 1 corresponds to Student user (Rahul B)
        student_token = create_access_token(subject=1)
        student_headers = {"Authorization": f"Bearer {student_token}"}
        response = self.client.get("/api/v1/parents/dashboard", headers=student_headers)
        self.assertEqual(response.status_code, 403)

if __name__ == "__main__":
    unittest.main()

