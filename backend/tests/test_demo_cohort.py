from app.database import SessionLocal
from app.seed.seed_data import init_db, seed_database
from app.services.analytics_service import AnalyticsService

def test_student_a_student_b_same_score_different_twins():
    """
    Core Product Thesis Verification:
    score(Student A) == score(Student B) == 60%
    BUT twin(Student A) != twin(Student B)
    """
    init_db()
    seed_database(force_reset=True)
    db = SessionLocal()
    try:
        twin_a = AnalyticsService.get_student_knowledge_twin(db, "student_a")
        twin_b = AnalyticsService.get_student_knowledge_twin(db, "student_b")

        # 1. Verify same approximate score percentage (60%)
        assert abs(twin_a["overall_score_percentage"] - 60.0) < 1.0
        assert abs(twin_b["overall_score_percentage"] - 60.0) < 1.0

        # 2. Extract skill masteries
        skills_a = {s["skill_code"]: s["mastery_probability"] for s in twin_a["skills"]}
        skills_b = {s["skill_code"]: s["mastery_probability"] for s in twin_b["skills"]}

        # 3. Student A is weak in Distribution (DIST-04), Student B is strong in Distribution
        assert skills_a["DIST-04"] < 0.50
        assert skills_b["DIST-04"] > 0.70

        # 4. Student B is weak in Combining Like Terms (LIKE-03), Student A is strong in Like Terms
        assert skills_b["LIKE-03"] < 0.50
        assert skills_a["LIKE-03"] > 0.70

        # 5. Misconceptions are radically different
        misconceptions_a = [m["pattern_name"] for m in twin_a["active_misconceptions"]]
        assert "Partial Distribution" in misconceptions_a

        misconceptions_b = [m["pattern_name"] for m in twin_b["active_misconceptions"]]
        assert "Combining Unlike Terms" in misconceptions_b
    finally:
        db.close()
