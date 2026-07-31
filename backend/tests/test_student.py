import unittest
from fastapi.testclient import TestClient
from app.main import app
from app.core.security import create_access_token

class TestStudentRouter(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)
        # Generate a valid JWT token for student user ID 1
        self.token = create_access_token(subject=1)
        self.headers = {"Authorization": f"Bearer {self.token}"}

    def test_get_profile(self):
        """Test GET student profile endpoint."""
        response = self.client.get("/api/v1/students/profile", headers=self.headers)
        self.assertEqual(response.status_code, 200)
        json_data = response.json()
        self.assertTrue(json_data["success"])
        self.assertEqual(json_data["data"]["user_id"], 1)
        self.assertEqual(json_data["data"]["first_name"], "Rahul")

    def test_update_profile(self):
        """Test PUT student profile update endpoint."""
        payload = {
            "gender": "Female",
            "guardian_name": "Jane Doe",
            "guardian_phone": "+0987654321"
        }
        response = self.client.put("/api/v1/students/profile", json=payload, headers=self.headers)
        self.assertEqual(response.status_code, 200)
        json_data = response.json()
        self.assertTrue(json_data["success"])
        self.assertEqual(json_data["data"]["gender"], "Female")
        self.assertEqual(json_data["data"]["guardian_name"], "Jane Doe")

        # Perform a GET to ensure the mock repository retains the update statefully
        get_response = self.client.get("/api/v1/students/profile", headers=self.headers)
        self.assertEqual(get_response.status_code, 200)
        get_json = get_response.json()
        self.assertEqual(get_json["data"]["gender"], "Female")
        self.assertEqual(get_json["data"]["guardian_name"], "Jane Doe")

    def test_get_dashboard(self):
        """Test GET student dashboard endpoint."""
        response = self.client.get("/api/v1/students/dashboard", headers=self.headers)
        self.assertEqual(response.status_code, 200)
        json_data = response.json()
        self.assertTrue(json_data["success"])
        self.assertIn("academic_overview", json_data["data"])
        self.assertIn("attendance", json_data["data"])
        self.assertIn("workload", json_data["data"])
        self.assertEqual(json_data["data"]["attendance"]["present_percentage"], 92.5)

    def test_generate_and_get_study_plan(self):
        """Test POST and GET study plan endpoints."""
        # POST generate
        post_response = self.client.post("/api/v1/students/study-plan", headers=self.headers)
        self.assertEqual(post_response.status_code, 200)
        post_data = post_response.json()
        self.assertTrue(post_data["success"])
        self.assertEqual(post_data["data"]["plan_type"], "Weekly")
        self.assertIn("schedule", post_data["data"]["plan_data"])
        
        # GET retrieve
        get_response = self.client.get("/api/v1/students/study-plan", headers=self.headers)
        self.assertEqual(get_response.status_code, 200)
        get_data = get_response.json()
        self.assertTrue(get_data["success"])
        self.assertEqual(get_data["data"]["id"], post_data["data"]["id"])

    def test_generate_and_get_exam_plan(self):
        """Test POST and GET exam plan endpoints."""
        # POST generate
        post_response = self.client.post("/api/v1/students/exam-plan", headers=self.headers)
        self.assertEqual(post_response.status_code, 200)
        post_data = post_response.json()
        self.assertTrue(post_data["success"])
        self.assertEqual(post_data["data"]["plan_type"], "Exam Revision")
        
        # GET retrieve
        get_response = self.client.get("/api/v1/students/exam-plan", headers=self.headers)
        self.assertEqual(get_response.status_code, 200)
        get_data = get_response.json()
        self.assertTrue(get_data["success"])

    def test_get_opportunities(self):
        """Test GET opportunities endpoint."""
        response = self.client.get("/api/v1/students/opportunities", headers=self.headers)
        self.assertEqual(response.status_code, 200)
        json_data = response.json()
        self.assertTrue(json_data["success"])
        self.assertGreater(len(json_data["data"]), 0)
        self.assertEqual(json_data["data"][0]["opportunity_type"], "Scholarship")

    def test_unauthorized_missing_token(self):
        """Verify endpoint returns 401 when Authorization header is missing."""
        response = self.client.get("/api/v1/students/profile")
        self.assertEqual(response.status_code, 401)

    def test_forbidden_role(self):
        """Verify endpoint returns 403 when user does not have the Student role (e.g. user_id = 2, Parent)."""
        # User ID 2 corresponds to Parent user (Sarah B)
        parent_token = create_access_token(subject=2)
        parent_headers = {"Authorization": f"Bearer {parent_token}"}
        response = self.client.get("/api/v1/students/profile", headers=parent_headers)
        self.assertEqual(response.status_code, 403)

if __name__ == "__main__":
    unittest.main()

