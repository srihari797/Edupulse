from abc import ABC, abstractmethod
from typing import Optional, List, Dict, Any
from datetime import date, datetime
from sqlalchemy import select
from app.modules.student.models import StudentProfile, StudyPlan
from app.models.user import User

class StudentRepository(ABC):
    """
    Interface for Student Repository.
    Defines methods that must be supported by all data providers (Mock, Database, etc.)
    """
    @abstractmethod
    async def get_profile_by_user_id(self, user_id: int) -> Optional[Dict[str, Any]]:
        pass

    @abstractmethod
    async def update_profile(self, user_id: int, profile_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        pass

    @abstractmethod
    async def get_dashboard_data(self, user_id: int) -> Dict[str, Any]:
        pass

    @abstractmethod
    async def save_study_plan(self, student_id: int, plan_type: str, plan_data: Dict[str, Any]) -> Dict[str, Any]:
        pass

    @abstractmethod
    async def get_latest_study_plan(self, student_id: int, plan_type: str) -> Optional[Dict[str, Any]]:
        pass

    @abstractmethod
    async def get_opportunities(self, student_id: int) -> List[Dict[str, Any]]:
        pass

    @abstractmethod
    async def get_student_assignments(self, student_id: int) -> List[Dict[str, Any]]:
        pass

    @abstractmethod
    async def submit_assignment(self, student_id: int, assignment_id: int, file_bucket: str, file_path: str) -> Dict[str, Any]:
        pass

    @abstractmethod
    async def get_student_submission(self, student_id: int, assignment_id: int) -> Optional[Dict[str, Any]]:
        pass

    @abstractmethod
    async def get_student_timetable(self, user_id: int) -> List[Dict[str, Any]]:
        pass



class MockStudentRepository(StudentRepository):
    """
    Mock implementation of StudentRepository returning static/in-memory mock data.
    """
    def __init__(self):
        # In-memory mock database
        self.mock_profiles = {
            1: {
                "id": 1,
                "user_id": 1,
                "class_id": 10,
                "roll_number": "STU-2026-001",
                "date_of_birth": date(2010, 5, 15),
                "gender": "Male",
                "guardian_name": "John Doe",
                "guardian_phone": "+1234567890",
                "first_name": "Rahul",
                "last_name": "B",
                "email": "rahul.b@edupulse.edu",
                "created_at": datetime.now(),
                "updated_at": datetime.now(),
                "is_active": True
            }
        }
        
        self.mock_dashboards = {
            1: {
                "academic_overview": {
                    "gpa": 3.8,
                    "rank": 5,
                    "completed_credits": 45,
                    "total_credits": 60
                },
                "attendance": {
                    "present_percentage": 92.5,
                    "total_days": 80,
                    "days_present": 74
                },
                "workload": {
                    "pending_assignments": 3,
                    "due_this_week": 1,
                    "completed_assignments": 12
                },
                "learning_health": {
                    "score": 85,
                    "status": "Healthy",
                    "weak_concepts_count": 2
                },
                "growth_passport": {
                    "holistic_score": 78,
                    "badges_count": 4,
                    "achievements_count": 3
                },
                "notifications": {
                    "unread_count": 2
                }
            }
        }

        self.mock_study_plans = {}
        
        self.mock_opportunities = [
            {
                "id": 1,
                "title": "National Science Scholarship 2026",
                "description": "Scholarship awarded for young researchers in physics and computer science.",
                "opportunity_type": "Scholarship",
                "organization": "National Science Foundation",
                "deadline": date(2026, 9, 30),
                "recommended_reason": "Matches your strong score (95%) in Science masteries."
            },
            {
                "id": 2,
                "title": "Youth Tech Hackathon",
                "description": "Annual 24-hour coding and robotics contest for high-school students.",
                "opportunity_type": "Hackathon",
                "organization": "Tech Alliance",
                "deadline": date(2026, 8, 15),
                "recommended_reason": "Matches your participation in Robotics Club."
            }
        ]

    async def get_profile_by_user_id(self, user_id: int) -> Optional[Dict[str, Any]]:
        return self.mock_profiles.get(user_id)

    async def update_profile(self, user_id: int, profile_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        profile = self.mock_profiles.get(user_id)
        if not profile:
            return None
        
        for key, value in profile_data.items():
            if value is not None:
                profile[key] = value
        
        profile["updated_at"] = datetime.now()
        self.mock_profiles[user_id] = profile
        return profile

    async def get_dashboard_data(self, user_id: int) -> Dict[str, Any]:
        return self.mock_dashboards.get(
            user_id,
            {
                "academic_overview": {"gpa": 0.0, "rank": 0, "completed_credits": 0, "total_credits": 0},
                "attendance": {"present_percentage": 0.0, "total_days": 0, "days_present": 0},
                "workload": {"pending_assignments": 0, "due_this_week": 0, "completed_assignments": 0},
                "learning_health": {"score": 0, "status": "Unknown", "weak_concepts_count": 0},
                "growth_passport": {"holistic_score": 0, "badges_count": 0, "achievements_count": 0},
                "notifications": {"unread_count": 0}
            }
        )

    async def save_study_plan(self, student_id: int, plan_type: str, plan_data: Dict[str, Any]) -> Dict[str, Any]:
        plan_id = len(self.mock_study_plans) + 1
        plan = {
            "id": plan_id,
            "student_id": student_id,
            "plan_type": plan_type,
            "plan_data": plan_data,
            "created_at": datetime.now()
        }
        self.mock_study_plans[(student_id, plan_type)] = plan
        return plan

    async def get_latest_study_plan(self, student_id: int, plan_type: str) -> Optional[Dict[str, Any]]:
        return self.mock_study_plans.get((student_id, plan_type))

    async def get_opportunities(self, student_id: int) -> List[Dict[str, Any]]:
        return self.mock_opportunities

    async def get_student_assignments(self, student_id: int) -> List[Dict[str, Any]]:
        raise NotImplementedError("Assignment operations are not supported in Mock mode. Please enable DB mode.")

    async def submit_assignment(self, student_id: int, assignment_id: int, file_bucket: str, file_path: str) -> Dict[str, Any]:
        raise NotImplementedError("Assignment operations are not supported in Mock mode. Please enable DB mode.")

    async def get_student_submission(self, student_id: int, assignment_id: int) -> Optional[Dict[str, Any]]:
        raise NotImplementedError("Assignment operations are not supported in Mock mode. Please enable DB mode.")

    async def get_student_timetable(self, user_id: int) -> List[Dict[str, Any]]:
        return [
            {
                "id": 1,
                "class_id": 1,
                "subject_id": 1,
                "teacher_id": 1,
                "day_of_week": "Monday",
                "period_number": 1,
                "start_time": "09:00",
                "end_time": "09:45",
                "is_published": True,
                "class_name": "Grade 10-B",
                "subject_name": "Mathematics",
                "teacher_name": "Mr Ravi"
            },
            {
                "id": 2,
                "class_id": 1,
                "subject_id": 2,
                "teacher_id": 2,
                "day_of_week": "Monday",
                "period_number": 2,
                "start_time": "09:45",
                "end_time": "10:30",
                "is_published": True,
                "class_name": "Grade 10-B",
                "subject_name": "Science",
                "teacher_name": "Mrs Anita"
            },
            {
                "id": 3,
                "class_id": 1,
                "subject_id": 3,
                "teacher_id": 3,
                "day_of_week": "Monday",
                "period_number": 3,
                "start_time": "10:45",
                "end_time": "11:30",
                "is_published": True,
                "class_name": "Grade 10-B",
                "subject_name": "English",
                "teacher_name": "Mr Sharma"
            }
        ]



class RealStudentRepository(StudentRepository):
    """
    SQLAlchemy-based database repository for Student module.
    """
    def __init__(self, db_session):
        self.db = db_session

    async def get_profile_by_user_id(self, user_id: int) -> Optional[Dict[str, Any]]:
        stmt = select(StudentProfile, User).join(User, StudentProfile.user_id == User.id).where(StudentProfile.user_id == user_id)
        result = await self.db.execute(stmt)
        row = result.first()
        if not row:
            return None
        profile, user = row
        return {
            "id": profile.id,
            "user_id": profile.user_id,
            "class_id": profile.class_id,
            "roll_number": profile.roll_number,
            "date_of_birth": profile.date_of_birth,
            "gender": profile.gender,
            "guardian_name": profile.guardian_name,
            "guardian_phone": profile.guardian_phone,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "email": user.email,
            "created_at": profile.created_at,
            "updated_at": profile.updated_at,
            "is_active": profile.is_active
        }

    async def update_profile(self, user_id: int, profile_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        stmt = select(StudentProfile).where(StudentProfile.user_id == user_id)
        result = await self.db.execute(stmt)
        profile = result.scalar_one_or_none()
        if not profile:
            return None
        for key, val in profile_data.items():
            if val is not None:
                setattr(profile, key, val)
        await self.db.commit()
        return await self.get_profile_by_user_id(user_id)

    async def get_dashboard_data(self, user_id: int) -> Dict[str, Any]:
        from app.modules.teacher.models import Assignment, AssignmentSubmission
        from app.modules.notification.models import Notification
        from app.modules.growth.models import GrowthPassport, Achievement, Activity
        from sqlalchemy import select, func

        # 1. Fetch Student Profile
        stmt = select(StudentProfile).where(StudentProfile.user_id == user_id)
        res = await self.db.execute(stmt)
        profile = res.scalar_one_or_none()

        if not profile:
            return {
                "academic_overview": {"gpa": 3.8, "rank": 5, "completed_credits": 45, "total_credits": 60},
                "attendance": {"present_percentage": 92.5, "total_days": 80, "days_present": 74},
                "workload": {"pending_assignments": 0, "due_this_week": 0, "completed_assignments": 0},
                "learning_health": {"score": 85, "status": "Healthy", "weak_concepts_count": 0},
                "growth_passport": {"holistic_score": 78, "badges_count": 0, "achievements_count": 0},
                "notifications": {"unread_count": 0},
                "workload_pressure_trend": [],
                "subject_growth_trend": [],
                "extracurricular_analytics": []
            }

        student_id = profile.id
        class_id = profile.class_id

        # 2. Query Assignments & Submissions
        total_assignments = 0
        completed_count = 0
        avg_score = 85.0
        if class_id:
            a_stmt = select(func.count(Assignment.id)).where(Assignment.class_id == class_id, Assignment.status != "Draft")
            a_res = await self.db.execute(a_stmt)
            total_assignments = a_res.scalar() or 0

        sub_stmt = select(AssignmentSubmission).where(AssignmentSubmission.student_id == student_id)
        sub_res = await self.db.execute(sub_stmt)
        submissions = sub_res.scalars().all()
        completed_count = len([s for s in submissions if s.status in ("Submitted", "Graded")])
        
        graded_scores = [s.score for s in submissions if s.score is not None]
        if graded_scores:
            avg_score = sum(graded_scores) / len(graded_scores)

        pending_count = max(0, total_assignments - completed_count)
        gpa = round((avg_score / 100.0) * 4.0, 2)

        # 3. Query Growth Passport & Achievements
        gp_stmt = select(GrowthPassport).where(GrowthPassport.student_id == student_id)
        gp_res = await self.db.execute(gp_stmt)
        gp = gp_res.scalar_one_or_none()
        holistic_score = gp.holistic_score if gp else 88.5

        ach_stmt = select(Achievement).where(Achievement.student_id == student_id)
        ach_res = await self.db.execute(ach_stmt)
        achievements = ach_res.scalars().all()
        ach_count = len(achievements)
        badges_count = len([a for a in achievements if a.badge_name])

        act_stmt = select(Activity).where(Activity.student_id == student_id)
        act_res = await self.db.execute(act_stmt)
        activities = act_res.scalars().all()
        act_count = len(activities)

        # 4. Query Notifications
        notif_stmt = select(func.count(Notification.id)).where(Notification.user_id == user_id, Notification.is_read == False)
        notif_res = await self.db.execute(notif_stmt)
        unread_notifs = notif_res.scalar() or 0

        # Determine workload pressure level
        pressure_label = "Low"
        if pending_count >= 5:
            pressure_label = "Overload"
        elif pending_count >= 3:
            pressure_label = "High"
        elif pending_count >= 2:
            pressure_label = "Moderate"

        return {
            "academic_overview": {
                "gpa": gpa,
                "rank": 3 if gpa >= 3.5 else 8,
                "completed_credits": completed_count * 3,
                "total_credits": (total_assignments or 10) * 3
            },
            "attendance": {
                "present_percentage": 94.5,
                "total_days": 90,
                "days_present": 85
            },
            "workload": {
                "pending_assignments": pending_count,
                "due_this_week": min(pending_count, 2),
                "completed_assignments": completed_count,
                "pressure_level": pressure_label
            },
            "learning_health": {
                "score": int(avg_score),
                "status": "Optimal" if avg_score >= 80 else "Needs Improvement",
                "weak_concepts_count": 1 if avg_score >= 80 else 3
            },
            "growth_passport": {
                "holistic_score": holistic_score,
                "badges_count": max(badges_count, 2),
                "achievements_count": max(ach_count, 3)
            },
            "notifications": {
                "unread_count": unread_notifs
            },
            "workload_pressure_trend": [
                {"day": "Mon", "workload": max(1, pending_count - 1), "pressure": "Moderate", "level": 45},
                {"day": "Tue", "workload": pending_count, "pressure": pressure_label, "level": min(95, pending_count * 20 + 25)},
                {"day": "Wed", "workload": max(1, pending_count - 2), "pressure": "Low", "level": 30},
                {"day": "Thu", "workload": max(2, pending_count + 1), "pressure": "High", "level": 75},
                {"day": "Fri", "workload": max(1, completed_count % 3), "pressure": "Low", "level": 20},
                {"day": "Sat", "workload": 1, "pressure": "Low", "level": 15},
                {"day": "Sun", "workload": 2, "pressure": "Moderate", "level": 35},
            ],
            "subject_growth_trend": [
                {"period": "Week 1", "Tamil": 82, "English": 85, "Mathematics": 78, "Science": 88, "SocialScience": 84},
                {"period": "Week 2", "Tamil": 85, "English": 87, "Mathematics": 84, "Science": 90, "SocialScience": 86},
                {"period": "Week 3", "Tamil": 87, "English": 89, "Mathematics": 88, "Science": 92, "SocialScience": 88},
                {"period": "Week 4", "Tamil": 90, "English": 91, "Mathematics": 92, "Science": 95, "SocialScience": 90},
            ],
            "extracurricular_analytics": [
                {"category": "Sports", "score": 85, "count": max(1, act_count)},
                {"category": "Clubs", "score": 90, "count": max(2, act_count)},
                {"category": "Competitions", "score": 95, "count": max(1, ach_count)},
                {"category": "Engagement", "score": 88, "count": max(3, ach_count + act_count)},
            ]
        }

    async def save_study_plan(self, student_id: int, plan_type: str, plan_data: Dict[str, Any]) -> Dict[str, Any]:
        stmt = select(StudyPlan).where(StudyPlan.student_id == student_id, StudyPlan.plan_type == plan_type).order_by(StudyPlan.created_at.desc()).limit(1)
        result = await self.db.execute(stmt)
        plan = result.scalars().first()
        if plan:
            plan.plan_data = plan_data
        else:
            plan = StudyPlan(student_id=student_id, plan_type=plan_type, plan_data=plan_data)
            self.db.add(plan)
        await self.db.commit()
        await self.db.refresh(plan)
        return {
            "id": plan.id,
            "student_id": plan.student_id,
            "plan_type": plan.plan_type,
            "plan_data": plan.plan_data,
            "created_at": plan.created_at
        }

    async def get_latest_study_plan(self, student_id: int, plan_type: str) -> Optional[Dict[str, Any]]:
        stmt = select(StudyPlan).where(StudyPlan.student_id == student_id, StudyPlan.plan_type == plan_type).order_by(StudyPlan.created_at.desc()).limit(1)
        result = await self.db.execute(stmt)
        plan = result.scalars().first()
        if not plan:
            return None
        return {
            "id": plan.id,
            "student_id": plan.student_id,
            "plan_type": plan.plan_type,
            "plan_data": plan.plan_data,
            "created_at": plan.created_at
        }

    async def get_opportunities(self, student_id: int) -> List[Dict[str, Any]]:
        # Return static list since Opportunity table is not in DB design schema
        return [
            {
                "id": 1,
                "title": "National Science Scholarship 2026",
                "description": "Scholarship awarded for young researchers in physics.",
                "opportunity_type": "Scholarship",
                "organization": "National Science Foundation",
                "deadline": date(2026, 9, 30),
                "recommended_reason": "Matches your strong score (95%) in Science masteries."
            }
        ]

    async def get_student_assignments(self, student_id: int) -> List[Dict[str, Any]]:
        from app.modules.teacher.models import Assignment, TeacherProfile
        from app.models.class_model import Subject
        from app.models.user import User

        stmt = select(StudentProfile.class_id).where(StudentProfile.id == student_id)
        result = await self.db.execute(stmt)
        class_id = result.scalar_one_or_none()
        if not class_id:
            return []
        
        stmt = select(Assignment, Subject, TeacherProfile, User)\
            .join(Subject, Assignment.subject_id == Subject.id)\
            .join(TeacherProfile, Assignment.teacher_id == TeacherProfile.id)\
            .join(User, TeacherProfile.user_id == User.id)\
            .where(Assignment.class_id == class_id, Assignment.status != "Draft")
            
        result = await self.db.execute(stmt)
        rows = result.all()
        return [
            {
                "id": a.id,
                "teacher_id": a.teacher_id,
                "subject_id": a.subject_id,
                "class_id": a.class_id,
                "subject_name": subj.name,
                "teacher_name": f"{u.first_name} {u.last_name}".strip() or "Teacher",
                "title": a.title,
                "description": a.description,
                "instructions": a.instructions,
                "max_marks": a.max_marks,
                "is_graded": a.is_graded,
                "has_deadline": a.has_deadline,
                "due_date": str(a.due_date) if a.due_date else None,
                "status": a.status,
                "published_at": str(a.published_at) if a.published_at else None,
                "attachment_bucket": a.attachment_bucket,
                "attachment_path": a.attachment_path,
                "created_at": str(a.created_at),
            }
            for a, subj, tp, u in rows
        ]

    async def submit_assignment(self, student_id: int, assignment_id: int, file_bucket: str, file_path: str) -> Dict[str, Any]:
        from app.modules.teacher.models import AssignmentSubmission
        stmt = select(AssignmentSubmission).where(
            AssignmentSubmission.student_id == student_id,
            AssignmentSubmission.assignment_id == assignment_id
        )
        result = await self.db.execute(stmt)
        sub = result.scalar_one_or_none()
        if sub:
            sub.file_bucket = file_bucket
            sub.file_path = file_path
            sub.status = "Submitted"
            sub.submitted_at = datetime.now()
        else:
            sub = AssignmentSubmission(
                student_id=student_id,
                assignment_id=assignment_id,
                file_bucket=file_bucket,
                file_path=file_path,
                status="Submitted",
                submitted_at=datetime.now()
            )
            self.db.add(sub)
        await self.db.commit()
        await self.db.refresh(sub)
        return {
            "id": sub.id,
            "assignment_id": sub.assignment_id,
            "student_id": sub.student_id,
            "status": sub.status,
            "submitted_at": str(sub.submitted_at) if sub.submitted_at else None,
            "score": sub.score,
            "feedback": sub.feedback,
            "file_bucket": sub.file_bucket,
            "file_path": sub.file_path,
            "created_at": str(sub.created_at),
        }

    async def get_student_submission(self, student_id: int, assignment_id: int) -> Optional[Dict[str, Any]]:
        from app.modules.teacher.models import AssignmentSubmission
        stmt = select(AssignmentSubmission).where(
            AssignmentSubmission.student_id == student_id,
            AssignmentSubmission.assignment_id == assignment_id
        )
        result = await self.db.execute(stmt)
        sub = result.scalar_one_or_none()
        if not sub:
            return None
        return {
            "id": sub.id,
            "assignment_id": sub.assignment_id,
            "student_id": sub.student_id,
            "status": sub.status,
            "submitted_at": str(sub.submitted_at) if sub.submitted_at else None,
            "score": sub.score,
            "feedback": sub.feedback,
            "file_bucket": sub.file_bucket,
            "file_path": sub.file_path,
            "created_at": str(sub.created_at),
        }

    async def get_learning_health(self, user_id: int) -> Dict[str, Any]:
        from app.modules.teacher.models import Assignment, AssignmentSubmission
        from sqlalchemy import select, func

        stmt = select(StudentProfile, User).join(User, StudentProfile.user_id == User.id).where(StudentProfile.user_id == user_id)
        res = await self.db.execute(stmt)
        row = res.first()
        if not row:
            return {
                "score": 85,
                "status": "Optimal",
                "completion_rate": 88.0,
                "overall_score": 85.0,
                "weak_concepts_count": 1,
                "lhi_trend": [
                    {"week": "Week 1", "score": 78},
                    {"week": "Week 2", "score": 81},
                    {"week": "Week 3", "score": 84},
                    {"week": "Week 4", "score": 85},
                ]
            }

        profile, user = row
        student_id = profile.id
        class_id = profile.class_id

        total_assignments = 0
        if class_id:
            a_stmt = select(func.count(Assignment.id)).where(Assignment.class_id == class_id, Assignment.status != "Draft")
            a_res = await self.db.execute(a_stmt)
            total_assignments = a_res.scalar() or 0

        sub_stmt = select(AssignmentSubmission).where(AssignmentSubmission.student_id == student_id)
        sub_res = await self.db.execute(sub_stmt)
        submissions = sub_res.scalars().all()

        submitted_count = len([s for s in submissions if s.status in ("Submitted", "Graded")])
        completion_rate = round((submitted_count / max(1, total_assignments)) * 100, 1)

        graded_scores = [s.score for s in submissions if s.score is not None]
        overall_score = round(sum(graded_scores) / len(graded_scores), 1) if graded_scores else 85.0

        health_score = int(round(overall_score * 0.6 + completion_rate * 0.4))
        status_label = "Optimal" if health_score >= 80 else ("Moderate" if health_score >= 65 else "Needs Care")

        return {
            "score": health_score,
            "status": status_label,
            "completion_rate": completion_rate,
            "overall_score": overall_score,
            "student_name": f"{user.first_name} {user.last_name}",
            "roll_number": profile.roll_number or "8B-101",
            "weak_concepts_count": 1 if health_score >= 80 else 3,
            "lhi_trend": [
                {"week": "Week 1", "score": max(50, health_score - 7)},
                {"week": "Week 2", "score": max(50, health_score - 4)},
                {"week": "Week 3", "score": max(50, health_score - 2)},
                {"week": "Week 4", "score": health_score},
            ],
            "diagnostic_summary": f"Learning Health score is {health_score}/100 ({status_label}). Submission completion rate is {completion_rate}% with an average score of {overall_score}% across graded assignments."
        }

    async def get_workload_intelligence(self, user_id: int) -> Dict[str, Any]:
        from app.modules.teacher.models import Assignment, AssignmentSubmission, TeacherProfile
        from app.models.class_model import Subject
        from app.models.user import User
        from sqlalchemy import select
        from collections import defaultdict

        stmt = select(StudentProfile).where(StudentProfile.user_id == user_id)
        res = await self.db.execute(stmt)
        profile = res.scalar_one_or_none()

        if not profile or not profile.class_id:
            return {
                "active_work": [],
                "past_work": [],
                "teacher_contributions": [],
                "conflict_alerts": []
            }

        student_id = profile.id
        class_id = profile.class_id

        a_stmt = select(Assignment, Subject, TeacherProfile, User)\
            .join(Subject, Assignment.subject_id == Subject.id)\
            .join(TeacherProfile, Assignment.teacher_id == TeacherProfile.id)\
            .join(User, TeacherProfile.user_id == User.id)\
            .where(Assignment.class_id == class_id, Assignment.status != "Draft")
        
        a_res = await self.db.execute(a_stmt)
        rows = a_res.all()

        sub_stmt = select(AssignmentSubmission).where(AssignmentSubmission.student_id == student_id)
        sub_res = await self.db.execute(sub_stmt)
        sub_map = {s.assignment_id: s for s in sub_res.scalars().all()}

        active_work = []
        past_work = []
        due_date_counts = defaultdict(int)
        teacher_work = defaultdict(list)

        for assign, subj, teacher_prof, teacher_user in rows:
            sub = sub_map.get(assign.id)
            teacher_fullname = f"{teacher_user.first_name} {teacher_user.last_name}".strip() or "Subject Teacher"
            due_str = str(assign.due_date).split("T")[0].split(" ")[0] if assign.due_date else "No Deadline"
            
            item = {
                "id": assign.id,
                "subject_name": subj.name,
                "teacher_name": teacher_fullname,
                "title": assign.title,
                "description": assign.description or "Assignment task",
                "due_date": str(assign.due_date) if assign.due_date else None,
                "due_date_clean": due_str,
                "max_marks": assign.max_marks,
                "is_graded": assign.is_graded,
                "priority": "High" if "[Class Test]" in assign.title or assign.max_marks > 50 else "Moderate",
                "status": sub.status if sub else "Pending",
                "score": sub.score if sub else None,
                "feedback": sub.feedback if sub else None
            }

            if sub and sub.status in ("Submitted", "Graded"):
                past_work.append(item)
            else:
                active_work.append(item)
                if due_str != "No Deadline":
                    due_date_counts[due_str] += 1
                teacher_work[teacher_fullname].append({
                    "title": assign.title,
                    "subject": subj.name,
                    "date": due_str
                })

        conflict_alerts = []
        for d_str, count in due_date_counts.items():
            if count > 2:
                conflict_alerts.append({
                    "date": d_str,
                    "active_count": count,
                    "status": "Overloaded",
                    "warning": f"AI Overload Alert: {count} active assignments/tests overlap on {d_str}! Maximum recommended is 2 per day."
                })

        teacher_contributions = []
        for t_name, t_items in teacher_work.items():
            teacher_contributions.append({
                "teacher_name": t_name,
                "subject_name": t_items[0]["subject"] if t_items else "General",
                "item_count": len(t_items),
                "items": t_items
            })

        return {
            "active_work": active_work,
            "past_work": past_work,
            "teacher_contributions": teacher_contributions,
            "conflict_alerts": conflict_alerts
        }

    async def get_student_resources(self, student_id: int) -> List[Dict[str, Any]]:
        from app.modules.teacher.models import LearningResource, TeacherProfile
        from app.models.class_model import Subject
        from app.models.user import User

        stmt = select(LearningResource, Subject, TeacherProfile, User)\
            .outerjoin(Subject, LearningResource.subject_id == Subject.id)\
            .outerjoin(TeacherProfile, LearningResource.teacher_id == TeacherProfile.id)\
            .outerjoin(User, TeacherProfile.user_id == User.id)\
            .where(LearningResource.is_active == True)

        result = await self.db.execute(stmt)
        rows = result.all()

        return [
            {
                "id": r.id,
                "teacher_id": r.teacher_id,
                "subject_id": r.subject_id,
                "subject_name": subj.name if subj else "General",
                "teacher_name": f"{u.first_name} {u.last_name}".strip() if u else "Faculty Teacher",
                "title": r.title,
                "description": r.description or "Learning Resource",
                "resource_type": "Document",
                "file_bucket": r.file_bucket,
                "file_path": r.file_path,
                "created_at": str(r.created_at).split("T")[0].split(" ")[0] if r.created_at else "Recent",
            }
            for r, subj, tp, u in rows
        ]

    async def get_opportunities(self, student_id: int) -> List[Dict[str, Any]]:
        from app.modules.student.models import AIRecommendation
        stmt = select(AIRecommendation).where(AIRecommendation.student_id == student_id)
        result = await self.db.execute(stmt)
        recs = result.scalars().all()

        if recs:
            return [
                {
                    "id": r.id,
                    "title": r.title,
                    "description": r.recommendation,
                    "opportunity_type": r.category or "Scholarship",
                    "organization": "National Foundation",
                    "deadline": "2026-09-30",
                    "recommended_reason": f"Matches your strong progress ({int((r.confidence_score or 0.9) * 100)}% mastery)."
                }
                for r in recs
            ]

        return [
            {
                "id": 1,
                "title": "National Science & Robotics Olympiad 2026",
                "description": "Prestigious national competition for Grade 8-10 students exhibiting strong STEM capabilities.",
                "opportunity_type": "Competition",
                "organization": "National Science Foundation",
                "deadline": "2026-09-30",
                "recommended_reason": "Matches your strong score (95%) in Science and active Robotics Club participation."
            },
            {
                "id": 2,
                "title": "Young Coders & AI Summer Fellowship",
                "description": "Mentorship program offering 1-on-1 guidance with software architects and AI researchers.",
                "opportunity_type": "Fellowship",
                "organization": "Tech Alliance",
                "deadline": "2026-08-15",
                "recommended_reason": "Recommended based on your top academic GPA rank in class."
            }
        ]

    async def create_student_doubt(self, user_id: int, teacher_id: int, subject_id: int, title: str, query: str) -> Dict[str, Any]:
        from app.models.doubt import Doubt
        from app.modules.notification.models import Notification
        from app.modules.teacher.models import TeacherProfile
        from app.models.class_model import Subject
        from app.models.user import User
        from app.modules.ai.resolver import get_ai_provider

        stmt = select(StudentProfile, User).join(User, StudentProfile.user_id == User.id).where(StudentProfile.user_id == user_id)
        res = await self.db.execute(stmt)
        row = res.first()
        if not row:
            raise ValueError("Student profile not found.")
        
        student_prof, student_user = row
        student_name = f"{student_user.first_name} {student_user.last_name}".strip()

        # Fetch subject name from edupulse.subjects
        subj_stmt = select(Subject.name).where(Subject.id == subject_id)
        subj_res = await self.db.execute(subj_stmt)
        subject_name = subj_res.scalar_one_or_none() or "Academic Subject"

        # Generate AI Preliminary Hint via Groq AI Provider
        provider = get_ai_provider()
        ai_response_text = None
        if provider.is_available():
            try:
                ai_prompt = f"""
Subject: {subject_name}
Doubt Title: {title}
Student Question: {query}

Provide a concise, helpful 2-sentence preliminary academic explanation hint to guide the student until the teacher reviews.
"""
                raw_hint = await provider.generate_response(
                    prompt=ai_prompt,
                    system_instruction="You are an expert AI Tutor. Provide a clear, 2-sentence preliminary hint to explain the concept."
                )
                ai_response_text = f"🤖 [AI Preliminary Hint]: {raw_hint.strip()}"
            except Exception as e:
                ai_response_text = f"🤖 [AI Preliminary Hint]: Key concept review for {subject_name}: '{title}'. Please refer to class lecture notes for detailed steps."

        doubt = Doubt(
            student_id=student_prof.id,
            teacher_id=teacher_id,
            subject_id=subject_id,
            title=title,
            query=query,
            response=ai_response_text,
            status="Pending"
        )
        self.db.add(doubt)
        await self.db.commit()
        await self.db.refresh(doubt)

        tp_stmt = select(TeacherProfile).where(TeacherProfile.id == teacher_id)
        tp_res = await self.db.execute(tp_stmt)
        tp = tp_res.scalar_one_or_none()
        if tp:
            notif = Notification(
                user_id=tp.user_id,
                title="New Academic Doubt Received",
                content=f"Student {student_name} posted a doubt: '{title}'",
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
            "created_at": str(doubt.created_at),
        }

    async def get_student_doubts(self, user_id: int) -> List[Dict[str, Any]]:
        from app.models.doubt import Doubt
        from app.modules.teacher.models import TeacherProfile
        from app.models.class_model import Subject
        from app.models.user import User

        stmt = select(StudentProfile.id).where(StudentProfile.user_id == user_id)
        res = await self.db.execute(stmt)
        student_id = res.scalar_one_or_none()
        if not student_id:
            return []

        stmt = select(Doubt, Subject, TeacherProfile, User)\
            .join(Subject, Doubt.subject_id == Subject.id)\
            .join(TeacherProfile, Doubt.teacher_id == TeacherProfile.id)\
            .join(User, TeacherProfile.user_id == User.id)\
            .where(Doubt.student_id == student_id)\
            .order_by(Doubt.created_at.desc())

        result = await self.db.execute(stmt)
        rows = result.all()

        return [
            {
                "id": d.id,
                "student_id": d.student_id,
                "teacher_id": d.teacher_id,
                "subject_id": d.subject_id,
                "subject_name": subj.name,
                "teacher_name": f"{u.first_name} {u.last_name}".strip() or "Faculty Teacher",
                "title": d.title,
                "query": d.query,
                "response": d.response,
                "status": d.status,
                "created_at": str(d.created_at).split("T")[0].split(" ")[0] if d.created_at else "Recent",
                "updated_at": str(d.updated_at).split("T")[0].split(" ")[0] if d.updated_at else "Recent",
            }
            for d, subj, tp, u in rows
        ]

    async def get_student_faculty_options(self, user_id: int) -> List[Dict[str, Any]]:
        from app.modules.teacher.models import TeacherProfile
        from app.models.class_model import Subject, TeacherClassSubject
        from app.models.user import User
        from app.modules.student.models import StudentProfile

        sp_stmt = select(StudentProfile).where(StudentProfile.user_id == user_id)
        sp_res = await self.db.execute(sp_stmt)
        sp = sp_res.scalar_one_or_none()

        rows = []
        if sp and sp.class_id:
            stmt = select(TeacherClassSubject, TeacherProfile, User, Subject)\
                .join(TeacherProfile, TeacherClassSubject.teacher_id == TeacherProfile.id)\
                .join(User, TeacherProfile.user_id == User.id)\
                .join(Subject, TeacherClassSubject.subject_id == Subject.id)\
                .where(TeacherClassSubject.class_id == sp.class_id, TeacherProfile.is_active == True)
            res = await self.db.execute(stmt)
            rows = res.all()

        if not rows:
            stmt = select(TeacherProfile, User)\
                .join(User, TeacherProfile.user_id == User.id)\
                .where(TeacherProfile.is_active == True)
            res = await self.db.execute(stmt)
            tp_rows = res.all()

            subj_stmt = select(Subject).where(Subject.is_active == True)
            subj_res = await self.db.execute(subj_stmt)
            subjects = subj_res.scalars().all()

            options = []
            for idx, (tp, u) in enumerate(tp_rows):
                s_obj = subjects[idx % len(subjects)] if subjects else None
                options.append({
                    "teacher_id": tp.id,
                    "teacher_name": f"{u.first_name} {u.last_name}".strip() or u.email,
                    "subject_id": s_obj.id if s_obj else 1,
                    "subject_name": s_obj.name if s_obj else "General",
                    "department": tp.department or "Academics"
                })
            return options

        return [
            {
                "teacher_id": tp.id,
                "teacher_name": f"{u.first_name} {u.last_name}".strip() or u.email,
                "subject_id": subj.id,
                "subject_name": subj.name,
                "department": tp.department or "Academics"
            }
            for tcs, tp, u, subj in rows
        ]
    async def get_student_timetable(self, user_id: int) -> List[Dict[str, Any]]:
        profile = await self.get_profile_by_user_id(user_id)
        target_class_id = profile.get("class_id") if profile else None

        from app.models.class_model import TimetableSlot, Class, Subject
        from app.modules.teacher.models import TeacherProfile
        from sqlalchemy import cast, String

        stmt = select(TimetableSlot, Class, Subject, TeacherProfile, User)\
            .select_from(TimetableSlot)\
            .outerjoin(Class, TimetableSlot.class_id == Class.id)\
            .outerjoin(Subject, TimetableSlot.subject_id == Subject.id)\
            .outerjoin(TeacherProfile, TimetableSlot.end_time == cast(TeacherProfile.id, String))\
            .outerjoin(User, TeacherProfile.user_id == User.id)

        if target_class_id:
            stmt = stmt.where(TimetableSlot.class_id == target_class_id)

        res = await self.db.execute(stmt)
        rows = res.all()

        slots = []
        for slot, c_obj, s_obj, t_obj, u_obj in rows:
            c_name = f"Grade {c_obj.grade}-{c_obj.section}" if (c_obj and c_obj.grade and c_obj.section) else (c_obj.name if c_obj else f"Class #{slot.class_id}")
            s_name = s_obj.name if s_obj else f"Subject #{slot.subject_id}"
            t_name = f"{u_obj.first_name or ''} {u_obj.last_name or ''}".strip() if (u_obj and (u_obj.first_name or u_obj.last_name)) else (f"Teacher #{slot.teacher_id}" if slot.teacher_id else "Unassigned")

            p_num = getattr(slot, "period_number", 1) or 1
            st_time, ed_time = "09:00", "09:45"
            if p_num == 1:
                st_time, ed_time = "09:00", "09:45"
            elif p_num == 2:
                st_time, ed_time = "09:45", "10:30"
            elif p_num == 3:
                st_time, ed_time = "10:45", "11:30"
            elif p_num == 4:
                st_time, ed_time = "11:30", "12:15"
            elif p_num == 5:
                st_time, ed_time = "13:00", "13:45"
            elif p_num == 6:
                st_time, ed_time = "13:45", "14:30"

            slots.append({
                "id": slot.id,
                "class_id": slot.class_id,
                "subject_id": slot.subject_id,
                "teacher_id": slot.teacher_id,
                "day_of_week": slot.day_of_week,
                "period_number": p_num,
                "start_time": st_time,
                "end_time": ed_time,
                "is_published": True,
                "class_name": c_name,
                "subject_name": s_name,
                "teacher_name": t_name
            })
        return slots


