from app.database import SessionLocal
from app.services.llm_reasoning import LLMReasoningService
from app.schemas.all_schemas import LLMDiagnosisSchema

def test_strict_llm_schema_validation():
    valid_json = """{
        "classification": "procedural",
        "likely_misconception": "Premature Inversion Error",
        "confidence": 0.85,
        "reasoning": "Student inverted division prior to grouping like terms.",
        "reusable_pattern": true,
        "principle_violated": "Order of algebraic isolation operations"
    }"""
    schema = LLMReasoningService._parse_and_validate(valid_json)
    assert isinstance(schema, LLMDiagnosisSchema)
    assert schema.classification == "procedural"
    assert schema.reusable_pattern is True

def test_safe_deterministic_fallback():
    db = SessionLocal()
    try:
        res = LLMReasoningService._safe_simulated_ai_reasoning(
            db=db,
            request_id="test_req_123",
            question_text="3(x + 1) + 2x = 18",
            student_answer="9",
            work_shown=["5x + 3 = 18", "x + 3 = 18 / 5"],
            skill_name="Multi-Step Equations",
            skill_id="sk_multi_06"
        )
        assert res["matched"] is True
        assert res["engine_used"] == "llm_fallback"
        assert res["confidence"] >= 0.80
        assert res["mistake_card"] is not None
    finally:
        db.close()
