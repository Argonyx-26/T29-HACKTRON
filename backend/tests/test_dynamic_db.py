import uuid
from app.database import SessionLocal
from app.models.all_models import Question, MisconceptionPattern, Chapter, Skill

def test_dynamic_question_insertion_and_retrieval():
    """
    Verifies that the database is the source of truth:
    Adding a question dynamically makes it immediately available without frontend code change.
    """
    db = SessionLocal()
    try:
        chap = db.query(Chapter).first()
        skill = db.query(Skill).filter(Skill.chapter_id == chap.id).first()
        
        q_id = f"q_dynamic_{uuid.uuid4().hex[:6]}"
        q_text = "Solve 4(x + 3) = 28"
        new_q = Question(
            id=q_id,
            chapter_id=chap.id,
            skill_id=skill.id,
            question_text=q_text,
            correct_answer="4",
            expected_steps=["4(x + 3) = 28", "4x + 12 = 28", "4x = 16", "x = 4"],
            difficulty="medium",
            source_type="custom_admin",
            active=True
        )
        db.add(new_q)
        db.commit()

        # Query back
        fetched = db.query(Question).filter(Question.id == q_id).first()
        assert fetched is not None
        assert fetched.question_text == q_text
        assert fetched.correct_answer == "4"
    finally:
        db.close()

def test_dynamic_pattern_library_expansion():
    """
    Verifies that inserting a pattern increases the active library count dynamically.
    """
    db = SessionLocal()
    try:
        initial_count = db.query(MisconceptionPattern).filter(MisconceptionPattern.status == "active").count()
        skill = db.query(Skill).first()

        pat_id = f"PAT_DYN_{uuid.uuid4().hex[:6]}"
        new_pat = MisconceptionPattern(
            id=pat_id,
            name="Dynamic Test Pattern",
            description="Dynamically inserted pattern for testing.",
            skill_id=skill.id,
            rule_type="SIGN_CHECK",
            rule_config={},
            classification="procedural",
            source="admin",
            status="active"
        )
        db.add(new_pat)
        db.commit()

        new_count = db.query(MisconceptionPattern).filter(MisconceptionPattern.status == "active").count()
        assert new_count == initial_count + 1
    finally:
        db.close()
