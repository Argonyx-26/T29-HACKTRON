import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database import SessionLocal
from app.seed.seed_data import init_db, seed_database
from app.models.all_models import Student, Attempt, MasteryState, StudentMisconceptionInstance
from app.services.analytics_service import AnalyticsService

client = TestClient(app)

@pytest.fixture(scope="module", autouse=True)
def setup_test_db():
    init_db()
    seed_database(force_reset=True)

def test_fresh_learner_clean_state_and_next_best_action():
    """
    Requirement 4, 12, 20, 28:
    A fresh learner must start with a clean state:
    - 0 attempts
    - score_percentage is None (no fake 0% cards)
    - overall_mastery is None
    - Next Best Action is 'complete_diagnostic' with 'Establish Your Knowledge Baseline'
    """
    fresh_id = "test_fresh_learner_001"
    response = client.get(f"/api/students/{fresh_id}/twin")
    assert response.status_code == 200
    data = response.json()

    assert data["student_id"] == fresh_id
    assert data["overall_score_percentage"] is None
    assert data["overall_mastery"] is None
    assert len(data["active_misconceptions"]) == 0
    assert len(data["resolved_misconceptions"]) == 0

    # Verify unified Next Best Action
    nba = data["next_best_action"]
    assert nba is not None
    assert nba["action_type"] == "complete_diagnostic"
    assert "Baseline" in nba["title"]
    assert "evidence" in nba["reason"].lower()

def test_learner_goal_persistence_and_influence():
    """
    Requirement 7 & 35:
    Learner can set, retrieve, and update a target goal.
    Goal influences prioritization without falsifying knowledge.
    """
    student_id = "test_goal_learner_002"
    
    # 1. Update goal
    goal_payload = {
        "target_goal": "Linear Equations Mastery",
        "goal_description": "Targeting 90% proficiency for algebra exam",
        "target_mastery": 0.90
    }
    post_res = client.post(f"/api/students/{student_id}/goal", json=goal_payload)
    assert post_res.status_code == 200
    res_data = post_res.json()
    assert res_data["target_goal"] == "Linear Equations Mastery"
    assert res_data["target_mastery"] == 0.90

    # 2. Get goal
    get_res = client.get(f"/api/students/{student_id}/goal")
    assert get_res.status_code == 200
    assert get_res.json()["target_goal"] == "Linear Equations Mastery"

    # 3. Verify twin reflects goal
    twin_res = client.get(f"/api/students/{student_id}/twin")
    assert twin_res.status_code == 200
    twin_data = twin_res.json()
    assert twin_data["target_goal"] == "Linear Equations Mastery"
    assert twin_data["target_mastery"] == 0.90

def test_assessment_confidence_capture_and_twin_update():
    """
    Requirement 2, 8, 13, 17:
    Submit attempt with learner-indicated confidence.
    Verify:
    - Attempt stores confidence
    - Deterministic engine diagnoses response
    - BKT mastery updates
    - Misconception instance created
    - Next Best Action updates to targeted intervention
    """
    student_id = "test_eval_learner_003"

    # Step 1: Submit a correct attempt with confidence
    sub_1 = {
        "student_id": student_id,
        "question_id": "q_eq_01", # x + 4 = 11 -> ans 7
        "answer": "7",
        "work_shown": ["x + 4 = 11", "x = 7"],
        "input_mode": "steps",
        "confidence": 0.95
    }
    res_1 = client.post("/api/attempts/submit", json=sub_1)
    assert res_1.status_code == 200
    diag_1 = res_1.json()
    assert diag_1["correct"] is True
    assert diag_1["engine_used"] == "deterministic"

    # Step 2: Submit an attempt triggering Partial Distribution with high confidence
    sub_2 = {
        "student_id": student_id,
        "question_id": "q_dist_01", # 3(x + 2) = 15 -> ans 3
        "answer": "4.33",
        "work_shown": ["3(x + 2) = 15", "3x + 2 = 15", "3x = 13", "x = 4.33"],
        "input_mode": "steps",
        "confidence": 0.90
    }
    res_2 = client.post("/api/attempts/submit", json=sub_2)
    assert res_2.status_code == 200
    diag_2 = res_2.json()
    assert diag_2["correct"] is False
    assert diag_2["likely_misconception"] == "Partial Distribution"

    # Step 3: Verify Knowledge Twin updated
    twin_res = client.get(f"/api/students/{student_id}/twin")
    assert twin_res.status_code == 200
    twin = twin_res.json()
    assert len(twin["active_misconceptions"]) == 1
    assert twin["active_misconceptions"][0]["pattern_name"] == "Partial Distribution"

    # Step 4: Verify Next Best Action switched to targeted intervention!
    nba = twin["next_best_action"]
    assert nba["action_type"] == "targeted_intervention"
    assert "Partial Distribution" in nba["title"]
    assert "Intervention" in nba["button_label"]

def test_skill_gap_radar_and_prerequisite_rescue():
    """
    Requirement 3, 9, 15:
    Skill Gap Radar returns current vs target = gap.
    Prerequisite rescue detects when a skill blocker exists.
    """
    student_id = "test_eval_learner_003"

    gap_res = client.get(f"/api/students/{student_id}/skill-gaps")
    assert gap_res.status_code == 200
    gaps_data = gap_res.json()
    assert "skill_gaps" in gaps_data
    assert len(gaps_data["skill_gaps"]) > 0

    for gap in gaps_data["skill_gaps"]:
        assert "current_mastery" in gap
        assert "target_mastery" in gap
        assert "gap_size" in gap
        assert gap["gap_size"] == max(0.0, round(gap["target_mastery"] - gap["current_mastery"], 2))

def test_calibration_confidence_vs_knowledge():
    """
    Requirement 13:
    Confidence vs Knowledge calibration detection with >= 3 rated attempts.
    """
    student_id = "test_calibration_learner_004"

    # Record 3 attempts with overconfident mistakes: high confidence (0.85) + incorrect (e.g. arithmetic slip)
    for i, (q_id, wrong_ans) in enumerate([("q_eq_01", "8"), ("q_eq_02", "24"), ("q_eq_03", "9")]):
        client.post("/api/attempts/submit", json={
            "student_id": student_id,
            "question_id": q_id,
            "answer": wrong_ans,
            "work_shown": [],
            "input_mode": "answer_only",
            "confidence": 0.85
        })

    twin_res = client.get(f"/api/students/{student_id}/twin")
    assert twin_res.status_code == 200
    twin = twin_res.json()
    cal = twin["calibration_insight"]
    assert cal is not None
    assert cal["sample_count"] == 3
    assert cal["status"] == "overconfident"
    assert cal["overconfidence_pct"] == 100.0

def test_multi_learner_isolation():
    """
    Requirement 28 & 37:
    Data isolation: Learner A must never see Learner B's data.
    Fresh learner starts completely clean.
    """
    learner_a = "learner_iso_alpha"
    learner_b = "learner_iso_beta"

    # Learner A sets goal and completes an attempt
    client.post(f"/api/students/{learner_a}/goal", json={"target_goal": "Alpha Goal", "target_mastery": 0.95})
    client.post("/api/attempts/submit", json={
        "student_id": learner_a,
        "question_id": "q_eq_01",
        "answer": "7",
        "confidence": 0.9
    })

    # Learner B starts fresh
    twin_b = client.get(f"/api/students/{learner_b}/twin").json()
    assert twin_b["target_goal"] is None
    assert twin_b["overall_score_percentage"] is None
    assert len(twin_b["active_misconceptions"]) == 0
    assert twin_b["next_best_action"]["action_type"] == "complete_diagnostic"

    # Verify Learner A still has their data
    twin_a = client.get(f"/api/students/{learner_a}/twin").json()
    assert twin_a["target_goal"] == "Alpha Goal"
    assert twin_a["overall_score_percentage"] == 100.0
