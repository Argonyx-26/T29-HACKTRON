"""
LLM Reasoning Service
Provides generative cognitive insights, learning gap explanations,
and personalized study recommendations with robust deterministic fallback.
"""
from typing import Dict, Any, List, Optional
from app.config import settings

class LLMReasoningService:
    def __init__(self):
        self.openai_key = settings.OPENAI_API_KEY
        self.gemini_key = settings.GEMINI_API_KEY

    def is_llm_configured(self) -> bool:
        return bool(self.openai_key or self.gemini_key)

    def generate_twin_diagnosis(
        self,
        student_name: str,
        overall_mastery: float,
        struggling_topics: List[Dict[str, Any]],
        mastered_topics: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Synthesizes an intelligent diagnosis of student learning trajectory.
        Falls back seamlessly to algorithmic synthesis if LLM is unavailable.
        """
        if self.is_llm_configured():
            try:
                return self._call_llm_for_diagnosis(
                    student_name, overall_mastery, struggling_topics, mastered_topics
                )
            except Exception:
                # Silently fall back to deterministic synthesis on API error
                pass

        return self._deterministic_fallback_diagnosis(
            student_name, overall_mastery, struggling_topics, mastered_topics
        )

    def explain_misconception(
        self,
        topic_title: str,
        score: float,
        attempts: int
    ) -> Dict[str, Any]:
        """
        Generates targeted feedback explaining likely conceptual hurdles.
        """
        if self.is_llm_configured():
            try:
                return self._call_llm_for_misconception(topic_title, score, attempts)
            except Exception:
                pass

        return self._deterministic_fallback_misconception(topic_title, score, attempts)

    # ------------------ Deterministic Fallback Logic ------------------

    def _deterministic_fallback_diagnosis(
        self,
        student_name: str,
        overall_mastery: float,
        struggling_topics: List[Dict[str, Any]],
        mastered_topics: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        struggling_names = [t.get("title", "Topic") for t in struggling_topics]
        mastered_names = [t.get("title", "Topic") for t in mastered_topics]

        if overall_mastery >= 0.85:
            summary = (
                f"{student_name} demonstrates exceptional conceptual mastery across the curriculum, "
                f"retaining high proficiency in {len(mastered_names)} key areas."
            )
            recommendation = "Recommend advanced enrichment problems and peer mentoring assignments."
        elif overall_mastery >= 0.60:
            summary = (
                f"{student_name} possesses a solid foundational grasp, showing proficiency in {len(mastered_names)} topics, "
                f"with emerging gaps in {', '.join(struggling_names[:2]) if struggling_names else 'select modules'}."
            )
            recommendation = "Focus on targeted reinforcement drills before transitioning to subsequent chapters."
        else:
            summary = (
                f"{student_name} is currently experiencing cognitive bottlenecks in fundamental topics "
                f"({', '.join(struggling_names[:3]) if struggling_names else 'core prerequisites'})."
            )
            recommendation = "Immediate pedagogical intervention advised: 1-on-1 concept review and prerequisite remediation."

        return {
            "source": "deterministic_fallback",
            "student_name": student_name,
            "overall_mastery": overall_mastery,
            "summary": summary,
            "recommendation": recommendation,
            "priority_focus": struggling_names[:3]
        }

    def _deterministic_fallback_misconception(
        self,
        topic_title: str,
        score: float,
        attempts: int
    ) -> Dict[str, Any]:
        return {
            "source": "deterministic_fallback",
            "topic": topic_title,
            "score": score,
            "attempts": attempts,
            "diagnosis": (
                f"Multiple failed attempts ({attempts}) on {topic_title} indicate a foundational misunderstanding "
                f"of prerequisite abstractions rather than a simple calculation slip."
            ),
            "remedy": f"Review definition and worked examples of {topic_title} step-by-step."
        }

    # ------------------ LLM Remote Providers (Stubs) ------------------

    def _call_llm_for_diagnosis(self, *args, **kwargs) -> Dict[str, Any]:
        # Placeholder for external LLM API call (e.g. OpenAI / Gemini)
        raise NotImplementedError("Live LLM API credentials or network connection required")

    def _call_llm_for_misconception(self, *args, **kwargs) -> Dict[str, Any]:
        raise NotImplementedError("Live LLM API credentials or network connection required")

llm_reasoning_service = LLMReasoningService()
