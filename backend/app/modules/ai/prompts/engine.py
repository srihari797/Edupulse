"""
engine.py — AI Prompt Engine

The Prompt Engine is the single entry point for all prompt construction in
EduPulse. It takes a template key and a raw context dictionary, validates
the context, renders the final prompt strings, applies safety checks, and
returns a ready-to-dispatch PromptPackage to the AI Service layer.

Architecture rules (from 09_Coding_Guidelines.md):
  - Use centralised prompt builder.
  - Do NOT call Gemini directly from modules.
  - Return structured responses only.
  - Keep prompts reusable.

Processing pipeline:
  1. resolve_template(key)       — Look up the PromptTemplate from registry.
  2. validate_context(tmpl, ctx) — Ensure all required_context fields are present.
  3. render_prompt(tmpl, ctx)    — str.format() the user_template with the context.
  4. apply_safety_prefix(text)   — Prepend non-negotiable safety guardrails.
  5. Return PromptPackage        — Typed payload ready for the provider.

The engine never calls the provider directly.
The AI Service receives the PromptPackage and decides which provider to use.
"""

from dataclasses import dataclass
from typing import Any
import logging

from app.modules.ai.prompts.templates import get_template, PromptTemplate

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Safety Guardrail Prefix
# Prepended to every user prompt before dispatch.
# This cannot be overridden by service or router code.
# ---------------------------------------------------------------------------

_SAFETY_PREFIX = (
    "[EduPulse Safety Guardrails]\n"
    "- This is an educational platform for students, teachers, and parents.\n"
    "- Do NOT generate harmful, offensive, or inappropriate content.\n"
    "- Do NOT provide medical, psychological, or legal advice.\n"
    "- Do NOT fabricate student data, grades, or personal information.\n"
    "- Protect student privacy at all times.\n"
    "- Keep all responses age-appropriate and educationally focused.\n\n"
)

# Banned terms that must not appear in the final rendered prompt
_BANNED_TERMS: list[str] = [
    "ignore previous instructions",
    "ignore all instructions",
    "you are now",
    "disregard your",
    "jailbreak",
    "act as if",
    "pretend you are",
]


# ---------------------------------------------------------------------------
# PromptPackage — the output of the engine, consumed by the AI Service
# ---------------------------------------------------------------------------

@dataclass(frozen=True)
class PromptPackage:
    """
    Typed, immutable prompt payload ready for dispatch to any AI provider.

    Attributes:
        template_key:       The key of the template used (for logging/tracing).
        template_version:   Version string of the template (for audit logs).
        engine_name:        AI engine name for routing metadata.
        system_instruction: Fully resolved system instruction string.
        user_prompt:        Fully rendered, safety-prefixed user prompt string.
        context_keys:       Tuple of context keys used during rendering (for tracing).
    """
    template_key: str
    template_version: str
    engine_name: str
    system_instruction: str
    user_prompt: str
    context_keys: tuple


# ---------------------------------------------------------------------------
# PromptValidationError
# ---------------------------------------------------------------------------

class PromptValidationError(Exception):
    """
    Raised when context validation fails or a safety check detects
    a prompt injection attempt.
    """


# ---------------------------------------------------------------------------
# Core Engine Functions
# ---------------------------------------------------------------------------

def validate_context(template: PromptTemplate, context: dict[str, Any]) -> None:
    """
    Validate that all required context fields are present in the context dict.

    Args:
        template: The PromptTemplate requiring validation.
        context:  The raw context dictionary from the service layer.

    Raises:
        PromptValidationError: If any required field is missing.
    """
    missing = [
        field for field in template.required_context
        if field not in context or context[field] is None
    ]
    if missing:
        raise PromptValidationError(
            f"Template '{template.key}' is missing required context fields: {missing}. "
            f"Required: {list(template.required_context)}"
        )


def apply_safety_check(prompt: str) -> None:
    """
    Scan the rendered prompt for known prompt-injection patterns.

    Args:
        prompt: The rendered user prompt string.

    Raises:
        PromptValidationError: If a banned injection term is detected.
    """
    prompt_lower = prompt.lower()
    for term in _BANNED_TERMS:
        if term in prompt_lower:
            raise PromptValidationError(
                f"Prompt safety check failed: banned term detected — '{term}'. "
                "Prompt has been rejected."
            )


def render_prompt(template: PromptTemplate, context: dict[str, Any]) -> str:
    """
    Render the user_template using the supplied context dictionary.

    Uses Python str.format_map() so extra keys in the context dict are
    silently ignored (only declared placeholders are substituted).

    Args:
        template: The resolved PromptTemplate.
        context:  Context dictionary with values for all placeholder tokens.

    Returns:
        Fully rendered user prompt string (without safety prefix).

    Raises:
        PromptValidationError: If a placeholder is missing from the context.
    """
    try:
        # Convert all context values to strings for safe formatting
        str_context = {k: str(v) if v is not None else "" for k, v in context.items()}
        rendered = template.user_template.format_map(str_context)
        return rendered
    except KeyError as exc:
        raise PromptValidationError(
            f"Template '{template.key}' has an unresolved placeholder: {exc}. "
            f"Ensure all format tokens are present in the context dict."
        ) from exc


def build_prompt(
    template_key: str,
    context: dict[str, Any],
) -> PromptPackage:
    """
    Main entry point for the Prompt Engine.

    Full pipeline:
      1. Resolve template from registry.
      2. Validate required context fields.
      3. Render the user prompt from the template.
      4. Apply prompt-injection safety scan.
      5. Prepend non-negotiable safety guardrail prefix.
      6. Return an immutable PromptPackage.

    Args:
        template_key: The key identifying which prompt template to use.
                      Must match a key in TEMPLATE_REGISTRY.
        context:      Dictionary containing all values needed to render
                      the template's user_template placeholders.

    Returns:
        PromptPackage — immutable, validated, safety-checked prompt payload.

    Raises:
        KeyError:              If template_key does not exist in the registry.
        PromptValidationError: If context is incomplete or injection is detected.

    Example:
        package = build_prompt(
            "workload_analysis",
            {
                "student_name": "Rahul B",
                "grade": "Grade 10",
                "section": "A",
                "assignments_summary": "...",
                "deadlines_summary": "...",
                "attendance_percent": 92,
            }
        )
    """
    # Step 1: Resolve template
    template = get_template(template_key)

    logger.info(
        "PromptEngine: Building prompt for template='%s' v%s",
        template.key, template.version,
    )

    # Step 2: Validate context completeness
    validate_context(template, context)

    # Step 3: Render user prompt
    rendered_user_prompt = render_prompt(template, context)

    # Step 4: Safety injection scan
    apply_safety_check(rendered_user_prompt)

    # Step 5: Prepend safety guardrail prefix
    final_user_prompt = _SAFETY_PREFIX + rendered_user_prompt

    logger.info(
        "PromptEngine: Prompt built successfully — template='%s', "
        "context_keys=%s, prompt_chars=%d",
        template.key,
        sorted(context.keys()),
        len(final_user_prompt),
    )

    # Step 6: Return immutable PromptPackage
    return PromptPackage(
        template_key=template.key,
        template_version=template.version,
        engine_name=template.engine,
        system_instruction=template.system_instruction,
        user_prompt=final_user_prompt,
        context_keys=tuple(sorted(context.keys())),
    )
