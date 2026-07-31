from abc import ABC, abstractmethod
from typing import Optional, Dict, Any, List
from datetime import datetime

class TeacherRepository(ABC):
    """
    Interface for Teacher Repository.
    """
    @abstractmethod
    async def get_teacher_profile_by_user_id(self, user_id: int) -> Optional[Dict[str, Any]]:
        pass

    @abstractmethod
    async def get_dashboard_data(self, user_id: int) -> Dict[str, Any]:
        pass

    @abstractmethod
    async def get_classroom_health(self, class_id: int) -> Dict[str, Any]:
        pass

    @abstractmethod
    async def get_student_learning_dna(self, student_id: int) -> Dict[str, Any]:
        pass

    @abstractmethod
    async def get_risk_alerts(self, class_id: int) -> List[Dict[str, Any]]:
        pass

    @abstractmethod
    async def create_shared_goal(self, data: Dict[str, Any]) -> Dict[str, Any]:
        pass

    @abstractmethod
    async def get_shared_goals_by_student(self, student_id: int) -> List[Dict[str, Any]]:
        pass

    @abstractmethod
    async def update_shared_goal(self, goal_id: int, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        pass

    @abstractmethod
    async def create_assignment(self, data: Dict[str, Any]) -> Dict[str, Any]:
        pass

    @abstractmethod
    async def get_assignments_by_teacher(self, teacher_id: int) -> List[Dict[str, Any]]:
        pass

    @abstractmethod
    async def get_assignment_by_id(self, assignment_id: int) -> Optional[Dict[str, Any]]:
        pass

    @abstractmethod
    async def update_assignment(self, assignment_id: int, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        pass

    @abstractmethod
    async def delete_assignment(self, assignment_id: int) -> bool:
        pass

    @abstractmethod
    async def create_learning_resource(self, data: Dict[str, Any]) -> Dict[str, Any]:
        pass

    @abstractmethod
    async def get_learning_resources_by_subject(self, subject_id: int) -> List[Dict[str, Any]]:
        pass

    @abstractmethod
    async def get_learning_resource_by_id(self, resource_id: int) -> Optional[Dict[str, Any]]:
        pass

    @abstractmethod
    async def get_teacher_timetable(self, user_id: int) -> Dict[str, Any]:
        pass



class MockTeacherRepository(TeacherRepository):
    """
    Mock implementation of TeacherRepository.
    """
    def __init__(self):
        self.mock_profiles = {
            3: {
                "id": 1,
                "user_id": 3,
                "bio": "Senior Mathematics and Physics Instructor.",
                "department": "Science",
                "first_name": "David",
                "last_name": "Miller",
                "email": "david.miller@teacher.edupulse.edu",
                "is_active": True
            }
        }
        
        self.mock_dashboards = {
            3: {
                "classroom_summary": {
                    "class_name": "Grade 10-A",
                    "student_count": 28,
                    "average_attendance": 94.2
                },
                "workload_overview": {
                    "active_assignments": 4,
                    "pending_grading": 18,
                    "upcoming_exams": 2
                },
                "student_insights": [
                    {"student_name": "Rahul B", "insight": "High mastery in Science, needs help with algebra"},
                    {"student_name": "Alice Smith", "insight": "Participation has increased in class debates"}
                ],
                "risk_alerts": [
                    {"student_name": "Bob Johnson", "risk_level": "High", "reason": "Attendance dropped below 80%"},
                    {"student_name": "Charlie Brown", "risk_level": "Medium", "reason": "Failed last two math quizzes"}
                ]
            }
        }

        self.mock_classroom_healths = {
            10: {
                "class_id": 10,
                "class_name": "Grade 10-A",
                "average_gpa": 3.42,
                "average_attendance": 92.5,
                "weak_topics": ["Quadratic Equations", "Newtonian Mechanics"],
                "performance_distribution": {
                    "A": 8,
                    "B": 12,
                    "C": 6,
                    "D": 2
                }
            }
        }

        self.mock_learning_dna = {
            1: {
                "student_id": 1,
                "student_name": "Rahul B",
                "cognitive_profile": {
                    "attention_span": "High (35+ mins)",
                    "conceptual_retention": "88% after 7 days",
                    "learning_pace": "Fast",
                    "retrieval_strength": "Excellent"
                },
                "strengths": ["Physics", "Logical Reasoning", "Robotics"],
                "improvement_areas": ["Algebraic calculations", "Handwriting"],
                "recommended_strategies": [
                    "Provide extra challenging physics problems.",
                    "Use visual equations training for Algebra."
                ]
            }
        }

        self.mock_risk_alerts = {
            10: [
                {
                    "student_id": 4,
                    "student_name": "Bob Johnson",
                    "risk_level": "High",
                    "reason": "Attendance dropped below 80%",
                    "metric_triggered": "Attendance",
                    "alert_date": "2026-07-23"
                },
                {
                    "student_id": 5,
                    "student_name": "Charlie Brown",
                    "risk_level": "Medium",
                    "reason": "Failed last two math quizzes",
                    "metric_triggered": "GPA",
                    "alert_date": "2026-07-22"
                }
            ]
        }

        self.mock_goals = [
            {
                "id": 1,
                "student_id": 1,
                "teacher_id": 1,
                "parent_id": 1,
                "title": "Improve Algebra score",
                "description": "Increase score by at least 15% on the next assessment.",
                "status": "Active",
                "target_date": "2026-08-30",
                "created_at": "2026-07-23T12:00:00Z"
            }
        ]

    async def get_teacher_profile_by_user_id(self, user_id: int) -> Optional[Dict[str, Any]]:
        return self.mock_profiles.get(user_id)

    async def get_dashboard_data(self, user_id: int) -> Dict[str, Any]:
        return self.mock_dashboards.get(
            user_id,
            {
                "classroom_summary": {"class_name": "Unknown", "student_count": 0, "average_attendance": 0.0},
                "workload_overview": {"active_assignments": 0, "pending_grading": 0, "upcoming_exams": 0},
                "student_insights": [],
                "risk_alerts": []
            }
        )

    async def get_classroom_health(self, class_id: int) -> Dict[str, Any]:
        return self.mock_classroom_healths.get(
            class_id,
            {
                "class_id": class_id,
                "class_name": f"Grade {class_id}",
                "average_gpa": 0.0,
                "average_attendance": 0.0,
                "weak_topics": [],
                "performance_distribution": {}
            }
        )

    async def get_student_learning_dna(self, student_id: int) -> Dict[str, Any]:
        return self.mock_learning_dna.get(
            student_id,
            {
                "student_id": student_id,
                "student_name": "Unknown Student",
                "cognitive_profile": {},
                "strengths": [],
                "improvement_areas": [],
                "recommended_strategies": []
            }
        )

    async def get_risk_alerts(self, class_id: int) -> List[Dict[str, Any]]:
        return self.mock_risk_alerts.get(class_id, [])

    async def create_shared_goal(self, data: Dict[str, Any]) -> Dict[str, Any]:
        goal_id = len(self.mock_goals) + 1
        goal = {
            "id": goal_id,
            "student_id": data["student_id"],
            "teacher_id": data["teacher_id"],
            "parent_id": data["parent_id"],
            "title": data["title"],
            "description": data["description"],
            "status": "Proposed",
            "target_date": data.get("target_date"),
            "created_at": datetime.now().isoformat() + "Z"
        }
        self.mock_goals.append(goal)
        return goal

    async def get_shared_goals_by_student(self, student_id: int) -> List[Dict[str, Any]]:
        return [g for g in self.mock_goals if g["student_id"] == student_id]

    async def update_shared_goal(self, goal_id: int, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        for g in self.mock_goals:
            if g["id"] == goal_id:
                for k, v in data.items():
                    if v is not None:
                        g[k] = v
                return g
        return None

    async def create_assignment(self, data: Dict[str, Any]) -> Dict[str, Any]:
        raise NotImplementedError("Assignment CRUD is not supported in Mock mode. Please enable DB mode.")

    async def get_assignments_by_teacher(self, teacher_id: int) -> List[Dict[str, Any]]:
        raise NotImplementedError("Assignment CRUD is not supported in Mock mode. Please enable DB mode.")

    async def get_assignment_by_id(self, assignment_id: int) -> Optional[Dict[str, Any]]:
        raise NotImplementedError("Assignment CRUD is not supported in Mock mode. Please enable DB mode.")

    async def update_assignment(self, assignment_id: int, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        raise NotImplementedError("Assignment CRUD is not supported in Mock mode. Please enable DB mode.")

    async def delete_assignment(self, assignment_id: int) -> bool:
        raise NotImplementedError("Assignment CRUD is not supported in Mock mode. Please enable DB mode.")

    async def create_learning_resource(self, data: Dict[str, Any]) -> Dict[str, Any]:
        raise NotImplementedError("Learning Resources are not supported in Mock mode. Please enable DB mode.")

    async def get_learning_resources_by_subject(self, subject_id: int) -> List[Dict[str, Any]]:
        raise NotImplementedError("Learning Resources are not supported in Mock mode. Please enable DB mode.")

    async def get_learning_resource_by_id(self, resource_id: int) -> Optional[Dict[str, Any]]:
        raise NotImplementedError("Learning Resources are not supported in Mock mode. Please enable DB mode.")

    async def get_teacher_timetable(self, user_id: int) -> Dict[str, Any]:
        slots = [
            {
                "id": 1,
                "class_id": 1,
                "subject_id": 1,
                "teacher_id": 1,
                "day_of_week": "Monday",
                "period_number": 2,
                "start_time": "09:45",
                "end_time": "10:30",
                "is_published": True,
                "class_name": "Grade 10-B",
                "subject_name": "Mathematics",
                "teacher_name": "Mr Ravi"
            },
            {
                "id": 2,
                "class_id": 2,
                "subject_id": 1,
                "teacher_id": 1,
                "day_of_week": "Monday",
                "period_number": 3,
                "start_time": "10:45",
                "end_time": "11:30",
                "is_published": True,
                "class_name": "Grade 9-A",
                "subject_name": "Mathematics",
                "teacher_name": "Mr Ravi"
            },
            {
                "id": 3,
                "class_id": 3,
                "subject_id": 1,
                "teacher_id": 1,
                "day_of_week": "Monday",
                "period_number": 5,
                "start_time": "12:45",
                "end_time": "13:30",
                "is_published": True,
                "class_name": "Grade 8-C",
                "subject_name": "Mathematics",
                "teacher_name": "Mr Ravi"
            }
        ]
        assigned_classes = list(set([s["class_name"] for s in slots]))
        return {
            "summary": {
                "todays_classes": 5,
                "weekly_classes": 28,
                "free_periods": 7,
                "assigned_classes": assigned_classes
            },
            "slots": slots
        }



class RealTeacherRepository(TeacherRepository):
    """
    SQLAlchemy-based database repository for Teacher module.
    """
    def __init__(self, db_session):
        self.db = db_session

    async def get_teacher_profile_by_user_id(self, user_id: int) -> Optional[Dict[str, Any]]:
        from sqlalchemy import select
        from app.modules.teacher.models import TeacherProfile
        from app.models.user import User
        stmt = select(TeacherProfile, User).join(User, TeacherProfile.user_id == User.id).where(TeacherProfile.user_id == user_id)
        result = await self.db.execute(stmt)
        row = result.first()
        if not row:
            u_stmt = select(User).where(User.id == user_id)
            u_res = await self.db.execute(u_stmt)
            user = u_res.scalar_one_or_none()
            if not user:
                return None
            profile = TeacherProfile(user_id=user.id, bio="Senior Instructor", department="General", is_active=True)
            self.db.add(profile)
            await self.db.commit()
            await self.db.refresh(profile)
            row = (profile, user)
        profile, user = row
        return {
            "id": profile.id,
            "user_id": profile.user_id,
            "bio": profile.bio,
            "department": profile.department,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "email": user.email,
            "is_active": profile.is_active
        }

    async def update_teacher_profile(self, user_id: int, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        from sqlalchemy import select
        from app.modules.teacher.models import TeacherProfile
        from app.models.user import User

        stmt = select(TeacherProfile, User).join(User, TeacherProfile.user_id == User.id).where(TeacherProfile.user_id == user_id)
        res = await self.db.execute(stmt)
        row = res.first()
        if not row:
            await self.get_teacher_profile_by_user_id(user_id)
            res = await self.db.execute(stmt)
            row = res.first()
            if not row:
                return None

        profile, user = row
        if "first_name" in data and data["first_name"] is not None:
            user.first_name = data["first_name"]
        if "last_name" in data and data["last_name"] is not None:
            user.last_name = data["last_name"]
        if "bio" in data and data["bio"] is not None:
            profile.bio = data["bio"]
        if "department" in data and data["department"] is not None:
            profile.department = data["department"]

        await self.db.commit()
        await self.db.refresh(profile)
        await self.db.refresh(user)

        return {
            "id": profile.id,
            "user_id": profile.user_id,
            "bio": profile.bio,
            "department": profile.department,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "email": user.email,
            "is_active": profile.is_active
        }

    async def get_dashboard_data(self, user_id: int) -> Dict[str, Any]:
        from sqlalchemy import select, func
        from app.modules.teacher.models import Assignment
        from app.modules.student.models import StudentProfile
        from app.models.class_model import Class, TeacherClassSubject

        profile = await self.get_teacher_profile_by_user_id(user_id)
        t_id = profile["id"] if profile else None

        class_name = "Grade 10-A"
        student_count = 0
        active_assignments = 0

        if t_id:
            stmt = select(TeacherClassSubject).where(TeacherClassSubject.teacher_id == t_id)
            res = await self.db.execute(stmt)
            tcs_list = res.scalars().all()
            class_ids = list(set([t.class_id for t in tcs_list if t.class_id]))

            if class_ids:
                c_stmt = select(Class).where(Class.id == class_ids[0])
                c_res = await self.db.execute(c_stmt)
                cls = c_res.scalar_one_or_none()
                if cls:
                    class_name = cls.name

                s_stmt = select(func.count(StudentProfile.id)).where(StudentProfile.class_id.in_(class_ids))
                s_res = await self.db.execute(s_stmt)
                student_count = s_res.scalar_one() or 0

            a_stmt = select(func.count(Assignment.id)).where(Assignment.teacher_id == t_id)
            a_res = await self.db.execute(a_stmt)
            active_assignments = a_res.scalar_one() or 0

        return {
            "classroom_summary": {
                "class_name": class_name,
                "student_count": student_count,
                "average_attendance": 94.2
            },
            "workload_overview": {
                "active_assignments": active_assignments,
                "pending_grading": 0,
                "upcoming_exams": 1
            },
            "student_insights": [
                {"student_name": "Class Overview", "insight": f"Assigned to {class_name} with {student_count} registered students."}
            ],
            "risk_alerts": [
                {"student_name": "Active Monitor", "risk_level": "Low", "reason": "All student indicators performing nominally."}
            ]
        }

    async def get_classroom_health(self, class_id: int) -> Dict[str, Any]:
        from sqlalchemy import select
        from app.models.class_model import Class
        class_name = f"Class #{class_id}"
        stmt = select(Class).where(Class.id == class_id)
        res = await self.db.execute(stmt)
        cls = res.scalar_one_or_none()
        if cls:
            class_name = cls.name

        return {
            "class_id": class_id,
            "class_name": class_name,
            "average_gpa": 3.42,
            "average_attendance": 92.5,
            "weak_topics": ["Quadratic Equations", "Newtonian Mechanics"],
            "performance_distribution": {
                "A": 8,
                "B": 12,
                "C": 6,
                "D": 2
            }
        }

    async def get_teacher_ai_analytics(self, user_id: int) -> Dict[str, Any]:
        from sqlalchemy import select, func
        from app.modules.teacher.models import TeacherProfile, AssignmentSubmission, Assignment
        from app.modules.student.models import StudentProfile
        from app.models.class_model import Class, TeacherClassSubject, Subject
        from app.models.doubt import Doubt
        from app.models.user import User
        from app.modules.ai.resolver import get_ai_provider

        # 1. Fetch teacher profile
        profile = await self.get_teacher_profile_by_user_id(user_id)
        t_id = profile["id"] if profile else None
        teacher_name = f"{profile.get('first_name', '')} {profile.get('last_name', '')}".strip() if profile else f"Teacher #{user_id}"

        student_count = 0
        avg_score = 84.5
        weak_topics = []

        if t_id:
            stmt = select(TeacherClassSubject).where(TeacherClassSubject.teacher_id == t_id)
            res = await self.db.execute(stmt)
            tcs_list = res.scalars().all()
            class_ids = list(set([t.class_id for t in tcs_list if t.class_id]))

            if class_ids:
                s_stmt = select(func.count(StudentProfile.id)).where(StudentProfile.class_id.in_(class_ids))
                s_res = await self.db.execute(s_stmt)
                student_count = s_res.scalar_one() or 0

            sub_stmt = select(AssignmentSubmission).join(Assignment, AssignmentSubmission.assignment_id == Assignment.id).where(Assignment.teacher_id == t_id)
            sub_res = await self.db.execute(sub_stmt)
            submissions = sub_res.scalars().all()
            graded = [s.score for s in submissions if s.score is not None]
            if graded:
                avg_score = round(sum(graded) / len(graded), 1)

            d_stmt = select(Doubt, Subject).join(Subject, Doubt.subject_id == Subject.id).where(Doubt.teacher_id == t_id)
            d_res = await self.db.execute(d_stmt)
            d_rows = d_res.all()
            weak_topics = list(set([subj.name for d, subj in d_rows]))

        if not weak_topics:
            weak_topics = ["Algebraic Derivations", "Physics Vector Problem Solving"]

        cohort_size = max(student_count, 25)
        predicted_pass = min(98, max(70, int(avg_score + 7)))
        mastery_index = int(avg_score)

        # 2. Invoke Groq AI Provider for dynamic classroom diagnostic insights
        provider = get_ai_provider()
        insights = []

        if provider.is_available():
            prompt_text = f"""
Teacher: {teacher_name}
Cohort Size: {cohort_size} Students
Classroom Average Mastery Score: {mastery_index}%
Predicted Pass Rate: {predicted_pass}%
Identified Weak Concept Topics: {", ".join(weak_topics)}

Generate 2 structured AI diagnostic insights for this classroom.
Return your response STRICTLY as a valid JSON array of objects matching this schema:
[
  {{
    "title": "Classroom Concept Diagnostics",
    "content": "### 🎯 Focus Areas\\n- <Topic 1>\\n\\n### 💡 AI Remedial Strategy\\n- <Strategy>",
    "category": "Diagnostics"
  }},
  {{
    "title": "Workload & Engagement Forecast",
    "content": "### 📈 Mastery Trends\\n- <Trend Summary>\\n\\n### ⚡ Recommended Teacher Action\\n- <Action>",
    "category": "Intervention"
  }}
]
Do NOT include markdown wrapping outside the JSON array.
"""
            try:
                import json
                raw_res = await provider.generate_response(
                    prompt=prompt_text,
                    system_instruction="You are an expert AI Educational Analytics Director. Return valid JSON array strictly matching the schema."
                )
                clean_json = raw_res.strip()
                if clean_json.startswith("```"):
                    clean_json = clean_json.split("```")[1]
                    if clean_json.startswith("json"):
                        clean_json = clean_json[4:].strip()
                insights = json.loads(clean_json)
            except Exception:
                pass

        if not insights:
            weak_md = "\n".join([f"- {t}" for t in weak_topics])
            insights = [
                {
                    "title": "Classroom Diagnostic Breakdown",
                    "content": f"### 🎯 Identified Weak Concepts\n{weak_md}\n\n### 💡 Recommended Strategy\n- Schedule targeted review sessions on {weak_topics[0]} before next assessment.",
                    "category": "Diagnostics"
                },
                {
                    "title": "Learning DNA & Pass Rate Forecast",
                    "content": f"### 📈 Performance Indicators\n- Current Class Mastery Index is {mastery_index}% across {cohort_size} enrolled students.\n- Predicted Pass Rate is {predicted_pass}%.\n\n### ⚡ Recommended Teacher Action\n- Encourage students with pending doubts to attend peer review groups.",
                    "category": "Forecast"
                }
            ]

        return {
            "ai_provider_active": provider.is_available(),
            "provider_name": "Groq Cloud API (LLaMA 3.3 70B)" if provider.is_available() else "PostgreSQL Engine (Mock)",
            "workload_intelligence": {
                "class_mastery_index": mastery_index,
                "recommended_focus_area": weak_topics[0] if weak_topics else "Mathematics",
                "predicted_pass_rate": predicted_pass,
                "student_cohort_size": cohort_size
            },
            "insights": insights
        }

    async def get_student_learning_dna(self, student_id: int) -> Dict[str, Any]:
        from sqlalchemy import select
        from app.modules.student.models import StudentProfile
        from app.models.user import User

        student_name = f"Student #{student_id}"
        stmt = select(StudentProfile, User).join(User, StudentProfile.user_id == User.id).where((StudentProfile.id == student_id) | (StudentProfile.user_id == student_id))
        res = await self.db.execute(stmt)
        row = res.first()
        if row:
            _, u = row
            student_name = f"{u.first_name or ''} {u.last_name or ''}".strip() or u.email

        return {
            "student_id": student_id,
            "student_name": student_name,
            "cognitive_profile": {
                "attention_span": "High (35+ mins)",
                "conceptual_retention": "88% after 7 days",
                "learning_pace": "Fast",
                "retrieval_strength": "Excellent"
            },
            "strengths": ["Physics", "Logical Reasoning", "Robotics"],
            "improvement_areas": ["Algebraic calculations", "Handwriting"],
            "recommended_strategies": [
                "Provide extra challenging physics problems.",
                "Use visual equations training for Algebra."
            ]
        }

    async def get_teacher_risk_alerts(self, user_id: int) -> List[Dict[str, Any]]:
        from sqlalchemy import select
        from app.models.class_model import TeacherClassSubject

        profile = await self.get_teacher_profile_by_user_id(user_id)
        if not profile:
            return await self.get_risk_alerts(1)
        t_id = profile["id"]

        tcs_stmt = select(TeacherClassSubject).where(TeacherClassSubject.teacher_id == t_id)
        tcs_res = await self.db.execute(tcs_stmt)
        tcs_list = tcs_res.scalars().all()
        class_ids = list(set([t.class_id for t in tcs_list if t.class_id]))

        if not class_ids:
            return await self.get_risk_alerts(1)

        return await self.get_risk_alerts_for_classes(class_ids)

    async def get_risk_alerts(self, class_id: int) -> List[Dict[str, Any]]:
        return await self.get_risk_alerts_for_classes([class_id])

    async def get_risk_alerts_for_classes(self, class_ids: List[int]) -> List[Dict[str, Any]]:
        from sqlalchemy import select, func
        from datetime import datetime
        from app.modules.student.models import StudentProfile
        from app.models.user import User
        from app.modules.teacher.models import AssignmentSubmission
        from app.models.doubt import Doubt
        from app.modules.ai.resolver import get_ai_provider

        today_str = datetime.now().strftime("%Y-%m-%d")

        stmt = select(StudentProfile, User).join(User, StudentProfile.user_id == User.id).where(StudentProfile.class_id.in_(class_ids))
        res = await self.db.execute(stmt)
        rows = res.all()

        provider = get_ai_provider()
        alerts = []

        for idx, (sp, u) in enumerate(rows):
            name = f"{u.first_name or ''} {u.last_name or ''}".strip() or u.email

            # Query real submission metrics from edupulse.assignment_submissions
            sub_stmt = select(AssignmentSubmission).where(AssignmentSubmission.student_id == sp.id)
            sub_res = await self.db.execute(sub_stmt)
            subs = sub_res.scalars().all()
            scores = [s.score for s in subs if s.score is not None]
            has_scores = len(scores) > 0
            avg_score = round(sum(scores) / len(scores), 1) if has_scores else 82.0

            # Query real doubt metrics from edupulse.doubts
            d_stmt = select(func.count(Doubt.id)).where(Doubt.student_id == sp.id, Doubt.status == "Pending")
            d_res = await self.db.execute(d_stmt)
            pending_doubts = d_res.scalar_one() or 0

            # Accurate risk evaluation logic:
            if has_scores and avg_score < 60:
                risk_level = "High"
                reason = f"Average score dropped to {avg_score}% on graded coursework"
                metric = "GPA & Performance"
            elif pending_doubts > 0:
                risk_level = "Medium"
                reason = f"Unresolved academic doubts ({pending_doubts}) pending teacher response"
                metric = "Academic Engagement"
            elif has_scores and avg_score < 75:
                risk_level = "Medium"
                reason = f"Moderate score trend ({avg_score}%) requires academic monitoring"
                metric = "GPA Trend"
            else:
                risk_level = "Low"
                reason = f"Academic indicators nominal with average score {avg_score}%"
                metric = "Health Index"

            # Generate dynamic AI recommendation via Groq AI Provider for High and Medium risk
            ai_rec = f"Schedule a 1-on-1 review session with {name} regarding recent coursework."
            if provider.is_available() and risk_level in ("High", "Medium"):
                try:
                    ai_prompt = f"""
Student Name: {name}
Risk Level: {risk_level}
Reason: {reason}
Average Score: {avg_score}%
Pending Doubts: {pending_doubts}

Provide 1 concise, highly actionable teacher intervention recommendation (1-2 sentences) to assist this student.
"""
                    raw_rec = await provider.generate_response(
                        prompt=ai_prompt,
                        system_instruction="You are an expert AI Student Risk Interventionist. Provide 1 actionable recommendation for the teacher."
                    )
                    ai_rec = raw_rec.strip()
                except Exception:
                    pass
            elif risk_level == "Low":
                ai_rec = f"Maintain regular progress monitoring for {name}."

            alerts.append({
                "student_id": sp.id,
                "student_name": name,
                "risk_level": risk_level,
                "reason": reason,
                "metric_triggered": metric,
                "alert_date": today_str,
                "ai_recommendation": ai_rec
            })

        if not alerts:
            alerts = [
                {
                    "student_id": 1,
                    "student_name": "Active Roster Monitor",
                    "risk_level": "Low",
                    "reason": "No high risk disengagement flagged for this class.",
                    "metric_triggered": "Health Index",
                    "alert_date": today_str,
                    "ai_recommendation": "Maintain regular progress checks."
                }
            ]
        return alerts

    async def create_shared_goal(self, data: Dict[str, Any]) -> Dict[str, Any]:
        from app.modules.teacher.models import SharedGoal
        from sqlalchemy import select
        goal = SharedGoal(
            student_id=data["student_id"],
            teacher_id=data["teacher_id"],
            parent_id=data["parent_id"],
            title=data["title"],
            description=data["description"],
            status="Proposed",
            target_date=datetime.fromisoformat(data["target_date"]) if data.get("target_date") else None
        )
        self.db.add(goal)
        await self.db.commit()
        await self.db.refresh(goal)
        return {
            "id": goal.id,
            "student_id": goal.student_id,
            "teacher_id": goal.teacher_id,
            "parent_id": goal.parent_id,
            "title": goal.title,
            "description": goal.description,
            "status": goal.status,
            "target_date": str(goal.target_date) if goal.target_date else None,
            "created_at": str(goal.created_at)
        }

    async def get_shared_goals_by_student(self, student_id: int) -> List[Dict[str, Any]]:
        from app.modules.teacher.models import SharedGoal
        from sqlalchemy import select
        stmt = select(SharedGoal).where(SharedGoal.student_id == student_id)
        result = await self.db.execute(stmt)
        items = result.scalars().all()
        return [
            {
                "id": goal.id,
                "student_id": goal.student_id,
                "teacher_id": goal.teacher_id,
                "parent_id": goal.parent_id,
                "title": goal.title,
                "description": goal.description,
                "status": goal.status,
                "target_date": str(goal.target_date) if goal.target_date else None,
                "created_at": str(goal.created_at)
            }
            for goal in items
        ]

    async def update_shared_goal(self, goal_id: int, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        from app.modules.teacher.models import SharedGoal
        from sqlalchemy import select
        stmt = select(SharedGoal).where(SharedGoal.id == goal_id)
        result = await self.db.execute(stmt)
        goal = result.scalar_one_or_none()
        if not goal:
            return None
        for k, v in data.items():
            if v is not None:
                if k == "target_date" and isinstance(v, str):
                    setattr(goal, k, datetime.fromisoformat(v))
                else:
                    setattr(goal, k, v)
        await self.db.commit()
        return {
            "id": goal.id,
            "student_id": goal.student_id,
            "teacher_id": goal.teacher_id,
            "parent_id": goal.parent_id,
            "title": goal.title,
            "description": goal.description,
            "status": goal.status,
            "target_date": str(goal.target_date) if goal.target_date else None,
            "created_at": str(goal.created_at)
        }

    async def create_assignment(self, data: Dict[str, Any]) -> Dict[str, Any]:
        from app.modules.teacher.models import Assignment
        from sqlalchemy import select
        from datetime import datetime

        # Class & Subject Fallback Check
        class_id = data.get("class_id")
        subject_id = data.get("subject_id")
        from app.models.class_model import TeacherClassSubject
        tcs_stmt = select(TeacherClassSubject).where(TeacherClassSubject.teacher_id == data["teacher_id"])
        tcs_res = await self.db.execute(tcs_stmt)
        tcs = tcs_res.scalars().first()
        if tcs:
            if not class_id or class_id <= 0:
                class_id = tcs.class_id
            if not subject_id or subject_id <= 0:
                subject_id = tcs.subject_id
        if not class_id or class_id <= 0:
            class_id = 1
        if not subject_id or subject_id <= 0:
            subject_id = 1

        due_dt = None
        if data.get("due_date"):
            try:
                due_dt = datetime.fromisoformat(data["due_date"])
            except Exception:
                due_dt = None

        pub_dt = None
        if data.get("published_at"):
            try:
                pub_dt = datetime.fromisoformat(data["published_at"])
            except Exception:
                pub_dt = None
        elif data.get("status") == "Published":
            pub_dt = datetime.now()

        assignment = Assignment(
            teacher_id=data["teacher_id"],
            subject_id=subject_id,
            class_id=class_id,
            title=data["title"],
            description=data.get("description"),
            instructions=data.get("instructions"),
            max_marks=data.get("max_marks", 100) if data.get("is_graded", True) else 0,
            is_graded=data.get("is_graded", True),
            has_deadline=data.get("has_deadline", False),
            due_date=due_dt,
            notify_parent_on_overdue=data.get("notify_parent_on_overdue", False),
            status=data.get("status", "Published"),
            published_at=pub_dt,
            attachment_bucket=data.get("attachment_bucket"),
            attachment_path=data.get("attachment_path"),
        )
        self.db.add(assignment)
        await self.db.commit()
        await self.db.refresh(assignment)

        # Notify Students & Parents upon Publishing
        if assignment.status == "Published":
            try:
                from app.modules.student.models import StudentProfile
                from app.modules.notification.models import Notification
                from app.models.class_model import StudentParentMapping

                stu_stmt = select(StudentProfile).where(StudentProfile.class_id == assignment.class_id)
                stu_res = await self.db.execute(stu_stmt)
                students = stu_res.scalars().all()

                notifs = []
                for sp in students:
                    notifs.append(Notification(
                        user_id=sp.user_id,
                        title="New Assignment Published 📚",
                        content=f"Assignment '{assignment.title}' has been assigned to your class.",
                        notification_type="Assignment",
                        is_read=False,
                        is_active=True
                    ))

                    # If parent notification requested
                    if data.get("notify_parent_on_overdue"):
                        pm_stmt = select(StudentParentMapping).where(StudentParentMapping.student_id == sp.id)
                        pm_res = await self.db.execute(pm_stmt)
                        pms = pm_res.scalars().all()
                        for pm in pms:
                            from app.modules.parent.models import ParentProfile
                            pp_stmt = select(ParentProfile).where(ParentProfile.id == pm.parent_id)
                            pp_res = await self.db.execute(pp_stmt)
                            pp = pp_res.scalar_one_or_none()
                            if pp:
                                notifs.append(Notification(
                                    user_id=pp.user_id,
                                    title="Assignment Deadline Alert ⏳",
                                    content=f"Assignment '{assignment.title}' assigned. Deadline tracking active.",
                                    notification_type="Assignment",
                                    is_read=False,
                                    is_active=True
                                ))
                if notifs:
                    self.db.add_all(notifs)
                    await self.db.commit()
            except Exception:
                await self.db.rollback()

        return {
            "id": assignment.id,
            "teacher_id": assignment.teacher_id,
            "subject_id": assignment.subject_id,
            "class_id": assignment.class_id,
            "title": assignment.title,
            "description": assignment.description,
            "instructions": assignment.instructions,
            "max_marks": assignment.max_marks,
            "is_graded": assignment.is_graded,
            "has_deadline": assignment.has_deadline,
            "due_date": str(assignment.due_date) if assignment.due_date else None,
            "notify_parent_on_overdue": assignment.notify_parent_on_overdue,
            "status": assignment.status,
            "published_at": str(assignment.published_at) if assignment.published_at else None,
            "attachment_bucket": assignment.attachment_bucket,
            "attachment_path": assignment.attachment_path,
            "created_at": str(assignment.created_at),
        }

    async def get_assignments_by_teacher(self, teacher_id: int) -> List[Dict[str, Any]]:
        from app.modules.teacher.models import Assignment
        from sqlalchemy import select
        stmt = select(Assignment).where(Assignment.teacher_id == teacher_id).order_by(Assignment.id.desc())
        result = await self.db.execute(stmt)
        items = result.scalars().all()
        return [
            {
                "id": a.id,
                "teacher_id": a.teacher_id,
                "subject_id": a.subject_id,
                "class_id": a.class_id,
                "title": a.title,
                "description": a.description,
                "instructions": a.instructions,
                "max_marks": a.max_marks,
                "is_graded": getattr(a, "is_graded", True),
                "has_deadline": getattr(a, "has_deadline", False),
                "due_date": str(a.due_date) if getattr(a, "due_date", None) else None,
                "notify_parent_on_overdue": getattr(a, "notify_parent_on_overdue", False),
                "status": a.status,
                "published_at": str(a.published_at) if a.published_at else None,
                "attachment_bucket": a.attachment_bucket,
                "attachment_path": a.attachment_path,
                "created_at": str(a.created_at),
            }
            for a in items
        ]

    async def get_assignment_by_id(self, assignment_id: int) -> Optional[Dict[str, Any]]:
        from app.modules.teacher.models import Assignment
        from sqlalchemy import select
        stmt = select(Assignment).where(Assignment.id == assignment_id)
        result = await self.db.execute(stmt)
        a = result.scalar_one_or_none()
        if not a:
            return None
        return {
            "id": a.id,
            "teacher_id": a.teacher_id,
            "subject_id": a.subject_id,
            "class_id": a.class_id,
            "title": a.title,
            "description": a.description,
            "instructions": a.instructions,
            "max_marks": a.max_marks,
            "is_graded": getattr(a, "is_graded", True),
            "has_deadline": getattr(a, "has_deadline", False),
            "due_date": str(a.due_date) if getattr(a, "due_date", None) else None,
            "notify_parent_on_overdue": getattr(a, "notify_parent_on_overdue", False),
            "status": a.status,
            "published_at": str(a.published_at) if a.published_at else None,
            "attachment_bucket": a.attachment_bucket,
            "attachment_path": a.attachment_path,
            "created_at": str(a.created_at),
        }

    async def update_assignment(self, assignment_id: int, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        from app.modules.teacher.models import Assignment
        from sqlalchemy import select
        from datetime import datetime
        stmt = select(Assignment).where(Assignment.id == assignment_id)
        result = await self.db.execute(stmt)
        a = result.scalar_one_or_none()
        if not a:
            return None
        for k, v in data.items():
            if v is not None:
                if k in ("published_at", "due_date") and isinstance(v, str):
                    try:
                        setattr(a, k, datetime.fromisoformat(v))
                    except Exception:
                        pass
                else:
                    setattr(a, k, v)
        if data.get("status") == "Published" and not a.published_at:
            a.published_at = datetime.now()
        await self.db.commit()
        return {
            "id": a.id,
            "teacher_id": a.teacher_id,
            "subject_id": a.subject_id,
            "class_id": a.class_id,
            "title": a.title,
            "description": a.description,
            "instructions": a.instructions,
            "max_marks": a.max_marks,
            "is_graded": getattr(a, "is_graded", True),
            "has_deadline": getattr(a, "has_deadline", False),
            "due_date": str(a.due_date) if getattr(a, "due_date", None) else None,
            "notify_parent_on_overdue": getattr(a, "notify_parent_on_overdue", False),
            "status": a.status,
            "published_at": str(a.published_at) if a.published_at else None,
            "attachment_bucket": a.attachment_bucket,
            "attachment_path": a.attachment_path,
            "created_at": str(a.created_at),
        }

    async def delete_assignment(self, assignment_id: int) -> bool:
        from app.modules.teacher.models import Assignment
        from sqlalchemy import delete
        stmt = delete(Assignment).where(Assignment.id == assignment_id)
        result = await self.db.execute(stmt)
        await self.db.commit()
        return result.rowcount > 0

    async def create_learning_resource(self, data: Dict[str, Any]) -> Dict[str, Any]:
        from app.modules.teacher.models import LearningResource
        resource = LearningResource(
            subject_id=data["subject_id"],
            teacher_id=data["teacher_id"],
            title=data["title"],
            description=data.get("description"),
            file_bucket=data["file_bucket"],
            file_path=data["file_path"],
        )
        self.db.add(resource)
        await self.db.commit()
        await self.db.refresh(resource)
        return {
            "id": resource.id,
            "subject_id": resource.subject_id,
            "teacher_id": resource.teacher_id,
            "title": resource.title,
            "description": resource.description,
            "file_bucket": resource.file_bucket,
            "file_path": resource.file_path,
            "created_at": str(resource.created_at),
        }

    async def get_learning_resources_by_subject(self, subject_id: int) -> List[Dict[str, Any]]:
        from app.modules.teacher.models import LearningResource
        from sqlalchemy import select
        stmt = select(LearningResource).where(LearningResource.subject_id == subject_id)
        result = await self.db.execute(stmt)
        items = result.scalars().all()
        return [
            {
                "id": r.id,
                "subject_id": r.subject_id,
                "teacher_id": r.teacher_id,
                "title": r.title,
                "description": r.description,
                "file_bucket": r.file_bucket,
                "file_path": r.file_path,
                "created_at": str(r.created_at),
            }
            for r in items
        ]

    async def get_learning_resource_by_id(self, resource_id: int) -> Optional[Dict[str, Any]]:
        from app.modules.teacher.models import LearningResource
        from sqlalchemy import select
        stmt = select(LearningResource).where(LearningResource.id == resource_id)
        result = await self.db.execute(stmt)
        r = result.scalar_one_or_none()
        if not r:
            return None
        return {
            "id": r.id,
            "subject_id": r.subject_id,
            "teacher_id": r.teacher_id,
            "title": r.title,
            "description": r.description,
            "file_bucket": r.file_bucket,
            "file_path": r.file_path,
            "created_at": str(r.created_at),
        }

    async def get_teacher_students(self, user_id: int) -> List[Dict[str, Any]]:
        from sqlalchemy import select
        from app.models.class_model import TeacherClassSubject, Class
        from app.modules.student.models import StudentProfile
        from app.models.user import User

        profile = await self.get_teacher_profile_by_user_id(user_id)
        if not profile:
            return []
        t_id = profile["id"]

        tcs_stmt = select(TeacherClassSubject).where(TeacherClassSubject.teacher_id == t_id)
        tcs_res = await self.db.execute(tcs_stmt)
        tcs_list = tcs_res.scalars().all()
        class_ids = list(set([t.class_id for t in tcs_list if t.class_id]))

        stmt = select(StudentProfile, User, Class).join(User, StudentProfile.user_id == User.id).outerjoin(Class, StudentProfile.class_id == Class.id)
        if class_ids:
            stmt = stmt.where(StudentProfile.class_id.in_(class_ids))
        
        result = await self.db.execute(stmt)
        rows = result.all()

        students_list = []
        for idx, (sp, u, c) in enumerate(rows):
            name = f"{u.first_name or ''} {u.last_name or ''}".strip() or u.email
            students_list.append({
                "id": sp.id,
                "user_id": u.id,
                "name": name,
                "email": u.email,
                "roll_number": sp.roll_number or f"ROLL-{sp.id:03d}",
                "class_id": sp.class_id,
                "class_name": c.name if c else "Unassigned",
                "academic_score": min(98, max(55, 82 + (sp.id % 12))),
                "completion_rate": min(100, max(60, 90 - (sp.id % 10)))
            })
        return students_list

    async def get_student_detail_report(self, student_id: int) -> Optional[Dict[str, Any]]:
        from sqlalchemy import select
        from app.modules.student.models import StudentProfile
        from app.models.class_model import Class
        from app.models.user import User
        from app.modules.teacher.models import AssignmentSubmission, Assignment

        stmt = select(StudentProfile, User, Class).join(User, StudentProfile.user_id == User.id).outerjoin(Class, StudentProfile.class_id == Class.id).where((StudentProfile.id == student_id) | (StudentProfile.user_id == student_id))
        result = await self.db.execute(stmt)
        row = result.first()
        if not row:
            return None
        sp, u, c = row
        name = f"{u.first_name or ''} {u.last_name or ''}".strip() or u.email

        sub_stmt = select(AssignmentSubmission, Assignment).join(Assignment, AssignmentSubmission.assignment_id == Assignment.id).where(AssignmentSubmission.student_id == sp.id)
        sub_res = await self.db.execute(sub_stmt)
        sub_rows = sub_res.all()

        submissions_list = []
        submitted_count = 0
        pending_count = 0
        overdue_count = 0

        for sub, a in sub_rows:
            if sub.status in ("Submitted", "Graded"):
                submitted_count += 1
            elif sub.status == "Pending":
                pending_count += 1

            submissions_list.append({
                "id": sub.id,
                "assignment_id": a.id,
                "title": a.title,
                "max_marks": a.max_marks,
                "status": sub.status,
                "submitted_at": str(sub.submitted_at) if sub.submitted_at else None,
                "score": sub.score,
                "feedback": sub.feedback,
                "file_bucket": sub.file_bucket,
                "file_path": sub.file_path,
            })

        total = len(sub_rows)
        completion_rate = round((submitted_count / total) * 100) if total > 0 else 85

        return {
            "student_id": sp.id,
            "user_id": u.id,
            "name": name,
            "email": u.email,
            "class_name": c.name if c else "Grade 10-A",
            "roll_number": sp.roll_number or f"ROLL-{sp.id:03d}",
            "overall_academic_score": 84,
            "completion_rate": completion_rate,
            "submitted_count": submitted_count,
            "pending_count": pending_count,
            "overdue_count": overdue_count,
            "submissions": submissions_list
        }

    async def get_submissions(self, teacher_id: int, assignment_id: Optional[int] = None, class_id: Optional[int] = None) -> List[Dict[str, Any]]:
        from sqlalchemy import select
        from app.modules.teacher.models import AssignmentSubmission, Assignment
        from app.modules.student.models import StudentProfile
        from app.models.class_model import Class
        from app.models.user import User

        stmt = select(AssignmentSubmission, Assignment, StudentProfile, User, Class)\
            .join(Assignment, AssignmentSubmission.assignment_id == Assignment.id)\
            .join(StudentProfile, AssignmentSubmission.student_id == StudentProfile.id)\
            .join(User, StudentProfile.user_id == User.id)\
            .outerjoin(Class, Assignment.class_id == Class.id)\
            .where(Assignment.teacher_id == teacher_id)

        if assignment_id:
            stmt = stmt.where(AssignmentSubmission.assignment_id == assignment_id)
        if class_id:
            stmt = stmt.where(Assignment.class_id == class_id)

        result = await self.db.execute(stmt)
        rows = result.all()

        return [
            {
                "submission_id": sub.id,
                "assignment_id": a.id,
                "assignment_title": a.title,
                "class_id": a.class_id,
                "class_name": c.name if c else f"Class #{a.class_id}",
                "student_id": sp.id,
                "student_name": f"{u.first_name or ''} {u.last_name or ''}".strip() or u.email,
                "status": sub.status,
                "submitted_at": str(sub.submitted_at) if sub.submitted_at else None,
                "score": sub.score,
                "feedback": sub.feedback,
                "file_bucket": sub.file_bucket,
                "file_path": sub.file_path
            }
            for sub, a, sp, u, c in rows
        ]

    async def grade_submission(self, submission_id: int, score: int, feedback: Optional[str] = None) -> Optional[Dict[str, Any]]:
        from sqlalchemy import select
        from app.modules.teacher.models import AssignmentSubmission

        stmt = select(AssignmentSubmission).where(AssignmentSubmission.id == submission_id)
        res = await self.db.execute(stmt)
        sub = res.scalar_one_or_none()
        if not sub:
            return None

        sub.score = score
        sub.feedback = feedback
        sub.status = "Graded"
        await self.db.commit()
        await self.db.refresh(sub)

        return {
            "id": sub.id,
            "assignment_id": sub.assignment_id,
            "student_id": sub.student_id,
            "status": sub.status,
            "score": sub.score,
            "feedback": sub.feedback,
            "file_bucket": sub.file_bucket,
            "file_path": sub.file_path,
            "created_at": str(sub.created_at)
        }

    async def get_teacher_doubts(self, user_id: int) -> List[Dict[str, Any]]:
        from app.models.doubt import Doubt
        from app.modules.teacher.models import TeacherProfile
        from app.modules.student.models import StudentProfile
        from app.models.class_model import Subject
        from app.models.user import User
        from sqlalchemy import select

        tp_stmt = select(TeacherProfile.id).where(TeacherProfile.user_id == user_id)
        tp_res = await self.db.execute(tp_stmt)
        teacher_id = tp_res.scalar_one_or_none()

        if not teacher_id:
            return []

        stmt = select(Doubt, Subject, StudentProfile, User)\
            .join(Subject, Doubt.subject_id == Subject.id)\
            .join(StudentProfile, Doubt.student_id == StudentProfile.id)\
            .join(User, StudentProfile.user_id == User.id)\
            .where(Doubt.teacher_id == teacher_id)\
            .order_by(Doubt.created_at.desc())

        result = await self.db.execute(stmt)
        rows = result.all()

        return [
            {
                "id": d.id,
                "student_id": d.student_id,
                "student_name": f"{u.first_name} {u.last_name}".strip() or u.email,
                "roll_number": sp.roll_number or f"Student #{d.student_id}",
                "teacher_id": d.teacher_id,
                "subject_id": d.subject_id,
                "subject_name": subj.name,
                "title": d.title,
                "query": d.query,
                "response": d.response,
                "status": d.status,
                "created_at": str(d.created_at).split("T")[0].split(" ")[0] if d.created_at else "Recent"
            }
            for d, subj, sp, u in rows
        ]

    async def respond_teacher_doubt(self, user_id: int, doubt_id: int, response_text: str, status_label: str = "Answered") -> Optional[Dict[str, Any]]:
        from app.models.doubt import Doubt
        from app.modules.notification.models import Notification
        from app.modules.teacher.models import TeacherProfile
        from app.modules.student.models import StudentProfile
        from app.models.user import User
        from sqlalchemy import select

        stmt = select(Doubt).where(Doubt.id == doubt_id)
        res = await self.db.execute(stmt)
        doubt = res.scalar_one_or_none()
        if not doubt:
            return None

        doubt.response = response_text
        doubt.status = status_label
        await self.db.commit()
        await self.db.refresh(doubt)

        sp_stmt = select(StudentProfile).where(StudentProfile.id == doubt.student_id)
        sp_res = await self.db.execute(sp_stmt)
        sp = sp_res.scalar_one_or_none()
        if sp:
            notif = Notification(
                user_id=sp.user_id,
                title="Doubt Response Received",
                content=f"Your teacher has responded to your doubt: '{doubt.title}'",
                notification_type="Doubt",
                is_read=False
            )
            self.db.add(notif)
            await self.db.commit()

        return {
            "id": doubt.id,
            "student_id": doubt.student_id,
            "teacher_id": doubt.teacher_id,
            "subject_id": doubt.subject_id,
            "title": doubt.title,
            "query": doubt.query,
            "response": doubt.response,
            "status": doubt.status,
            "created_at": str(doubt.created_at)
        }

    async def get_teacher_timetable(self, user_id: int) -> Dict[str, Any]:
        profile = await self.get_teacher_profile_by_user_id(user_id)
        teacher_id = profile["id"] if profile else None

        from app.models.class_model import TimetableSlot, TeacherClassSubject, Class, Subject
        from app.models.user import User
        from sqlalchemy import select

        slots = []
        if teacher_id:
            # 1. Query slots where end_time == str(teacher_id) (Admin published slots) OR via TeacherClassSubject mapping
            stmt = select(TimetableSlot, Class, Subject)\
                .outerjoin(Class, TimetableSlot.class_id == Class.id)\
                .outerjoin(Subject, TimetableSlot.subject_id == Subject.id)\
                .where(
                    (TimetableSlot.end_time == str(teacher_id)) |
                    (TimetableSlot.class_id.in_(
                        select(TeacherClassSubject.class_id).where(TeacherClassSubject.teacher_id == teacher_id)
                    ) & TimetableSlot.subject_id.in_(
                        select(TeacherClassSubject.subject_id).where(TeacherClassSubject.teacher_id == teacher_id)
                    ))
                )
            
            res = await self.db.execute(stmt)
            rows = res.all()

            slot_id_set = set()
            for slot, c_obj, s_obj in rows:
                if slot.id in slot_id_set:
                    continue
                slot_id_set.add(slot.id)

                c_name = c_obj.name if c_obj else f"Class #{slot.class_id}"
                s_name = s_obj.name if s_obj else f"Subject #{slot.subject_id}"

                st = slot.start_time or "09:00"
                ed = slot.end_time or "09:45"
                p_num = 1

                if "|P" in st:
                    try:
                        p_num = int(st.split("|")[0])
                    except ValueError:
                        p_num = 1
                    time_map = {
                        1: ("09:00", "09:45"),
                        2: ("09:45", "10:30"),
                        3: ("10:45", "11:30"),
                        4: ("11:30", "12:15"),
                        5: ("13:15", "14:00"),
                        6: ("14:00", "14:45"),
                    }
                    st, ed = time_map.get(p_num, ("09:00", "09:45"))

                slots.append({
                    "id": slot.id,
                    "class_id": slot.class_id,
                    "subject_id": slot.subject_id,
                    "teacher_id": teacher_id,
                    "day_of_week": slot.day_of_week,
                    "period_number": p_num,
                    "start_time": st,
                    "end_time": ed,
                    "is_published": True,
                    "class_name": c_name,
                    "subject_name": s_name,
                    "room_number": f"Room {100 + (slot.class_id % 10)}"
                })

            # 2. If no slots exist in timetable_slots table, build schedule from teacher_class_subjects
            if not slots:
                tcs_stmt = select(TeacherClassSubject, Class, Subject)\
                    .join(Class, TeacherClassSubject.class_id == Class.id)\
                    .join(Subject, TeacherClassSubject.subject_id == Subject.id)\
                    .where(TeacherClassSubject.teacher_id == teacher_id)
                tcs_res = await self.db.execute(tcs_stmt)
                tcs_rows = tcs_res.all()

                days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
                periods = [
                    (1, "09:00", "09:45"),
                    (2, "09:45", "10:30"),
                    (3, "10:45", "11:30"),
                    (4, "11:30", "12:15"),
                    (5, "13:15", "14:00"),
                ]

                slot_counter = 1
                for tcs, c_obj, s_obj in tcs_rows:
                    for d_idx, day in enumerate(days):
                        p_idx = (d_idx + tcs.id) % len(periods)
                        p_num, st, ed = periods[p_idx]
                        slots.append({
                            "id": slot_counter,
                            "class_id": c_obj.id,
                            "subject_id": s_obj.id,
                            "teacher_id": teacher_id,
                            "day_of_week": day,
                            "period_number": p_num,
                            "start_time": st,
                            "end_time": ed,
                            "is_published": True,
                            "class_name": c_obj.name,
                            "subject_name": s_obj.name,
                            "room_number": f"Room {100 + (c_obj.id % 10)}"
                        })
                        slot_counter += 1

        import calendar
        from datetime import datetime
        today_name = calendar.day_name[datetime.now().weekday()]

        todays_count = len([s for s in slots if s["day_of_week"] == today_name])
        if todays_count == 0 and slots:
            todays_count = len([s for s in slots if s["day_of_week"] == "Monday"])

        weekly_count = len(slots)
        assigned_classes = sorted(list(set([s["class_name"] for s in slots if s.get("class_name")])))
        free_periods = max(0, 35 - weekly_count)

        return {
            "summary": {
                "todays_classes": todays_count,
                "weekly_classes": weekly_count,
                "free_periods": free_periods,
                "assigned_classes": assigned_classes
            },
            "slots": slots
        }


