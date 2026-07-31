import unittest
from fastapi.testclient import TestClient
from app.main import app
from app.core.security import create_access_token

class TestAdminRouter(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)
        # Generate valid Admin token (user_id = 4 is Admin User in MOCK_USERS)
        self.token = create_access_token(subject=4)
        self.headers = {"Authorization": f"Bearer {self.token}"}

    def test_create_user(self):
        """Test POST /admin/users endpoint."""
        payload = {
            "email": "new.user@edupulse.edu",
            "password": "password123",
            "first_name": "New",
            "last_name": "User",
            "role_id": 1
        }
        response = self.client.post("/api/v1/admin/users", json=payload, headers=self.headers)
        self.assertEqual(response.status_code, 200)
        json_data = response.json()
        self.assertTrue(json_data["success"])
        self.assertEqual(json_data["data"]["email"], payload["email"])
        self.assertEqual(json_data["data"]["first_name"], payload["first_name"])

    def test_get_users(self):
        """Test GET /admin/users filter endpoint."""
        response = self.client.get("/api/v1/admin/users?role_id=1", headers=self.headers)
        self.assertEqual(response.status_code, 200)
        json_data = response.json()
        self.assertTrue(json_data["success"])
        self.assertGreaterEqual(len(json_data["data"]), 1)
        self.assertEqual(json_data["data"][0]["role_id"], 1)

    def test_update_user(self):
        """Test PUT /admin/users/{user_id} endpoint."""
        payload = {
            "first_name": "Updated",
            "last_name": "Name",
            "is_active": False
        }
        response = self.client.put("/api/v1/admin/users/1", json=payload, headers=self.headers)
        self.assertEqual(response.status_code, 200)
        json_data = response.json()
        self.assertTrue(json_data["success"])
        self.assertEqual(json_data["data"]["first_name"], payload["first_name"])
        self.assertEqual(json_data["data"]["is_active"], payload["is_active"])

    def test_reset_password(self):
        """Test POST /admin/users/{user_id}/reset-password endpoint."""
        payload = {
            "password": "newsecurepassword"
        }
        response = self.client.post("/api/v1/admin/users/1/reset-password", json=payload, headers=self.headers)
        self.assertEqual(response.status_code, 200)
        json_data = response.json()
        self.assertTrue(json_data["success"])
        self.assertEqual(json_data["message"], "Password initialized/reset successfully.")

    def test_academic_structure(self):
        """Test Class, Section, Subject, and AcademicYear CRUD endpoints with persistence checks."""
        # 1. Classes CRUD
        class_payload = {"name": "Grade 11-B", "grade": "11", "section": "B"}
        res = self.client.post("/api/v1/admin/classes", json=class_payload, headers=self.headers)
        self.assertEqual(res.status_code, 200)
        new_class_id = res.json()["data"]["id"]

        # Read to verify statefulness (persisted across resolver calls)
        list_res = self.client.get("/api/v1/admin/classes", headers=self.headers)
        self.assertEqual(list_res.status_code, 200)
        matched_classes = [c for c in list_res.json()["data"] if c["id"] == new_class_id]
        self.assertEqual(len(matched_classes), 1)

        # Update
        put_res = self.client.put(f"/api/v1/admin/classes/{new_class_id}", json={"name": "Grade 11-B Modified"}, headers=self.headers)
        self.assertEqual(put_res.status_code, 200)
        self.assertEqual(put_res.json()["data"]["name"], "Grade 11-B Modified")

        # Delete
        del_res = self.client.delete(f"/api/v1/admin/classes/{new_class_id}", headers=self.headers)
        self.assertEqual(del_res.status_code, 200)

        # Read again to verify 404/deleted state
        list_res_after = self.client.get("/api/v1/admin/classes", headers=self.headers)
        matched_classes_after = [c for c in list_res_after.json()["data"] if c["id"] == new_class_id]
        self.assertEqual(len(matched_classes_after), 0)

        # 2. Sections CRUD
        sec_payload = {"name": "C"}
        res = self.client.post("/api/v1/admin/sections", json=sec_payload, headers=self.headers)
        self.assertEqual(res.status_code, 200)
        new_sec_id = res.json()["data"]["id"]

        list_res = self.client.get("/api/v1/admin/sections", headers=self.headers)
        self.assertEqual(list_res.status_code, 200)

        # Use pre-populated section ID 1
        put_res = self.client.put("/api/v1/admin/sections/1", json={"name": "D"}, headers=self.headers)
        self.assertEqual(put_res.status_code, 200)

        del_res = self.client.delete(f"/api/v1/admin/sections/{new_sec_id}", headers=self.headers)
        self.assertEqual(del_res.status_code, 200)

        # 3. Subjects CRUD
        sub_payload = {"name": "Chemistry", "code": "CHEM102"}
        res = self.client.post("/api/v1/admin/subjects", json=sub_payload, headers=self.headers)
        self.assertEqual(res.status_code, 200)
        new_sub_id = res.json()["data"]["id"]

        list_res = self.client.get("/api/v1/admin/subjects", headers=self.headers)
        self.assertEqual(list_res.status_code, 200)

        put_res = self.client.put(f"/api/v1/admin/subjects/{new_sub_id}", json={"name": "Organic Chemistry"}, headers=self.headers)
        self.assertEqual(put_res.status_code, 200)

        del_res = self.client.delete(f"/api/v1/admin/subjects/{new_sub_id}", headers=self.headers)
        self.assertEqual(del_res.status_code, 200)

        # 4. Academic Years CRUD
        year_payload = {"name": "2027-2028", "start_date": "2027-06-01", "end_date": "2028-04-30"}
        res = self.client.post("/api/v1/admin/academic-years", json=year_payload, headers=self.headers)
        self.assertEqual(res.status_code, 200)

        list_res = self.client.get("/api/v1/admin/academic-years", headers=self.headers)
        self.assertEqual(list_res.status_code, 200)

    def test_teacher_management(self):
        """Test POST /admin/teachers/assign and GET assignments."""
        payload = {
            "teacher_id": 3,
            "class_id": 10,
            "subject_id": 1,
            "is_homeroom": True
        }
        res = self.client.post("/api/v1/admin/teachers/assign", json=payload, headers=self.headers)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertTrue(data["success"])
        self.assertEqual(data["data"]["teacher_id"], 3)

        list_res = self.client.get("/api/v1/admin/teachers/3/assignments", headers=self.headers)
        self.assertEqual(list_res.status_code, 200)
        self.assertGreaterEqual(len(list_res.json()["data"]), 1)

    def test_student_management(self):
        """Test student mapping, parent linking, and promotion endpoints."""
        # 1. Map Class
        map_payload = {"student_id": 1, "class_id": 10}
        res = self.client.post("/api/v1/admin/students/map-class", json=map_payload, headers=self.headers)
        self.assertEqual(res.status_code, 200)
        self.assertTrue(res.json()["success"])

        # 2. Link Parent
        link_payload = {"student_id": 1, "parent_id": 1}
        res = self.client.post("/api/v1/admin/students/link-parent", json=link_payload, headers=self.headers)
        self.assertEqual(res.status_code, 200)
        self.assertTrue(res.json()["success"])

        # 3. Promote Students
        promote_payload = {"student_ids": [1], "target_class_id": 10}
        res = self.client.post("/api/v1/admin/students/promote", json=promote_payload, headers=self.headers)
        self.assertEqual(res.status_code, 200)
        self.assertTrue(res.json()["success"])
        self.assertEqual(res.json()["data"]["promoted_count"], 1)

    def test_school_configuration(self):
        """Test timetable, calendar, and settings configuration endpoints."""
        # 1. Timetable
        slot_payload = {
            "class_id": 10,
            "subject_id": 1,
            "day_of_week": "Tuesday",
            "start_time": "10:00",
            "end_time": "10:45"
        }
        res = self.client.post("/api/v1/admin/timetable", json=slot_payload, headers=self.headers)
        self.assertEqual(res.status_code, 200)
        self.assertTrue(res.json()["success"])

        list_res = self.client.get("/api/v1/admin/timetable?class_id=10", headers=self.headers)
        self.assertEqual(list_res.status_code, 200)
        self.assertGreaterEqual(len(list_res.json()["data"]), 1)

        # 2. Calendar
        event_payload = {
            "title": "Winter break",
            "description": "School closed for holidays.",
            "event_date": "2026-12-25T00:00:00Z",
            "is_holiday": True
        }
        res = self.client.post("/api/v1/admin/calendar", json=event_payload, headers=self.headers)
        self.assertEqual(res.status_code, 200)
        self.assertTrue(res.json()["success"])

        list_res = self.client.get("/api/v1/admin/calendar", headers=self.headers)
        self.assertEqual(list_res.status_code, 200)
        self.assertGreaterEqual(len(list_res.json()["data"]), 1)

        # 3. Settings
        setting_payload = {
            "key": "academic_mode",
            "value": "semester"
        }
        res = self.client.post("/api/v1/admin/settings", json=setting_payload, headers=self.headers)
        self.assertEqual(res.status_code, 200)
        self.assertTrue(res.json()["success"])
        self.assertEqual(res.json()["data"]["value"], "semester")

        list_res = self.client.get("/api/v1/admin/settings", headers=self.headers)
        self.assertEqual(list_res.status_code, 200)
        self.assertGreaterEqual(len(list_res.json()["data"]), 1)

    def test_admin_dashboard(self):
        """Test GET /admin/dashboard aggregator endpoint."""
        res = self.client.get("/api/v1/admin/dashboard", headers=self.headers)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertTrue(data["success"])
        self.assertIn("student_count", data["data"])
        self.assertEqual(data["data"]["system_status"], "Healthy")

    def test_unauthorized_missing_token(self):
        """Verify endpoint returns 401 when Authorization header is missing."""
        response = self.client.get("/api/v1/admin/dashboard")
        self.assertEqual(response.status_code, 401)

    def test_forbidden_role(self):
        """Verify endpoint returns 403 when user does not have the Admin role (e.g. user_id = 1, Student)."""
        student_token = create_access_token(subject=1)
        student_headers = {"Authorization": f"Bearer {student_token}"}
        response = self.client.get("/api/v1/admin/dashboard", headers=student_headers)
        self.assertEqual(response.status_code, 403)

if __name__ == "__main__":
    unittest.main()

