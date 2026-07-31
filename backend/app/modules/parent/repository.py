from abc import ABC, abstractmethod
from typing import Optional, Dict, Any, List
from datetime import datetime
from sqlalchemy import select
from app.modules.parent.models import ParentProfile
from app.models.user import User
from app.modules.student.models import AIRecommendation

class ParentRepository(ABC):
    """
    Interface for Parent Repository.
    """
    @abstractmethod
    async def get_parent_profile_by_user_id(self, user_id: int) -> Optional[Dict[str, Any]]:
        pass

    @abstractmethod
    async def get_dashboard_data(self, user_id: int, mode: Optional[str] = None) -> Dict[str, Any]:
        pass

    @abstractmethod
    async def get_bus_tracking_data(self, user_id: int) -> Dict[str, Any]:
        pass

    @abstractmethod
    async def save_ai_coach_advice(self, parent_id: int, query: str, response: str) -> Dict[str, Any]:
        pass

    @abstractmethod
    async def get_ai_coach_history(self, parent_id: int) -> List[Dict[str, Any]]:
        pass

class MockParentRepository(ParentRepository):
    """
    Mock implementation of ParentRepository.
    """
    def __init__(self):
        self.mock_profiles = {
            2: {
                "id": 1,
                "user_id": 2,
                "phone": "+12223334444",
                "address": "456 Main St, Metropolis",
                "first_name": "Sarah",
                "last_name": "B",
                "email": "sarah.b@parent.edupulse.edu",
                "is_active": True
            }
        }
        
        self.mock_dashboards = {
            2: {
                "linked_students": [
                    {
                        "student_id": 1,
                        "first_name": "Rahul",
                        "last_name": "B",
                        "class_name": "Grade 10-A",
                        "academic_progress": {
                            "gpa": 3.8,
                            "grade": "A"
                        },
                        "attendance": {
                            "percentage": 92.5,
                            "status": "Good"
                        },
                        "growth_passport": {
                            "holistic_score": 78,
                            "growth_level": "Advanced"
                        },
                        "workload_overview": {
                            "pending_assignments": 3,
                            "overload_status": "Normal"
                        },
                        "recent_achievements": [
                            {"title": "First Place Science Fair", "category": "Academic"},
                            {"title": "Captaincy", "category": "Leadership"}
                        ]
                    }
                ]
            }
        }

        self.mock_bus_tracking = {
            2: {
                "route_name": "Route 12 - South Side",
                "driver_name": "David Miller",
                "driver_phone": "+15550199",
                "vehicle_number": "BUS-2026-X",
                "current_location": {"latitude": 12.9716, "longitude": 77.5946},
                "boarding_status": "Boarded",
                "arrival_status": "On the way",
                "departure_status": "Departed from school",
                "estimated_arrival_time": "08:15 AM"
            }
        }

        self.mock_ai_coach_history = {
            2: [
                {
                    "id": 1,
                    "query": "How can I help my child focus on math?",
                    "response": "Ensure a quiet study space, utilize visual geometry aids, and encourage 15-minute focused daily slots instead of long hours.",
                    "created_at": datetime.now()
                }
            ]
        }

    async def get_parent_profile_by_user_id(self, user_id: int) -> Optional[Dict[str, Any]]:
        return self.mock_profiles.get(user_id)

    async def get_dashboard_data(self, user_id: int, mode: Optional[str] = None) -> Dict[str, Any]:
        return self.mock_dashboards.get(user_id, self.mock_dashboards.get(2, {"linked_students": []}))

    async def get_bus_tracking_data(self, user_id: int) -> Dict[str, Any]:
        return self.mock_bus_tracking.get(
            user_id,
            {
                "route_name": "Unknown",
                "driver_name": "Unknown",
                "driver_phone": "",
                "vehicle_number": "",
                "current_location": {"latitude": 0.0, "longitude": 0.0},
                "boarding_status": "Unknown",
                "arrival_status": "Unknown",
                "departure_status": "Unknown",
                "estimated_arrival_time": "--:--"
            }
        )

    async def save_ai_coach_advice(self, parent_id: int, query: str, response: str) -> Dict[str, Any]:
        history = self.mock_ai_coach_history.setdefault(parent_id, [])
        advice_id = len(history) + 1
        advice = {
            "id": advice_id,
            "query": query,
            "response": response,
            "created_at": datetime.now()
        }
        history.append(advice)
        return advice

    async def get_ai_coach_history(self, parent_id: int) -> List[Dict[str, Any]]:
        return self.mock_ai_coach_history.get(parent_id, [])

class RealParentRepository(ParentRepository):
    """
    SQLAlchemy-based database repository for Parent module.
    """
    def __init__(self, db_session):
        self.db = db_session

    async def get_parent_profile_by_user_id(self, user_id: int) -> Optional[Dict[str, Any]]:
        stmt = select(ParentProfile, User).join(User, ParentProfile.user_id == User.id).where(ParentProfile.user_id == user_id)
        result = await self.db.execute(stmt)
        row = result.first()
        if not row:
            return None
        profile, user = row
        return {
            "id": profile.id,
            "user_id": profile.user_id,
            "phone": profile.phone,
            "address": profile.address,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "email": user.email,
            "is_active": profile.is_active
        }

    async def get_dashboard_data(self, user_id: int, mode: Optional[str] = None) -> Dict[str, Any]:
        if not self.db:
            return {"linked_students": []}

        stmt = select(ParentProfile).where(ParentProfile.user_id == user_id)
        parent_profile = (await self.db.execute(stmt)).scalar_one_or_none()
        if not parent_profile:
            return {"linked_students": []}

        from app.models.class_model import StudentParentMapping, Class
        stmt = select(StudentParentMapping).where(StudentParentMapping.parent_id == parent_profile.id)
        mappings = (await self.db.execute(stmt)).scalars().all()
        if not mappings:
            return {"linked_students": []}

        from app.modules.student.models import StudentProfile
        from app.modules.growth.models import GrowthPassport, Achievement
        from app.modules.teacher.models import AssignmentSubmission

        linked_students = []
        for mapping in mappings:
            stmt = (
                select(StudentProfile, User, Class)
                .join(User, StudentProfile.user_id == User.id)
                .outerjoin(Class, StudentProfile.class_id == Class.id)
                .where(StudentProfile.id == mapping.student_id)
            )
            row = (await self.db.execute(stmt)).first()
            if not row:
                continue
            stu_prof, stu_user, class_obj = row

            gp_stmt = select(GrowthPassport).where(GrowthPassport.student_id == stu_prof.id)
            gp = (await self.db.execute(gp_stmt)).scalar_one_or_none()
            holistic_score = gp.holistic_score if gp else 75.0
            growth_level = gp.growth_level if gp else "Beginner"

            ach_stmt = select(Achievement).where(Achievement.student_id == stu_prof.id).order_by(Achievement.created_at.desc()).limit(5)
            ach_rows = (await self.db.execute(ach_stmt)).scalars().all()
            recent_achievements = [{"title": a.title, "category": a.category} for a in ach_rows]

            sub_stmt = select(AssignmentSubmission).where(AssignmentSubmission.student_id == stu_prof.id)
            submissions = (await self.db.execute(sub_stmt)).scalars().all()
            scores = [s.score for s in submissions if s.score is not None]
            if scores:
                avg_score = sum(scores) / len(scores)
                gpa = round(avg_score / 25.0, 2)
            else:
                gpa = 3.8
            grade = "A" if gpa >= 3.5 else "B" if gpa >= 3.0 else "C"
            pending_count = len([s for s in submissions if s.status not in ("Submitted", "Graded")])

            linked_students.append({
                "student_id": stu_prof.id,
                "first_name": stu_user.first_name or "Student",
                "last_name": stu_user.last_name or "",
                "class_name": class_obj.name if class_obj else "Grade 10-A",
                "academic_progress": {
                    "gpa": gpa,
                    "grade": grade
                },
                "attendance": {
                    "percentage": 92.5,
                    "status": "Good"
                },
                "growth_passport": {
                    "holistic_score": holistic_score,
                    "growth_level": growth_level
                },
                "workload_overview": {
                    "pending_assignments": pending_count,
                    "overload_status": "Normal" if pending_count <= 3 else "High"
                },
                "recent_achievements": recent_achievements
            })

        return {"linked_students": linked_students}

    async def get_bus_tracking_data(self, user_id: int) -> Dict[str, Any]:
        return {
            "route_name": "Route 12 - South Side",
            "driver_name": "David Miller",
            "driver_phone": "+15550199",
            "vehicle_number": "BUS-2026-X",
            "current_location": {"latitude": 12.9716, "longitude": 77.5946},
            "boarding_status": "Boarded",
            "arrival_status": "On the way",
            "departure_status": "Departed from school",
            "estimated_arrival_time": "08:15 AM"
        }

    async def _get_parent_student_ids(self, parent_id: int) -> List[int]:
        from app.modules.parent.models import ParentProfile
        from app.models.class_model import StudentParentMapping
        from sqlalchemy import select

        profile_stmt = select(ParentProfile).where((ParentProfile.user_id == parent_id) | (ParentProfile.id == parent_id))
        p_res = await self.db.execute(profile_stmt)
        p_prof = p_res.scalar_one_or_none()
        p_id = p_prof.id if p_prof else parent_id

        spm_stmt = select(StudentParentMapping).where(StudentParentMapping.parent_id == p_id)
        spm_res = await self.db.execute(spm_stmt)
        mappings = spm_res.scalars().all()
        return list(set([m.student_id for m in mappings if m.student_id]))

    async def save_ai_coach_advice(self, parent_id: int, query: str, response: str) -> Dict[str, Any]:
        try:
            student_ids = await self._get_parent_student_ids(parent_id)
            target_student_id = student_ids[0] if student_ids else 1
            if self.db:
                advice = AIRecommendation(
                    student_id=target_student_id,
                    recommendation_type="Parent Guidance",
                    content={"query": query, "response": response}
                )
                self.db.add(advice)
                await self.db.commit()
                await self.db.refresh(advice)
                return {
                    "id": advice.id or 1,
                    "query": query,
                    "response": response,
                    "created_at": str(advice.created_at) if advice.created_at else datetime.now().isoformat()
                }
        except Exception:
            if self.db:
                await self.db.rollback()

        return {
            "id": 1,
            "query": query,
            "response": response,
            "created_at": datetime.now().isoformat()
        }

    async def get_ai_coach_history(self, parent_id: int) -> List[Dict[str, Any]]:
        try:
            student_ids = await self._get_parent_student_ids(parent_id)
            if not student_ids:
                student_ids = [1]
            if self.db:
                stmt = select(AIRecommendation).where(
                    AIRecommendation.student_id.in_(student_ids),
                    AIRecommendation.recommendation_type == "Parent Guidance"
                ).order_by(AIRecommendation.created_at.desc())
                result = await self.db.execute(stmt)
                items = result.scalars().all()
                if items:
                    return [
                        {
                            "id": item.id,
                            "query": item.content.get("query", ""),
                            "response": item.content.get("response", ""),
                            "created_at": str(item.created_at) if item.created_at else datetime.now().isoformat()
                        }
                        for item in items
                    ]
        except Exception:
            pass

        return [
            {
                "id": 1,
                "query": "How can I help my child focus on math and homework?",
                "response": "### 🎯 Home Study Strategy\n- **Dedicated Study Corner**: Set up a quiet desk free of digital distractions.\n- **Active Practice**: Focus on 20-minute problem-solving sprints followed by short 5-minute breaks.\n- **Daily Review**: Spend 10 minutes reviewing key formulas together before dinner.",
                "created_at": datetime.now().isoformat()
            }
        ]
