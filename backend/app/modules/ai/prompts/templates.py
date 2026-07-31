"""
templates.py — AI Prompt Template Repository

Centralised, version-controlled store of every system instruction and
user-prompt template used by the EduPulse AI Intelligence Platform.

Architecture rules (from 09_Coding_Guidelines.md):
  - Use centralised prompt builder.
  - Do NOT embed raw prompt strings inside service or router code.
  - Keep prompts reusable across features.

Template format:
  Each template is a PromptTemplate dataclass that carries:
    - key:                Unique string identifier used by the engine to look up the template.
    - version:            Semantic version string (MAJOR.MINOR). Increment MINOR on phrasing
                          changes, MAJOR on structural changes.
    - engine:             Which AI engine this prompt belongs to (for documentation & routing).
    - system_instruction: Role/persona/safety instruction sent as the model system prompt.
    - user_template:      Python str.format()-compatible template with {placeholder} tokens
                          that the engine fills from the collected context dict.
    - description:        Human-readable description for documentation and testing.

AI Engines mapped (from 02_Feature_List.md & 04_System_Architecture.md):
  AI-01  Workload Intelligence Engine         → POST /ai/workload-analysis
  AI-02  Holistic Growth Passport Engine      → POST /ai/growth-passport
  AI-03  Learning Health Engine               → POST /ai/learning-health
  AI-04  Invisible Student Radar Engine       → POST /ai/student-risk
  REC    Recommendation Engine               → POST /ai/recommendations
"""

from dataclasses import dataclass, field


@dataclass(frozen=True)
class PromptTemplate:
    """
    Immutable prompt template descriptor.

    Attributes:
        key:                Unique lookup key (e.g. "workload_analysis").
        version:            Semantic version (e.g. "1.0").
        engine:             AI engine this template belongs to.
        system_instruction: Model system/persona instruction.
        user_template:      str.format() template for the user-facing prompt.
        description:        Plain-English description for docs and tests.
        required_context:   List of context keys that MUST be present before rendering.
    """
    key: str
    version: str
    engine: str
    system_instruction: str
    user_template: str
    description: str
    required_context: tuple = field(default_factory=tuple)


# ---------------------------------------------------------------------------
# AI-01 — Workload Intelligence Engine
# Endpoint: POST /api/v1/ai/workload-analysis
# Consumers: Student (Study Planner), Teacher (Assignment Dashboard)
# ---------------------------------------------------------------------------

WORKLOAD_ANALYSIS = PromptTemplate(
    key="workload_analysis",
    version="1.0",
    engine="WorkloadIntelligenceEngine",
    description=(
        "Analyses a student's pending assignment load, identifies deadline "
        "clusters, flags overload risk, and produces a prioritised daily plan."
    ),
    system_instruction=(
        "You are EduPulse Workload Intelligence, an AI academic advisor specialising "
        "in student workload management. Your role is to analyse assignment deadlines "
        "and produce clear, actionable, empathetic guidance. "
        "Always format your output with markdown sections. "
        "Protect student privacy — never fabricate names or grades not provided. "
        "Do not give medical or psychological advice."
    ),
    user_template=(
        "Analyse the academic workload for the following student and provide a structured report.\n\n"
        "Student: {student_name} | Grade: {grade} | Section: {section}\n\n"
        "Pending Assignments:\n{assignments_summary}\n\n"
        "Upcoming Deadlines:\n{deadlines_summary}\n\n"
        "Current week attendance: {attendance_percent}%\n\n"
        "Please provide:\n"
        "1. Overall workload status (score out of 100)\n"
        "2. Assignment distribution breakdown by subject\n"
        "3. Overload risk assessment with peak days identified\n"
        "4. A prioritised 5-day study plan\n"
        "5. 3 specific, actionable recommendations\n\n"
        "Use clear markdown formatting with headers and bullet points."
    ),
    required_context=(
        "student_name", "grade", "section",
        "assignments_summary", "deadlines_summary", "attendance_percent",
    ),
)


# ---------------------------------------------------------------------------
# AI-03 — Learning Health Engine
# Endpoint: POST /api/v1/ai/learning-health
# Consumers: Student (Weakness Analyser), Teacher (Classroom Health Dashboard)
# Feature IDs: AI-03, ST-02, TE-01
# ---------------------------------------------------------------------------

LEARNING_HEALTH = PromptTemplate(
    key="learning_health",
    version="1.0",
    engine="LearningHealthEngine",
    description=(
        "Calculates concept mastery scores across subjects, identifies weak "
        "topics, and generates personalised learning health insights."
    ),
    system_instruction=(
        "You are EduPulse Learning Health Analyst, an AI specialising in academic "
        "performance analytics. Analyse assessment data to identify concept-level "
        "strengths and weaknesses. Produce insights that are evidence-based, "
        "constructive, and age-appropriate. "
        "Format all output with markdown. Use tables where appropriate. "
        "Do not stigmatise weak performance — frame it as a growth opportunity."
    ),
    user_template=(
        "Generate a comprehensive Learning Health Index for the following student.\n\n"
        "Student: {student_name} | Grade: {grade}\n\n"
        "Recent Assessment Scores by Subject:\n{assessment_scores}\n\n"
        "Topics Assessed:\n{topics_assessed}\n\n"
        "Previous Learning Health Score: {previous_score}/100\n"
        "Attendance Rate: {attendance_percent}%\n\n"
        "Please provide:\n"
        "1. Overall Learning Health Score (0-100) with justification\n"
        "2. Subject-by-subject concept mastery table (Subject | Score | Status)\n"
        "3. Top 3 weak concepts requiring immediate attention\n"
        "4. Top 2 strong areas to leverage for confidence\n"
        "5. Personalised study recommendations for weak concepts\n"
        "6. 30-day improvement projection if recommendations are followed\n\n"
        "Use clear markdown formatting."
    ),
    required_context=(
        "student_name", "grade", "assessment_scores",
        "topics_assessed", "previous_score", "attendance_percent",
    ),
)


# ---------------------------------------------------------------------------
# AI-04 — Invisible Student Radar Engine + AI Time Machine
# Endpoint: POST /api/v1/ai/student-risk
# Consumers: Teacher (Student Risk & Attention Detection)
# Feature IDs: AI-04, TE-03
# ---------------------------------------------------------------------------

STUDENT_RISK = PromptTemplate(
    key="student_risk",
    version="1.0",
    engine="InvisibleStudentRadarEngine",
    description=(
        "Identifies students showing early signs of disengagement or academic "
        "decline using attendance, grade trends, and submission patterns. "
        "Includes a 30-day AI Time Machine projection."
    ),
    system_instruction=(
        "You are EduPulse Invisible Student Radar, an AI early-warning system for "
        "educational wellbeing. Your mission is to identify students at risk of "
        "academic decline or disengagement before it becomes critical. "
        "Be objective, evidence-based, and compassionate. Never label students "
        "negatively — frame all findings as opportunities for timely support. "
        "Format output with markdown. Protect student privacy strictly."
    ),
    user_template=(
        "Analyse the following classroom data to identify students who may need "
        "additional support and provide an early-intervention report.\n\n"
        "Class: {class_name} | Teacher: {teacher_name} | Subject: {subject}\n\n"
        "Student Data Summary:\n{students_data}\n\n"
        "Attendance Trends (last 30 days):\n{attendance_trends}\n\n"
        "Grade Trends (last 3 assessments):\n{grade_trends}\n\n"
        "Assignment Submission Patterns:\n{submission_patterns}\n\n"
        "Please provide:\n"
        "1. Risk Classification Table (Student | Risk Level | Primary Indicator)\n"
        "2. Detailed profile for each HIGH-risk student\n"
        "3. Early warning signals detected across the class\n"
        "4. AI Time Machine: 30-day projection without intervention\n"
        "5. Specific intervention recommendations per risk level\n"
        "6. Suggested parent communication talking points\n\n"
        "Risk Levels: CRITICAL / HIGH / MEDIUM / LOW / SAFE\n"
        "Use clear markdown formatting."
    ),
    required_context=(
        "class_name", "teacher_name", "subject",
        "students_data", "attendance_trends", "grade_trends", "submission_patterns",
    ),
)


# ---------------------------------------------------------------------------
# AI-02 — Holistic Growth Passport Engine
# Endpoint: POST /api/v1/ai/growth-passport
# Consumers: Student, Teacher, Parent
# Feature IDs: AI-02, PA-01, ST-07
# ---------------------------------------------------------------------------

GROWTH_PASSPORT = PromptTemplate(
    key="growth_passport",
    version="1.0",
    engine="HolisticGrowthPassportEngine",
    description=(
        "Aggregates academic, extracurricular, attendance, and behavioural data "
        "to generate a holistic growth score and narrative growth timeline."
    ),
    system_instruction=(
        "You are EduPulse Growth Passport Analyst, an AI specialising in holistic "
        "student development. Your role is to look beyond grades and recognise "
        "achievement across academic, extracurricular, social, and personal growth "
        "dimensions. Be encouraging, balanced, and evidence-based. "
        "Celebrate achievements while identifying genuine growth opportunities. "
        "Format output with clear markdown. Never fabricate data not provided."
    ),
    user_template=(
        "Generate a Holistic Growth Passport report for the following student.\n\n"
        "Student: {student_name} | Grade: {grade} | Academic Year: {academic_year}\n\n"
        "Academic Performance Summary:\n{academic_summary}\n\n"
        "Extracurricular Achievements:\n{extracurricular_achievements}\n\n"
        "Attendance Record:\n"
        "  - Overall Attendance: {attendance_percent}%\n"
        "  - Punctuality Score: {punctuality_score}%\n\n"
        "Behavioural & Participation Indicators:\n{participation_data}\n\n"
        "Key Milestones This Year:\n{milestones}\n\n"
        "Please provide:\n"
        "1. Overall Holistic Growth Score (0-100) with dimension breakdown\n"
        "2. Academic Development analysis\n"
        "3. Extracurricular Achievement highlights\n"
        "4. Wellness & Engagement analysis\n"
        "5. Growth Timeline: 3-5 key milestone highlights\n"
        "6. AI Growth Narrative (2-3 paragraphs, encouraging tone)\n"
        "7. Next Growth Opportunities (3 specific suggestions)\n\n"
        "Use clear markdown formatting with section headers."
    ),
    required_context=(
        "student_name", "grade", "academic_year",
        "academic_summary", "extracurricular_achievements",
        "attendance_percent", "punctuality_score",
        "participation_data", "milestones",
    ),
)


# ---------------------------------------------------------------------------
# Recommendation Engine
# Endpoint: POST /api/v1/ai/recommendations
# Consumers: Student, Teacher, Parent
# Sub-types: study_plan, exam_plan, opportunities, parent_guidance, teacher_guidance
# ---------------------------------------------------------------------------

RECOMMENDATIONS = PromptTemplate(
    key="recommendations",
    version="1.0",
    engine="RecommendationEngine",
    description=(
        "Generates personalised, multi-type recommendations covering study plans, "
        "exam preparation, opportunity discovery, parent guidance, and teacher "
        "suggestions based on the student's current profile."
    ),
    system_instruction=(
        "You are EduPulse Recommendation Engine, an AI personalisation system for "
        "educational guidance. Generate actionable, personalised recommendations "
        "tailored to the student's specific strengths, weaknesses, interests, and goals. "
        "Be specific — avoid generic advice. Every recommendation must reference "
        "the student's actual data. Format using markdown sections. "
        "Tone: encouraging, practical, growth-focused."
    ),
    user_template=(
        "Generate personalised recommendations for the following student.\n\n"
        "Student: {student_name} | Grade: {grade} | Role: {role}\n\n"
        "Recommendation Types Requested: {recommendation_types}\n\n"
        "Current Academic Performance:\n{academic_summary}\n\n"
        "Identified Weak Areas:\n{weak_areas}\n\n"
        "Identified Strong Areas:\n{strong_areas}\n\n"
        "Upcoming Exams / Deadlines:\n{upcoming_events}\n\n"
        "Student Interests & Activities:\n{interests}\n\n"
        "Please provide tailored recommendations for each requested type:\n\n"
        "### Study Plan\n"
        "A week-by-week study schedule targeting weak areas.\n\n"
        "### Exam Preparation Plan\n"
        "A structured exam prep timeline with topic priorities.\n\n"
        "### Opportunity Recommendations\n"
        "Competitions, clubs, and activities that match the student's profile.\n\n"
        "### Parent Guidance\n"
        "Specific, actionable advice for parents to support their child.\n\n"
        "### Teacher Guidance\n"
        "Classroom strategies to support this student's learning needs.\n\n"
        "Use specific subject names, topic names, and timeline references."
    ),
    required_context=(
        "student_name", "grade", "role",
        "recommendation_types", "academic_summary",
        "weak_areas", "strong_areas", "upcoming_events", "interests",
    ),
)


# ---------------------------------------------------------------------------
# Template Registry
# Central lookup table — the engine uses this to resolve templates by key.
# ---------------------------------------------------------------------------

TEMPLATE_REGISTRY: dict[str, PromptTemplate] = {
    template.key: template
    for template in [
        WORKLOAD_ANALYSIS,
        LEARNING_HEALTH,
        STUDENT_RISK,
        GROWTH_PASSPORT,
        RECOMMENDATIONS,
    ]
}


def get_template(key: str) -> PromptTemplate:
    """
    Retrieve a PromptTemplate by its key.

    Args:
        key: Template key string (e.g. "workload_analysis").

    Returns:
        PromptTemplate instance.

    Raises:
        KeyError: If no template exists for the given key.
    """
    if key not in TEMPLATE_REGISTRY:
        available = sorted(TEMPLATE_REGISTRY.keys())
        raise KeyError(
            f"No prompt template found for key '{key}'. "
            f"Available templates: {available}"
        )
    return TEMPLATE_REGISTRY[key]


def list_templates() -> list[dict]:
    """
    Return a summary list of all registered templates.
    Useful for documentation, admin panels, and prompt testing tools.
    """
    return [
        {
            "key": t.key,
            "version": t.version,
            "engine": t.engine,
            "description": t.description,
            "required_context_fields": list(t.required_context),
        }
        for t in TEMPLATE_REGISTRY.values()
    ]
