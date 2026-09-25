import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database import SessionLocal
from app.models.all_models import Student, Attempt, MasteryState
from app.seed.seed_data import init_db, seed_database

client = TestClient(app)

@pytest.fixture(autouse=True)
def setup_db():
    init_db()
    seed_database(force_reset=True, include_demo_cohort=True)

def test_student_upsert_and_isolation():
    # 1. Register student Harshit
    res = client.post("/api/students", json={
        "id": "harshit_uuid_001",
        "name": "Harshit",
        "role": "student"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["id"] == "harshit_uuid_001"
    assert data["name"] == "Harshit"
    assert data["role"] == "student"

    # 2. Fresh learner has zero progress and zero activity
    prog_res = client.get("/api/students/harshit_uuid_001/progress")
    assert prog_res.status_code == 200
    prog = prog_res.json()
    assert prog["total_attempts"] == 0
    assert prog["correct_attempts"] == 0
    assert prog["score_percentage"] is None
    assert prog["assessed_skills_count"] == 0
    assert len(prog["recent_activity"]) == 0

    act_res = client.get("/api/students/harshit_uuid_001/activity")
    assert act_res.status_code == 200
    assert len(act_res.json()) == 0

    # 3. Submit an attempt for Harshit
    att_res = client.post("/api/attempts/submit", json={
        "student_id": "harshit_uuid_001",
        "question_id": "q_eq_01",
        "answer": "7",
        "work_shown": ["x + 4 = 11", "x = 7"],
        "input_mode": "text"
    })
    assert att_res.status_code == 200
    att_data = att_res.json()
    assert att_data["correct"] is True

    # 4. Verify attempt is reflected in progress
    prog_after = client.get("/api/students/harshit_uuid_001/progress").json()
    assert prog_after["total_attempts"] == 1
    assert prog_after["correct_attempts"] == 1
    assert prog_after["score_percentage"] == 100
    assert prog_after["assessed_skills_count"] == 1
    assert len(prog_after["recent_activity"]) == 1

    # 5. Verify attempt is reflected in activity
    act_after = client.get("/api/students/harshit_uuid_001/activity").json()
    assert len(act_after) == 1
    assert act_after[0]["user_id"] == "harshit_uuid_001"
    assert act_after[0]["score_or_result"] == "Correct"

    # 6. Create second student Alex and verify complete isolation
    res_b = client.post("/api/students", json={
        "id": "alex_uuid_002",
        "name": "Alex",
        "role": "student"
    })
    assert res_b.status_code == 200

    prog_b = client.get("/api/students/alex_uuid_002/progress").json()
    assert prog_b["total_attempts"] == 0
    assert prog_b["correct_attempts"] == 0
    assert prog_b["score_percentage"] is None
    assert len(prog_b["recent_activity"]) == 0

    act_b = client.get("/api/students/alex_uuid_002/activity").json()
    assert len(act_b) == 0

    # 7. Harshit's data is still intact
    prog_a_recheck = client.get("/api/students/harshit_uuid_001/progress").json()
    assert prog_a_recheck["total_attempts"] == 1
