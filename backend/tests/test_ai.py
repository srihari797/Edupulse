import unittest
from fastapi.testclient import TestClient
from app.main import app
from app.core.security import create_access_token
from app.modules.ai.schemas import RecommendationType

class TestAIRouter(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)
        # Setup tokens for different roles
        self.student_token = create_access_token(subject=1)  # Student (role_id=1)
        self.parent_token = create_access_token(subject=2)   # Parent (role_id=2)
        self.teacher_token = create_access_token(subject=3)  # Teacher (role_id=3)
        self.admin_token = create_access_token(subject=4)    # Admin (role_id=4)
        
        self.student_headers = {"Authorization": f"Bearer {self.student_token}"}
        self.parent_headers = {"Authorization": f"Bearer {self.parent_token}"}
        self.teacher_headers = {"Authorization": f"Bearer {self.teacher_token}"}
        self.admin_headers = {"Authorization": f"Bearer {self.admin_token}"}

    def test_unauthorized_access(self):
        """Test that missing authorization headers return 401."""
        response = self.client.post("/api/v1/ai/workload-analysis", json={})
        self.assertEqual(response.status_code, 401)

    def test_workload_analysis_access(self):
        """Test access control and response validation for workload analysis."""
        payload = {
            "student_name": "Rahul B",
            "grade": "Grade 10",
            "section": "A",
            "assignments_summary": "Math due Friday",
            "deadlines_summary": "Friday Math",
            "attendance_percent": 95.0
        }
        
        # Student (role_id=1) -> Allowed (200)
        response = self.client.post("/api/v1/ai/workload-analysis", json=payload, headers=self.student_headers)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data["success"])
        self.assertEqual(data["data"]["template_key"], "workload_analysis")
        self.assertIn("response", data["data"])

        # Teacher (role_id=3) -> Allowed (200)
        response = self.client.post("/api/v1/ai/workload-analysis", json=payload, headers=self.teacher_headers)
        self.assertEqual(response.status_code, 200)

        # Parent (role_id=2) -> Forbidden (403)
        response = self.client.post("/api/v1/ai/workload-analysis", json=payload, headers=self.parent_headers)
        self.assertEqual(response.status_code, 403)

    def test_learning_health_access(self):
        """Test access control for learning health indexing."""
        payload = {
            "student_name": "Rahul B",
            "grade": "Grade 10",
            "assessment_scores": "Math: 85%",
            "topics_assessed": "Algebra",
            "previous_score": 80.0,
            "attendance_percent": 95.0
        }
        
        # Student -> Allowed
        response = self.client.post("/api/v1/ai/learning-health", json=payload, headers=self.student_headers)
        self.assertEqual(response.status_code, 200)
        
        # Parent -> Forbidden
        response = self.client.post("/api/v1/ai/learning-health", json=payload, headers=self.parent_headers)
        self.assertEqual(response.status_code, 403)

    def test_student_risk_access(self):
        """Test access control for invisible student radar."""
        payload = {
            "class_name": "Grade 10-A",
            "teacher_name": "David Miller",
            "subject": "Mathematics",
            "students_data": "Rahul: declining grades",
            "attendance_trends": "Rahul: 75% attendance",
            "grade_trends": "Downwards",
            "submission_patterns": "Late submissions"
        }
        
        # Teacher -> Allowed
        response = self.client.post("/api/v1/ai/student-risk", json=payload, headers=self.teacher_headers)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["data"]["template_key"], "student_risk")

        # Student -> Forbidden
        response = self.client.post("/api/v1/ai/student-risk", json=payload, headers=self.student_headers)
        self.assertEqual(response.status_code, 403)

    def test_growth_passport_access(self):
        """Test access control for holistic growth passport."""
        payload = {
            "student_name": "Rahul B",
            "grade": "Grade 10",
            "academic_year": "2025-2026",
            "academic_summary": "Excellent math, needs physics attention",
            "extracurricular_achievements": "Science Olympiad Winner",
            "attendance_percent": 98.0,
            "punctuality_score": 95.0,
            "participation_data": "High class participation",
            "milestones": "First place science olympiad"
        }
        
        # Parent -> Allowed
        response = self.client.post("/api/v1/ai/growth-passport", json=payload, headers=self.parent_headers)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["data"]["template_key"], "growth_passport")

        # Student -> Allowed
        response = self.client.post("/api/v1/ai/growth-passport", json=payload, headers=self.student_headers)
        self.assertEqual(response.status_code, 200)

    def test_recommendations_access(self):
        """Test access control and validation for personalized recommendations."""
        payload = {
            "student_name": "Rahul B",
            "grade": "Grade 10",
            "role": "Parent",
            "recommendation_types": ["study_plan", "opportunities"],
            "academic_summary": "B+ average",
            "weak_areas": "Physics equations",
            "strong_areas": "Geometry",
            "upcoming_events": "Physics exam next Tuesday",
            "interests": "Science fiction, robotics"
        }
        
        # Student -> Allowed
        response = self.client.post("/api/v1/ai/recommendations", json=payload, headers=self.student_headers)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["data"]["template_key"], "recommendations")

        # Invalid recommendation type -> Validation Error (422)
        invalid_payload = payload.copy()
        invalid_payload["recommendation_types"] = ["invalid_type"]
        response = self.client.post("/api/v1/ai/recommendations", json=invalid_payload, headers=self.student_headers)
        self.assertEqual(response.status_code, 422)

    def test_teacher_analytics_get_access(self):
        """Test GET teacher analytics endpoint."""
        # Teacher (role_id=3) -> Allowed
        response = self.client.get("/api/v1/ai/teachers/analytics?class_id=10", headers=self.teacher_headers)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data["success"])
        self.assertEqual(data["data"]["template_key"], "learning_health")

        # Student (role_id=1) -> Forbidden (403)
        response = self.client.get("/api/v1/ai/teachers/analytics?class_id=10", headers=self.student_headers)
        self.assertEqual(response.status_code, 403)

    def test_admin_radar_get_access(self):
        """Test GET admin student radar endpoint."""
        # Admin (role_id=4) -> Allowed
        response = self.client.get("/api/v1/ai/students/radar?class_id=10", headers=self.admin_headers)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data["success"])
        self.assertEqual(data["data"]["template_key"], "student_risk")

        # Teacher (role_id=3) -> Forbidden (403)
        response = self.client.get("/api/v1/ai/students/radar?class_id=10", headers=self.teacher_headers)
        self.assertEqual(response.status_code, 403)
