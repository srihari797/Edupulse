from typing import Optional, Dict, Any, List
from app.modules.teacher.repository import TeacherRepository

class TeacherService:
    """
    Business Service Layer for Teacher Module.
    """
    def __init__(self, repository: TeacherRepository):
        self.repository = repository

    async def get_profile(self, user_id: int) -> Optional[Dict[str, Any]]:
        return await self.repository.get_teacher_profile_by_user_id(user_id)

    async def update_profile(self, user_id: int, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        return await self.repository.update_teacher_profile(user_id, data)

    async def get_dashboard(self, user_id: int) -> Dict[str, Any]:
        return await self.repository.get_dashboard_data(user_id)

    async def get_classroom_health(self, class_id: int) -> Dict[str, Any]:
        return await self.repository.get_classroom_health(class_id)

    async def get_student_learning_dna(self, student_id: int) -> Dict[str, Any]:
        return await self.repository.get_student_learning_dna(student_id)

    async def get_risk_alerts(self, class_id: int) -> List[Dict[str, Any]]:
        return await self.repository.get_risk_alerts(class_id)

    async def get_teacher_risk_alerts(self, user_id: int) -> List[Dict[str, Any]]:
        return await self.repository.get_teacher_risk_alerts(user_id)

    async def create_shared_goal(self, data: Dict[str, Any]) -> Dict[str, Any]:
        return await self.repository.create_shared_goal(data)

    async def get_shared_goals(self, student_id: int) -> List[Dict[str, Any]]:
        return await self.repository.get_shared_goals_by_student(student_id)

    async def update_shared_goal(self, goal_id: int, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        return await self.repository.update_shared_goal(goal_id, data)

    async def create_assignment(self, data: Dict[str, Any]) -> Dict[str, Any]:
        return await self.repository.create_assignment(data)

    async def get_assignments(self, teacher_id: int) -> List[Dict[str, Any]]:
        return await self.repository.get_assignments_by_teacher(teacher_id)

    async def get_assignment(self, assignment_id: int) -> Optional[Dict[str, Any]]:
        return await self.repository.get_assignment_by_id(assignment_id)

    async def update_assignment(self, assignment_id: int, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        return await self.repository.update_assignment(assignment_id, data)

    async def delete_assignment(self, assignment_id: int) -> bool:
        return await self.repository.delete_assignment(assignment_id)

    async def create_resource(self, data: Dict[str, Any]) -> Dict[str, Any]:
        return await self.repository.create_learning_resource(data)

    async def get_resources_by_subject(self, subject_id: int) -> List[Dict[str, Any]]:
        return await self.repository.get_learning_resources_by_subject(subject_id)

    async def get_teacher_students(self, user_id: int) -> List[Dict[str, Any]]:
        return await self.repository.get_teacher_students(user_id)

    async def get_student_detail_report(self, student_id: int) -> Optional[Dict[str, Any]]:
        return await self.repository.get_student_detail_report(student_id)

    async def get_submissions(self, teacher_id: int, assignment_id: Optional[int] = None, class_id: Optional[int] = None) -> List[Dict[str, Any]]:
        return await self.repository.get_submissions(teacher_id, assignment_id, class_id)

    async def grade_submission(self, submission_id: int, score: int, feedback: Optional[str] = None) -> Optional[Dict[str, Any]]:
        return await self.repository.grade_submission(submission_id, score, feedback)

    async def get_teacher_doubts(self, user_id: int) -> List[Dict[str, Any]]:
        return await self.repository.get_teacher_doubts(user_id)

    async def respond_teacher_doubt(self, user_id: int, doubt_id: int, response_text: str, status_label: str = "Answered") -> Optional[Dict[str, Any]]:
        return await self.repository.respond_teacher_doubt(user_id, doubt_id, response_text, status_label)
    async def get_teacher_timetable(self, user_id: int) -> Dict[str, Any]:
        return await self.repository.get_teacher_timetable(user_id)

    async def get_teacher_ai_analytics(self, user_id: int) -> Dict[str, Any]:
        return await self.repository.get_teacher_ai_analytics(user_id)

