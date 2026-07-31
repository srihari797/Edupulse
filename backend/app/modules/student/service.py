from typing import Optional, Dict, Any, List
from app.modules.student.repository import StudentRepository
from app.modules.student.schemas import StudentProfileUpdate

class StudentService:
    """
    Business Service Layer for Student Module.
    Encapsulates all logic and coordinates between API routers and repositories.
    """
    def __init__(self, repository: StudentRepository):
        self.repository = repository

    async def get_profile(self, user_id: int) -> Optional[Dict[str, Any]]:
        return await self.repository.get_profile_by_user_id(user_id)

    async def update_profile(self, user_id: int, profile_update: StudentProfileUpdate) -> Optional[Dict[str, Any]]:
        update_data = profile_update.model_dump(exclude_unset=True)
        return await self.repository.update_profile(user_id, update_data)

    async def get_dashboard(self, user_id: int) -> Dict[str, Any]:
        return await self.repository.get_dashboard_data(user_id)

    async def get_learning_health(self, user_id: int) -> Dict[str, Any]:
        return await self.repository.get_learning_health(user_id)

    async def get_workload_intelligence(self, user_id: int) -> Dict[str, Any]:
        return await self.repository.get_workload_intelligence(user_id)

    async def generate_study_plan(self, user_id: int, plan_type: str = "Weekly") -> Dict[str, Any]:
        import json
        import logging
        from datetime import datetime
        from app.modules.ai.resolver import get_ai_provider

        logger = logging.getLogger(__name__)

        profile = await self.repository.get_profile_by_user_id(user_id)
        student_profile_id = profile["id"] if profile else user_id
        student_name = f"{profile.get('first_name', '')} {profile.get('last_name', '')}".strip() if profile else f"Student #{user_id}"

        # Determine current day of week up to Sunday
        all_days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
        today_name = datetime.now().strftime("%A")
        today_idx = all_days.index(today_name) if today_name in all_days else 0
        target_days = all_days[today_idx:]  # From today until Sunday

        # 1. Fetch real student database metrics from edupulse schema
        doubts = await self.repository.get_student_doubts(user_id)
        assignments = await self.repository.get_student_assignments(student_profile_id)
        health = await self.repository.get_learning_health(user_id)

        unresolved_doubts = [f"- {d['subject_name']}: {d['title']} ('{d['query']}')" for d in doubts if d.get("status") != "Resolved"]
        pending_assignments = [f"- {a['subject_name']}: {a['title']} (Due: {a['due_date'] or 'Upcoming'})" for a in assignments if a.get("status") != "Graded"]

        doubts_text = "\n".join(unresolved_doubts) if unresolved_doubts else "No active doubts posted."
        assignments_text = "\n".join(pending_assignments) if pending_assignments else "No pending assignments."
        lhi_score = health.get("score", 85)
        lhi_diagnostic = health.get("diagnostic_summary", "Good performance.")

        # 2. Invoke Groq AI Engine with real student database context
        provider = get_ai_provider()
        plan_data = None

        if provider.is_available():
            prompt_text = f"""
Student Name: {student_name}
Plan Type: {plan_type}
Today is: {today_name}
Target Days (Current Day to Sunday): {", ".join(target_days)}
Learning Health Score: {lhi_score}/100 ({lhi_diagnostic})

Current Unresolved Doubts:
{doubts_text}

Active Homework Assignments:
{assignments_text}

Based ONLY on this student's real academic record above, generate a structured {plan_type} Study Plan.
CRITICAL MANDATE: The schedule MUST start from today ({today_name}) and cover days up to Sunday ({", ".join(target_days)}).

Return your response STRICTLY as a valid JSON object matching this schema:
{{
  "schedule": [
    {{"day": "{today_name}", "topic": "<Specific Topic derived from real subject/doubt>", "duration": "45 mins", "priority": "High"}},
    {{"day": "<Next Day>", "topic": "<Specific Topic>", "duration": "60 mins", "priority": "Medium"}}
  ],
  "focus_areas": ["<Focus Area 1>", "<Focus Area 2>"]
}}
Do NOT include markdown formatting or extra text outside the JSON object.
"""
            try:
                raw_response = await provider.generate_response(
                    prompt=prompt_text,
                    system_instruction=f"You are an expert AI Study Planner. Generate study schedules starting from {today_name} to Sunday. Return valid JSON strictly matching the requested schema."
                )
                clean_json = raw_response.strip()
                if clean_json.startswith("```"):
                    clean_json = clean_json.split("```")[1]
                    if clean_json.startswith("json"):
                        clean_json = clean_json[4:].strip()
                plan_data = json.loads(clean_json)
            except Exception as e:
                logger.warning(f"Groq AI Study Plan generation fallback: {e}")

        # Fallback to structured plan derived from student DB metrics if LLM JSON parsing fails
        if not plan_data or "schedule" not in plan_data:
            primary_subject = doubts[0]["subject_name"] if doubts else (assignments[0]["subject_name"] if assignments else "Mathematics")
            secondary_subject = assignments[0]["subject_name"] if assignments else "Science"
            fallback_schedule = []
            for idx, d in enumerate(target_days):
                subj = primary_subject if idx % 2 == 0 else secondary_subject
                prio = "High" if idx == 0 else ("Medium" if idx < len(target_days) - 1 else "Low")
                fallback_schedule.append({
                    "day": d,
                    "topic": f"{subj} Review & Practice",
                    "duration": "45 mins",
                    "priority": prio
                })
            plan_data = {
                "schedule": fallback_schedule,
                "focus_areas": [f"{primary_subject} Concepts", f"{secondary_subject} Assignments"]
            }

        # Build clean Markdown narrative text with explicit headings & bold formatting
        focus_md = "\n".join([f"- {f}" for f in plan_data.get("focus_areas", [])])
        schedule_md = "\n".join([
            f"- **{item['day']}**: {item['topic']} ({item['duration']}) — *{item['priority']} Priority*"
            for item in plan_data.get("schedule", [])
        ])
        narrative_markdown = f"### 🎯 Focus Areas\n{focus_md}\n\n### 📅 Recommended Weekly Schedule\n{schedule_md}"
        plan_data["narrative"] = narrative_markdown

        return await self.repository.save_study_plan(student_profile_id, plan_type, plan_data)

    async def get_latest_study_plan(self, user_id: int, plan_type: str = "Weekly") -> Optional[Dict[str, Any]]:
        profile = await self.repository.get_profile_by_user_id(user_id)
        student_profile_id = profile["id"] if profile else user_id
        
        plan = await self.repository.get_latest_study_plan(student_profile_id, plan_type)
        if not plan:
            # Generate one if none exists yet
            plan = await self.generate_study_plan(user_id, plan_type)
        return plan

    async def get_opportunities(self, user_id: int) -> List[Dict[str, Any]]:
        profile = await self.repository.get_profile_by_user_id(user_id)
        student_profile_id = profile["id"] if profile else user_id
        return await self.repository.get_opportunities(student_profile_id)

    async def get_student_assignments(self, user_id: int) -> List[Dict[str, Any]]:
        profile = await self.repository.get_profile_by_user_id(user_id)
        if not profile:
            return []
        return await self.repository.get_student_assignments(profile["id"])

    async def submit_assignment(self, user_id: int, assignment_id: int, file_bucket: str, file_path: str) -> Dict[str, Any]:
        profile = await self.repository.get_profile_by_user_id(user_id)
        if not profile:
            raise ValueError("Student profile not found.")
        return await self.repository.submit_assignment(profile["id"], assignment_id, file_bucket, file_path)

    async def get_student_submission(self, user_id: int, assignment_id: int) -> Optional[Dict[str, Any]]:
        profile = await self.repository.get_profile_by_user_id(user_id)
        if not profile:
            return None
        return await self.repository.get_student_submission(profile["id"], assignment_id)

    async def get_student_resources(self, user_id: int) -> List[Dict[str, Any]]:
        profile = await self.repository.get_profile_by_user_id(user_id)
        if not profile:
            return []
        return await self.repository.get_student_resources(profile["id"])

    async def create_student_doubt(self, user_id: int, teacher_id: int, subject_id: int, title: str, query: str) -> Dict[str, Any]:
        return await self.repository.create_student_doubt(user_id, teacher_id, subject_id, title, query)

    async def get_student_doubts(self, user_id: int) -> List[Dict[str, Any]]:
        return await self.repository.get_student_doubts(user_id)

    async def get_faculty_options(self, user_id: int) -> List[Dict[str, Any]]:
        return await self.repository.get_student_faculty_options(user_id)
    async def get_student_timetable(self, user_id: int) -> List[Dict[str, Any]]:
        return await self.repository.get_student_timetable(user_id)


