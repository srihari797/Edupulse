"""
mock.py — Mock AI Provider

Implements BaseAIProvider with deterministic, realistic mock responses.

Used in MOCK and HYBRID fallback modes so the entire AI platform
operates without any live API keys during development and testing.

Design rules:
  - Implements ALL 4 abstract methods from BaseAIProvider.
  - Returns structured, realistic output that mirrors what Gemini would produce.
  - Responses are keyed by context keywords so the same prompt type
    always returns the same mock result (deterministic).
  - is_available() always returns True — mock never fails.
  - generate_embedding() returns a stable 768-dim zero vector so Qdrant
    operations can be tested without a live embedding model.

Architecture (from 09_Coding_Guidelines.md):
  - AI only through AI Orchestrator.
  - Return structured responses only.
  - Keep prompts reusable.
"""
import hashlib
from app.modules.ai.providers.base import BaseAIProvider


# ---------------------------------------------------------------------------
# Deterministic mock response library
# Keyed by the first matching keyword found in the prompt (lower-cased).
# ---------------------------------------------------------------------------

_MOCK_RESPONSES: dict[str, str] = {

    # AI-01 — Workload Intelligence Engine (POST /ai/workload-analysis)
    "workload": (
        "## Workload Analysis — EduPulse AI\n\n"
        "**Overall Workload Status:** MODERATE (67/100)\n\n"
        "### Assignment Distribution\n"
        "- Mathematics: 2 pending assignments (Due: 3 days)\n"
        "- Physics: 1 pending assignment (Due: 5 days)\n"
        "- English: 1 pending assignment (Due: 7 days)\n\n"
        "### Overload Risk\n"
        "- **Risk Level:** Low-Medium\n"
        "- **Peak Day:** Thursday (3 simultaneous deadlines)\n\n"
        "### AI Recommendations\n"
        "1. Start the Mathematics assignment today to avoid Thursday overload.\n"
        "2. Block 45-minute focus sessions on Monday and Wednesday.\n"
        "3. Physics can be addressed after Mathematics submission.\n\n"
        "**Confidence Score:** 0.91"
    ),

    # AI-03 — Learning Health Engine (POST /ai/learning-health)
    "learning": (
        "## Learning Health Index — EduPulse AI\n\n"
        "**Overall Learning Health Score:** 74/100 — GOOD\n\n"
        "### Concept Mastery Breakdown\n"
        "| Subject | Score | Status |\n"
        "|---------|-------|--------|\n"
        "| Mathematics | 78% | Strong |\n"
        "| Physics | 65% | Needs Attention |\n"
        "| English | 82% | Strong |\n"
        "| Chemistry | 58% | At Risk |\n\n"
        "### Weak Concepts Detected\n"
        "- Chemistry: Mole Concept, Organic Reactions\n"
        "- Physics: Circular Motion, Wave Optics\n\n"
        "### AI Recommendations\n"
        "1. Schedule 2 focused Chemistry revision sessions this week.\n"
        "2. Review Wave Optics using the available learning resources.\n"
        "3. Consider forming a study group for Organic Chemistry.\n\n"
        "**Confidence Score:** 0.88"
    ),

    # AI-04 — Invisible Student Radar Engine (POST /ai/student-risk)
    "risk": (
        "## Invisible Student Radar — EduPulse AI\n\n"
        "**Risk Assessment Summary**\n\n"
        "### Students Requiring Immediate Attention\n"
        "| Student | Risk Level | Primary Indicator |\n"
        "|---------|------------|-------------------|\n"
        "| Arjun S. | HIGH | 3 consecutive absences + declining grades |\n"
        "| Priya K. | MEDIUM | Assignment submission delays |\n\n"
        "### Early Warning Signals Detected\n"
        "- **Disengagement:** 2 students showing reduced participation\n"
        "- **Academic Decline:** Grade drop > 15% in last 3 assessments\n"
        "- **Attendance:** 4 students below 80% monthly attendance\n\n"
        "### Recommended Interventions\n"
        "1. Schedule a one-on-one check-in with Arjun S. this week.\n"
        "2. Notify parents of Priya K. about submission pattern.\n"
        "3. Review classroom engagement strategies for identified group.\n\n"
        "**AI Time Machine Projection (30 days):**\n"
        "Without intervention, 2 of 4 flagged students are projected to drop below passing threshold.\n\n"
        "**Confidence Score:** 0.85"
    ),

    # AI-02 — Growth Passport Engine (POST /ai/growth-passport)
    "growth": (
        "## Holistic Growth Passport — EduPulse AI\n\n"
        "**Overall Growth Score:** 82/100 — EXCELLENT\n\n"
        "### Academic Development\n"
        "- Average Grade Trend: +8% over last semester\n"
        "- Consistent improvement in Mathematics and English\n"
        "- Physics requires focused attention\n\n"
        "### Extracurricular Achievement\n"
        "- District-level Science Olympiad: 2nd Place 🥈\n"
        "- School Debate Club: Active Participant\n"
        "- Community Service: 12 hours logged\n\n"
        "### Behavioral & Wellness Indicators\n"
        "- Attendance Rate: 93% (Above average)\n"
        "- Punctuality Score: 88%\n"
        "- Peer Collaboration Index: 79%\n\n"
        "### Growth Timeline Highlights\n"
        "- Jan 2026: Mathematics score improved by 12%\n"
        "- Mar 2026: Achieved Science Olympiad recognition\n"
        "- Jun 2026: Consistent assignment submission streak (28 days)\n\n"
        "### AI Narrative\n"
        "This student demonstrates strong holistic development across academic "
        "and extracurricular dimensions. The next growth opportunity lies in "
        "strengthening Physics performance and expanding leadership engagement.\n\n"
        "**Confidence Score:** 0.93"
    ),

    # Recommendation Engine (POST /ai/recommendations)
    "recommend": (
        "## Personalized Recommendations — EduPulse AI\n\n"
        "### Study Plan\n"
        "1. Allocate 45 minutes daily to Chemistry (Mole Concept focus).\n"
        "2. Use spaced repetition for Physics formulae revision.\n"
        "3. Complete one past paper per week for exam readiness.\n\n"
        "### Exam Preparation Plan\n"
        "- Week 1: Chemistry revision — Mole Concept + Organic Reactions\n"
        "- Week 2: Physics — Circular Motion, Wave Optics\n"
        "- Week 3: Mathematics mock test + weak area review\n"
        "- Week 4: Full syllabus revision + practice papers\n\n"
        "### Opportunity Recommendations\n"
        "- **Science Olympiad 2026:** Your profile matches the top-performer bracket.\n"
        "- **Coding Club:** Recommended based on interest patterns.\n"
        "- **Math League:** Strong Mathematics trend supports participation.\n\n"
        "### Parent Guidance\n"
        "- Encourage 8-hour sleep schedule during exam preparation.\n"
        "- Review weekly progress together using the Growth Passport.\n"
        "- Motivate participation in the Science Olympiad.\n\n"
        "### Teacher Guidance\n"
        "- Provide additional Chemistry worked examples this week.\n"
        "- Pair with a strong peer for Physics problem sessions.\n\n"
        "**Confidence Score:** 0.90"
    ),

    # Default fallback — for unrecognised prompt types
    "default": (
        "## EduPulse AI Analysis\n\n"
        "Your request has been processed successfully.\n\n"
        "**Key Insights:**\n"
        "- Data analysis completed across all available dimensions.\n"
        "- Patterns identified within the provided context.\n"
        "- Recommendations generated based on current performance indicators.\n\n"
        "Please consult the relevant module dashboard for detailed metrics.\n\n"
        "**Confidence Score:** 0.80"
    ),
}

# Stable 768-dimension zero-vector for mock embeddings (matches Gemini text-embedding-004 dims)
_MOCK_EMBEDDING_DIMS = 768


class MockAIProvider(BaseAIProvider):
    """
    Deterministic Mock AI Provider for EduPulse.

    Returns realistic mock responses for all AI engines without requiring
    any external API keys or network connectivity.

    Behaviour:
      - generate_response: Returns the mock response matching the first keyword
        found in the prompt. Falls back to the "default" mock if no keyword matches.
      - generate_embedding: Returns a stable 768-dim vector seeded by a hash
        of the input text so identical text always yields identical (pseudo) vectors.
      - provider_name: Returns "mock".
      - is_available: Always returns True.
    """

    def provider_name(self) -> str:
        return "mock"

    def is_available(self) -> bool:
        return True

    async def generate_response(
        self,
        prompt: str,
        system_instruction: str = "",
        **kwargs,
    ) -> str:
        """
        Return a deterministic mock response based on a keyword scan of the prompt.

        Keyword priority (first match wins):
          workload → Workload Analysis
          learning / health → Learning Health Index
          risk / radar / student-risk → Student Radar
          growth / passport → Growth Passport
          recommend → Recommendations
          (anything else) → default fallback
        """
        prompt_lower = prompt.lower()

        for keyword in ("workload", "learning", "health", "risk", "radar", "growth", "passport", "recommend"):
            if keyword in prompt_lower:
                # Map "health" and "radar" to the correct response keys
                if keyword in ("health",):
                    return _MOCK_RESPONSES["learning"]
                if keyword in ("radar",):
                    return _MOCK_RESPONSES["risk"]
                if keyword in ("passport",):
                    return _MOCK_RESPONSES["growth"]
                return _MOCK_RESPONSES.get(keyword, _MOCK_RESPONSES["default"])

        return _MOCK_RESPONSES["default"]

    async def generate_embedding(self, text: str) -> list[float]:
        """
        Return a stable 768-dim pseudo-vector seeded by MD5 hash of the input text.

        This ensures:
          - The same text always returns the same vector (deterministic).
          - Different texts return different vectors (basic differentiation).
          - No external calls required.
          - Compatible with Qdrant collection operations in Mock mode.
        """
        # Seed a repeatable pseudo-vector from the text hash
        digest = hashlib.md5(text.encode("utf-8")).digest()  # 16 bytes
        seed_values = [b / 255.0 for b in digest]

        # Tile the 16-byte seed to fill 768 dimensions
        embedding = []
        for i in range(_MOCK_EMBEDDING_DIMS):
            embedding.append(seed_values[i % len(seed_values)])

        return embedding
