import pytest
from app.services.deterministic_engine import DeterministicMisconceptionEngine

@pytest.fixture
def sample_rules():
    return [
        {
            "id": "PAT_DIST_PARTIAL",
            "name": "Partial Distribution",
            "description": "Distributed to variable but not to constant",
            "rule_type": "DISTRIBUTION_CHECK",
            "rule_config": {"require_all_terms": True},
            "classification": "procedural",
            "intervention_type": "worked_example",
            "principle_text": "a(b + c) = ab + ac",
            "skill_name": "Distributive Property"
        },
        {
            "id": "PAT_LIKE_UNLIKE",
            "name": "Combining Unlike Terms",
            "description": "Adding variable terms to constant terms",
            "rule_type": "LIKE_TERM_CHECK",
            "rule_config": {},
            "classification": "conceptual",
            "intervention_type": "conceptual_review",
            "principle_text": "Only like terms can be combined.",
            "skill_name": "Combining Like Terms"
        },
        {
            "id": "PAT_ISOL_ONE_SIDE",
            "name": "Single-Sided Operation",
            "description": "Applied operation to one side only",
            "rule_type": "SIDE_BALANCE_CHECK",
            "rule_config": {},
            "classification": "procedural",
            "intervention_type": "worked_example",
            "principle_text": "Operations must be bilateral.",
            "skill_name": "Isolating the Variable"
        },
        {
            "id": "PAT_ISOL_WRONG_INV",
            "name": "Wrong Inverse Operation",
            "description": "Subtracted instead of divided",
            "rule_type": "OPERATION_CHECK",
            "rule_config": {},
            "classification": "procedural",
            "intervention_type": "worked_example",
            "principle_text": "Use division to invert multiplication.",
            "skill_name": "Isolating the Variable"
        }
    ]

def test_partial_distribution_detected(sample_rules):
    engine = DeterministicMisconceptionEngine()
    result = engine.evaluate_attempt(
        question_text="3(x + 2) = 15",
        correct_answer="3",
        student_answer="4.33",
        work_shown=["3(x + 2) = 15", "3x + 2 = 15", "3x = 13", "x = 4.33"],
        skill_id="sk_dist_04",
        pattern_rules=sample_rules
    )
    assert result["matched"] is True
    assert result["is_correct"] is False
    assert result["engine_used"] == "deterministic"
    assert result["pattern_id"] == "PAT_DIST_PARTIAL"
    assert result["likely_misconception"] == "Partial Distribution"
    assert result["mistake_card"] is not None

def test_combining_unlike_terms_detected(sample_rules):
    engine = DeterministicMisconceptionEngine()
    result = engine.evaluate_attempt(
        question_text="4x + 7 = 19",
        correct_answer="3",
        student_answer="1.72",
        work_shown=["4x + 7 = 19", "11x = 19", "x = 1.72"],
        skill_id="sk_like_03",
        pattern_rules=sample_rules
    )
    assert result["matched"] is True
    assert result["pattern_id"] == "PAT_LIKE_UNLIKE"
    assert result["classification"] == "conceptual"

def test_side_balance_error_detected(sample_rules):
    engine = DeterministicMisconceptionEngine()
    result = engine.evaluate_attempt(
        question_text="x - 5 = 12",
        correct_answer="17",
        student_answer="12",
        work_shown=["x - 5 = 12", "x = 12"],
        skill_id="sk_isol_05",
        pattern_rules=sample_rules
    )
    assert result["matched"] is True
    assert result["pattern_id"] == "PAT_ISOL_ONE_SIDE"

def test_wrong_inverse_operation_detected(sample_rules):
    engine = DeterministicMisconceptionEngine()
    result = engine.evaluate_attempt(
        question_text="4x = 12",
        correct_answer="3",
        student_answer="8",
        work_shown=["4x = 12", "x = 8"],
        skill_id="sk_isol_05",
        pattern_rules=sample_rules
    )
    assert result["matched"] is True
    assert result["pattern_id"] == "PAT_ISOL_WRONG_INV"

def test_correct_solution_passes(sample_rules):
    engine = DeterministicMisconceptionEngine()
    result = engine.evaluate_attempt(
        question_text="3(x + 2) = 15",
        correct_answer="3",
        student_answer="3",
        work_shown=["3x + 6 = 15", "3x = 9", "x = 3"],
        skill_id="sk_dist_04",
        pattern_rules=sample_rules
    )
    assert result["is_correct"] is True
    assert result["matched"] is True
    assert result["classification"] == "correct"
