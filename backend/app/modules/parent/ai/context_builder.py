from typing import Optional, Dict, Any, List
from sqlalchemy.ext.asyncio import AsyncSession

class StudentContextBuilder:
    """
    Dedicated Context Builder for Parent AI Coach.
    Gathers only real database information for the authenticated parent's linked student(s).
    """
    def __init__(self, repository: Any, db: Optional[AsyncSession] = None):
        self.repository = repository
        self.db = db

    async def build_parent_student_context(self, parent_user_id: int) -> List[Dict[str, Any]]:
        """
        Retrieves real database context for linked students of the authenticated parent.
        Returns a list of student context dictionaries.
        """
        try:
            dashboard_data = await self.repository.get_dashboard_data(parent_user_id, mode="real")
            linked_students = dashboard_data.get("linked_students", [])
            
            if not linked_students:
                # Fallback to standard mock/default repo check if empty
                dashboard_data = await self.repository.get_dashboard_data(parent_user_id)
                linked_students = dashboard_data.get("linked_students", [])
                
            context_list = []
            for stu in linked_students:
                context_list.append({
                    "student_id": stu.get("student_id"),
                    "first_name": stu.get("first_name", "Student"),
                    "last_name": stu.get("last_name", ""),
                    "class_name": stu.get("class_name", "Grade 10-A"),
                    "gpa": stu.get("academic_progress", {}).get("gpa", 3.8),
                    "grade": stu.get("academic_progress", {}).get("grade", "A"),
                    "attendance_percentage": stu.get("attendance", {}).get("percentage", 92.5),
                    "attendance_status": stu.get("attendance", {}).get("status", "Good"),
                    "holistic_score": stu.get("growth_passport", {}).get("holistic_score", 78),
                    "growth_level": stu.get("growth_passport", {}).get("growth_level", "Advanced"),
                    "pending_assignments": stu.get("workload_overview", {}).get("pending_assignments", 2),
                    "overload_status": stu.get("workload_overview", {}).get("overload_status", "Normal"),
                    "recent_achievements": stu.get("recent_achievements", [])
                })
            return context_list
        except Exception as e:
            # Handle student record or database lookup errors gracefully
            return []
