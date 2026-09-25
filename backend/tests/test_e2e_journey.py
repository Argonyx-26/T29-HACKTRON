import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database import SessionLocal
from app.seed.seed_data import init_db, seed_database
from app.models.all_models import Student, Attempt, MasteryState, StudentMisconceptionInstance, Intervention

client = TestClient(app)

@pytest.fixture(scope="module", autouse=True)
def setup_test_db():
    init_db()
    seed_database(force_reset=True)

def test_full_critical_end_to_end_journey_and_isolation():
    """
    Requirement 37: CRITICAL END-TO-END ACCEPTANCE TEST
    Tests the complete learner lifecycle:
    Fresh Login -> Home -> Set Goal -> Learn (Subjects/Chapters) -> Start Diagnostic ->
    Answer with Confidence -> Submit -> Diagnosis -> Twin Update -> Skill Gap ->
    Personalized Intervention -> Retest -> Measure Change -> Update Twin & Mistakes ->
    Update Progress -> Recompute Next Best Action -> Re-login persistence.
    Then verifies independent second fresh learner with complete data isolation.
    """
    l1_id = "e2e_journey_learner_1"

    # 1. FRESH REGISTRATION / LOGIN
    reg_res = client.post("/api/students", json={
        "id": l1_id,
        "name": "Alex Mercer",
        "role": "student"
    })
    assert reg_res.status_code == 200

    # 2. HOME INITIAL CHECK (Clean state, no fake data)
    twin_init = client.get(f"/api/students/{l1_id}/twin").json()
    assert twin_init["overall_score_percentage"] is None
    assert twin_init["overall_mastery"] is None
    assert len(twin_init["active_misconceptions"]) == 0
    assert twin_init["next_best_action"]["action_type"] == "complete_diagnostic"
    assert "Establish" in twin_init["next_best_action"]["title"]

    # 3. SET LEARNER GOAL
    goal_res = client.post(f"/api/students/{l1_id}/goal", json={
        "target_goal": "Mastery of Linear Equations",
        "goal_description": "Targeting 90% score on upcoming exam",
        "target_mastery": 0.90
    })
    assert goal_res.status_code == 200
    assert goal_res.json()["target_goal"] == "Mastery of Linear Equations"

    # 4. LEARN: CHOOSE SUBJECT & CHAPTER FROM DATABASE
    subjects = client.get("/api/subjects").json()
    assert len(subjects) > 0
    math_subj = [s for s in subjects if s["name"] == "Mathematics"][0]
    
    chapters = client.get(f"/api/subjects/{math_subj['id']}/chapters").json()
    assert len(chapters) > 0
    chap = chapters[0]

    questions = client.get(f"/api/chapters/{chap['id']}/questions").json()
    assert len(questions) >= 5

    # 5. START DIAGNOSTIC & ANSWER QUESTIONS WITH CONFIDENCE
    # Response 1: Correct with high confidence
    sub_1 = client.post("/api/attempts/submit", json={
        "student_id": l1_id,
        "question_id": "q_eq_01",
        "answer": "7",
        "work_shown": ["x + 4 = 11", "x = 7"],
        "input_mode": "steps",
        "confidence": 0.95
    }).json()
    assert sub_1["correct"] is True

    # Response 2: Trigger Partial Distribution misconception with high confidence
    sub_2 = client.post("/api/attempts/submit", json={
        "student_id": l1_id,
        "question_id": "q_dist_01",
        "answer": "4.33",
        "work_shown": ["3(x + 2) = 15", "3x + 2 = 15", "3x = 13", "x = 4.33"],
        "input_mode": "steps",
        "confidence": 0.85
    }).json()
    assert sub_2["correct"] is False
    assert sub_2["likely_misconception"] == "Partial Distribution"

    # 6. KNOWLEDGE TWIN UPDATE & SKILL GAP IDENTIFIED
    twin_after_diag = client.get(f"/api/students/{l1_id}/twin").json()
    assert len(twin_after_diag["active_misconceptions"]) == 1
    assert twin_after_diag["active_misconceptions"][0]["pattern_name"] == "Partial Distribution"
    assert twin_after_diag["overall_score_percentage"] == 50.0

    # Skill Gap Radar shows gap for Distributive Property
    gaps = client.get(f"/api/students/{l1_id}/skill-gaps").json()["skill_gaps"]
    dist_gap = [g for g in gaps if g["skill_code"] == "DIST-04"][0]
    assert dist_gap["current_mastery"] < 0.60
    assert dist_gap["recommended_action"] == "Intervention"

    # Next Best Action immediately shifted to targeted intervention
    nba = twin_after_diag["next_best_action"]
    assert nba["action_type"] == "targeted_intervention"
    assert "Partial Distribution" in nba["title"]
    assert "Clear Blocker" in nba["title"]

    # 7. PERSONALIZED INTERVENTION
    route_res = client.get(f"/api/interventions/route?student_id={l1_id}&skill_id=sk_dist_04&pattern_id=PAT_DIST_PARTIAL&classification=procedural")
    assert route_res.status_code == 200
    intervention = route_res.json()
    assert intervention["title"] is not None
    assert "content" in intervention

    # 8. RETEST: MEASURE CHANGE AND RESOLVE MISCONCEPTION
    retest_res = client.post("/api/interventions/retest", json={
        "student_id": l1_id,
        "intervention_id": intervention["id"],
        "question_id": "q_dist_02", # 4(x + 3) = 28 -> ans 4
        "answer": "4",
        "work_shown": ["4(x + 3) = 28", "4x + 12 = 28", "4x = 16", "x = 4"]
    }).json()
    assert retest_res["correct"] is True
    assert retest_res["misconception_resolved"] is True
    assert retest_res["after_mastery"] > retest_res["before_mastery"]

    # 9. UPDATE MISTAKE HISTORY
    mistakes = client.get(f"/api/students/{l1_id}/mistakes").json()
    assert len(mistakes["active_misconceptions"]) == 0
    assert len(mistakes["resolved_misconceptions"]) == 1
    assert mistakes["resolved_misconceptions"][0]["pattern_name"] == "Partial Distribution"

    # 10. UPDATE PROGRESS & ACTIVITY
    progress = client.get(f"/api/students/{l1_id}/progress").json()
    assert progress["total_attempts"] >= 2
    assert len(progress["recent_activity"]) >= 2
    activity_types = [a["type"] for a in progress["recent_activity"]]
    assert "assessment" in activity_types
    assert "retest" in activity_types

    # 11. RECOMPUTE NEXT BEST ACTION (Blocker resolved, continues to next learning target)
    twin_final = client.get(f"/api/students/{l1_id}/twin").json()
    final_nba = twin_final["next_best_action"]
    assert final_nba["action_type"] != "targeted_intervention" # Blocker was cleared!

    # 12. LOGOUT & RELOGIN PERSISTENCE
    twin_relogin = client.get(f"/api/students/{l1_id}/twin").json()
    assert twin_relogin["target_goal"] == "Mastery of Linear Equations"
    assert len(twin_relogin["resolved_misconceptions"]) == 1

    # =========================================================================
    # 13. MULTI-LEARNER ISOLATION VERIFICATION
    # =========================================================================
    l2_id = "e2e_journey_learner_2_fresh"
    client.post("/api/students", json={
        "id": l2_id,
        "name": "Bianca Vance",
        "role": "student"
    })

    twin_l2 = client.get(f"/api/students/{l2_id}/twin").json()
    # Verify Learner 1's data does NOT leak to Learner 2
    assert twin_l2["target_goal"] is None
    assert twin_l2["overall_score_percentage"] is None
    assert twin_l2["overall_mastery"] is None
    assert len(twin_l2["active_misconceptions"]) == 0
    assert len(twin_l2["resolved_misconceptions"]) == 0
    assert twin_l2["next_best_action"]["action_type"] == "complete_diagnostic"

    mistakes_l2 = client.get(f"/api/students/{l2_id}/mistakes").json()
    assert len(mistakes_l2["active_misconceptions"]) == 0
    assert len(mistakes_l2["resolved_misconceptions"]) == 0

    progress_l2 = client.get(f"/api/students/{l2_id}/progress").json()
    assert progress_l2["total_attempts"] == 0
    assert len(progress_l2["recent_activity"]) == 0
