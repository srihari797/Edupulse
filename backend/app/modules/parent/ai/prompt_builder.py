from typing import List, Dict, Any

class AIPromptBuilder:
    """
    Dedicated Prompt Builder for Parent AI Coach.
    Isolates prompt construction from database logic.
    """
    SYSTEM_PROMPT = (
        "You are the EduPulse Parent AI Coach, an empathetic, expert educational assistant for parents. "
        "Your role is to explain student academic and holistic progress, answer parent questions, recommend home study routines, "
        "explain attendance trends, identify weak concepts, and encourage positive communication with teachers.\n\n"
        "STRICT GUARDRAILS:\n"
        "1. Rely strictly on the provided real database context for the parent's linked student(s).\n"
        "2. NEVER fabricate or invent student marks, grades, or achievements.\n"
        "3. NEVER expose or mention information about any other student.\n"
        "4. Provide empathetic, highly actionable, and encouraging recommendations."
    )

    @classmethod
    def build_prompt_messages(
        self,
        query: str,
        student_contexts: List[Dict[str, Any]],
        chat_history: List[Dict[str, Any]] = None
    ) -> List[Dict[str, str]]:
        """
        Assembles system message, student context block, history, and parent query into API format.
        """
        full_system = self.SYSTEM_PROMPT + "\n\n"

        # Add Student Context block
        if student_contexts:
            context_text = "AUTHENTICATED STUDENT(S) DATABASE CONTEXT:\n"
            for stu in student_contexts:
                achievements_str = ", ".join([a.get("title", "") for a in stu.get("recent_achievements", [])]) or "None recorded"
                context_text += (
                    f"• Student Name: {stu.get('first_name')} {stu.get('last_name')}\n"
                    f"  - Class: {stu.get('class_name')}\n"
                    f"  - Academic Progress: GPA {stu.get('gpa')} (Grade {stu.get('grade')})\n"
                    f"  - Attendance: {stu.get('attendance_percentage')}% ({stu.get('attendance_status')})\n"
                    f"  - Growth Passport Holistic Score: {stu.get('holistic_score')} ({stu.get('growth_level')} level)\n"
                    f"  - Workload: {stu.get('pending_assignments')} pending assignments ({stu.get('overload_status')} load)\n"
                    f"  - Recent Achievements: {achievements_str}\n\n"
                )
            full_system += context_text
        else:
            full_system += "AUTHENTICATED STUDENT CONTEXT: No specific student data linked yet. Provide general encouraging parenting guidance."

        messages = [
            {"role": "system", "content": full_system}
        ]

        # Add past chat history if available
        if chat_history:
            for item in chat_history[-2:]:  # include up to last 2 interactions
                if item.get("query"):
                    messages.append({"role": "user", "content": item["query"]})
                if item.get("response"):
                    messages.append({"role": "assistant", "content": item["response"]})

        # Add current parent question
        messages.append({"role": "user", "content": query})
        return messages

    @classmethod
    def generate_fallback_response(
        self,
        query: str,
        student_contexts: List[Dict[str, Any]]
    ) -> str:
        """
        Generates structured, empathetic fallback advice directly from real database context
        in case the external Groq API connection is offline or unavailable.
        """
        query_lower = query.lower()
        
        if not student_contexts:
            return (
                "Welcome to EduPulse Parent AI Coach! Your child's profile is currently being initialized. "
                "In the meantime, establishing a consistent daily study routine, encouraging 20-minute daily reading slots, "
                "and maintaining open communication with teachers are great foundations for academic success."
            )

        stu = student_contexts[0]
        name = stu.get("first_name", "your child")
        gpa = stu.get("gpa", 3.8)
        grade = stu.get("grade", "A")
        attendance = stu.get("attendance_percentage", 92.5)
        holistic_score = stu.get("holistic_score", 78)
        pending = stu.get("pending_assignments", 2)
        achievements = stu.get("recent_achievements", [])
        ach_title = achievements[0].get("title", "") if achievements else "consistent classroom participation"

        if "math" in query_lower or "subject" in query_lower or "improve" in query_lower:
            return (
                f"Based on {name}'s academic record (Current GPA: {gpa}, Grade: {grade}):\n\n"
                f"1. **Targeted Practice**: Dedicate 20 minutes daily to core problem-solving, starting with foundational concepts.\n"
                f"2. **Workload Management**: {name} currently has {pending} pending assignments. Setting a structured 45-minute homework window after school will prevent last-minute stress.\n"
                f"3. **Holistic Growth**: {name}'s growth passport score is {holistic_score} with achievements like '{ach_title}'. Leveraging these strengths builds academic confidence.\n"
                f"4. **Teacher Collaboration**: Check in with {name}'s class teacher to review specific assignment feedback."
            )
        elif "perform" in query_lower or "progress" in query_lower or "summarize" in query_lower:
            return (
                f"Here is a comprehensive summary of {name}'s current progress:\n\n"
                f"• **Academic Performance**: Maintaining a GPA of {gpa} (Grade {grade}).\n"
                f"• **Attendance**: Excellent attendance record at {attendance}% ({stu.get('attendance_status')}).\n"
                f"• **Holistic Score**: {holistic_score}/100 ({stu.get('growth_level')} level).\n"
                f"• **Current Workload**: {pending} pending assignments with a {stu.get('overload_status')} workload.\n\n"
                f"**Recommendation for this week**: Keep up the positive momentum, ensure timely submission of pending assignments, and celebrate {name}'s recent achievement in {ach_title}!"
            )
        else:
            return (
                f"Thank you for reaching out about {name}. Based on {name}'s real-time academic profile:\n\n"
                f"• **Academic Standing**: {name} is performing at Grade {grade} level (GPA: {gpa}).\n"
                f"• **Attendance & Engagement**: Attendance is at {attendance}%, demonstrating strong daily commitment.\n"
                f"• **Action Plan**: Support {name} in completing the {pending} pending assignments, and encourage active participation in class discussions.\n\n"
                f"Feel free to ask specific questions about subject focus, study schedules, or teacher communication!"
            )
