import unittest
from fastapi.testclient import TestClient
from app.main import app
from app.core.security import create_access_token

class TestTeacherRouter(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)
        # Generate valid Teacher token (user_id = 3 is David Miller - Teacher in MOCK_USERS)
        self.token = create_access_token(subject=3)
        self.headers = {"Authorization": f"Bearer {self.token}"}

    def test_get_dashboard(self):
        """Test GET teacher dashboard endpoint."""
        response = self.client.get("/api/v1/teachers/dashboard", headers=self.headers)
        self.assertEqual(response.status_code, 200)
        json_data = response.json()
        self.assertTrue(json_data["success"])
        self.assertIn("classroom_summary", json_data["data"])
        self.assertEqual(json_data["data"]["classroom_summary"]["class_name"], "Grade 10-A")

    def test_get_classroom_health(self):
        """Test GET classroom health metrics endpoint."""
        response = self.client.get("/api/v1/teachers/classes/10/health", headers=self.headers)
        self.assertEqual(response.status_code, 200)
        json_data = response.json()
        self.assertTrue(json_data["success"])
        self.assertEqual(json_data["data"]["class_id"], 10)
        self.assertEqual(json_data["data"]["class_name"], "Grade 10-A")
        self.assertEqual(json_data["data"]["average_gpa"], 3.42)
        self.assertIn("weak_topics", json_data["data"])

    def test_get_student_learning_dna(self):
        """Test GET student learning DNA endpoint."""
        response = self.client.get("/api/v1/teachers/students/1/learning-dna", headers=self.headers)
        self.assertEqual(response.status_code, 200)
        json_data = response.json()
        self.assertTrue(json_data["success"])
        self.assertEqual(json_data["data"]["student_id"], 1)
        self.assertEqual(json_data["data"]["student_name"], "Rahul B")
        self.assertIn("cognitive_profile", json_data["data"])
        self.assertEqual(json_data["data"]["cognitive_profile"]["learning_pace"], "Fast")
        self.assertGreater(len(json_data["data"]["strengths"]), 0)

    def test_get_risk_alerts(self):
        """Test GET classroom student risk alerts endpoint."""
        response = self.client.get("/api/v1/teachers/classes/10/risk-alerts", headers=self.headers)
        self.assertEqual(response.status_code, 200)
        json_data = response.json()
        self.assertTrue(json_data["success"])
        self.assertEqual(len(json_data["data"]), 2)
        self.assertEqual(json_data["data"][0]["student_name"], "Bob Johnson")
        self.assertEqual(json_data["data"][0]["risk_level"], "High")

    def test_create_list_update_shared_goals(self):
        """Test POST, GET and PUT operations on Parent-Teacher Shared Goals."""
        # 1. POST Create
        payload = {
            "student_id": 1,
            "teacher_id": 3,
            "parent_id": 1,
            "title": "Improve Algebra score",
            "description": "Increase score by at least 15% on the next assessment.",
            "target_date": "2026-08-30"
        }
        create_resp = self.client.post("/api/v1/teachers/shared-goals", json=payload, headers=self.headers)
        self.assertEqual(create_resp.status_code, 200)
        create_data = create_resp.json()
        self.assertTrue(create_data["success"])
        self.assertEqual(create_data["data"]["status"], "Proposed")
        new_goal_id = create_data["data"]["id"]

        # 2. GET List
        list_resp = self.client.get("/api/v1/teachers/shared-goals/student/1", headers=self.headers)
        self.assertEqual(list_resp.status_code, 200)
        list_data = list_resp.json()
        self.assertTrue(list_data["success"])
        
        # Verify the newly created goal is present in the returned list (Verifying repository state persistence)
        matched_goals = [g for g in list_data["data"] if g["id"] == new_goal_id]
        self.assertEqual(len(matched_goals), 1)
        self.assertEqual(matched_goals[0]["title"], "Improve Algebra score")

        # 3. PUT Update
        update_payload = {
            "status": "Active",
            "description": "Increase score by at least 20% on the next assessment."
        }
        update_resp = self.client.put(f"/api/v1/teachers/shared-goals/{new_goal_id}", json=update_payload, headers=self.headers)
        self.assertEqual(update_resp.status_code, 200)
        update_data = update_resp.json()
        self.assertTrue(update_data["success"])
        self.assertEqual(update_data["data"]["status"], "Active")
        self.assertEqual(update_data["data"]["description"], update_payload["description"])

    def test_unauthorized_missing_token(self):
        """Verify endpoint returns 401 when Authorization header is missing."""
        response = self.client.get("/api/v1/teachers/dashboard")
        self.assertEqual(response.status_code, 401)

    def test_forbidden_role(self):
        """Verify endpoint returns 403 when user does not have the Teacher role (e.g. user_id = 1, Student)."""
        # User ID 1 corresponds to Student user (Rahul B)
        student_token = create_access_token(subject=1)
        student_headers = {"Authorization": f"Bearer {student_token}"}
        response = self.client.get("/api/v1/teachers/dashboard", headers=student_headers)
        self.assertEqual(response.status_code, 403)

if __name__ == "__main__":
    unittest.main()

