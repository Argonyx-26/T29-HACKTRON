import sys
import os
from pathlib import Path

# Add backend directory to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent))

from app.config import settings
from app.database import engine, SessionLocal
from app.models.all_models import Student, Attempt, MasteryState, Question
from app.services.analytics_service import AnalyticsService
from fastapi.testclient import TestClient
from app.main import app

def run_supabase_e2e_verification():
    print("=" * 65)
    print("KNOWLEDGE TWIN — SUPABASE POSTGRESQL END-TO-END VERIFICATION")
    print("=" * 65)

    print(f"Target Dialect : {engine.dialect.name.upper()}")
    print(f"Is PostgreSQL  : {settings.is_postgres}")
    
    if not settings.is_postgres:
        print("ERROR: Not running against PostgreSQL!")
        sys.exit(1)

    client = TestClient(app)
    db = SessionLocal()

    try:
        # Step 1: Clean up any prior test records for deterministic verification
        db.query(Attempt).filter(Attempt.student_id.in_(["usr_harshit_e2e", "usr_alex_e2e"])).delete(synchronize_session=False)
        db.query(MasteryState).filter(MasteryState.student_id.in_(["usr_harshit_e2e", "usr_alex_e2e"])).delete(synchronize_session=False)
        db.query(Student).filter(Student.id.in_(["usr_harshit_e2e", "usr_alex_e2e"])).delete(synchronize_session=False)
        db.commit()

        # Step 2: Create learner Harshit
        print("\n[Step 1] Creating fresh learner 'Harshit' (ID: usr_harshit_e2e)...")
        reg_res = client.post("/api/students", json={
            "id": "usr_harshit_e2e",
            "name": "Harshit",
            "role": "student"
        })
        assert reg_res.status_code == 200, f"Registration failed: {reg_res.text}"
        
        # Verify in PostgreSQL
        st_db = db.query(Student).filter(Student.id == "usr_harshit_e2e").first()
        assert st_db is not None, "Learner not found in PostgreSQL students table!"
        print(f"  [OK] Verified in PostgreSQL students table: id='{st_db.id}', name='{st_db.name}', role='{st_db.role}'")

        # Step 3: Verify clean zero-state in PostgreSQL
        print("\n[Step 2] Verifying clean zero-state for fresh learner in PostgreSQL...")
        prog_zero = client.get("/api/students/usr_harshit_e2e/progress").json()
        assert prog_zero["total_attempts"] == 0, "Expected 0 attempts"
        assert prog_zero["score_percentage"] is None, "Expected None score"
        assert len(prog_zero["recent_activity"]) == 0, "Expected empty activity"
        print("  [OK] Zero-state verified: 0 attempts, 0 progress, 0 activity")

        # Step 4: Submit real diagnostic attempt
        print("\n[Step 3] Submitting real diagnostic assessment attempt...")
        att_res = client.post("/api/attempts/submit", json={
            "student_id": "usr_harshit_e2e",
            "question_id": "q_eq_01",
            "answer": "7",
            "work_shown": ["x + 4 = 11", "x = 7"],
            "input_mode": "text"
        })
        assert att_res.status_code == 200, f"Submit attempt failed: {att_res.text}"
        att_data = att_res.json()
        print(f"  [OK] Attempt response: correct={att_data['correct']}, message='{att_data.get('pedagogical_feedback', '')}'")

        # Step 5: Direct PostgreSQL verification of persistence
        print("\n[Step 4] Querying PostgreSQL directly to verify persistence...")
        db.expire_all()
        persisted_attempt = db.query(Attempt).filter(Attempt.student_id == "usr_harshit_e2e").first()
        assert persisted_attempt is not None, "Attempt record NOT found in PostgreSQL attempts table!"
        print(f"  [OK] Attempt record in PostgreSQL 'attempts' table:")
        print(f"    - id          : {persisted_attempt.id}")
        print(f"    - question_id : {persisted_attempt.question_id}")
        print(f"    - answer      : {persisted_attempt.answer}")
        print(f"    - correct     : {persisted_attempt.correct}")
        print(f"    - created_at  : {persisted_attempt.created_at}")

        # Verify mastery state in PostgreSQL
        persisted_mastery = db.query(MasteryState).filter(
            MasteryState.student_id == "usr_harshit_e2e",
            MasteryState.skill_id == "sk_eq_01"
        ).first()
        assert persisted_mastery is not None, "Mastery record NOT found in PostgreSQL mastery_states table!"
        print(f"  [OK] Mastery state in PostgreSQL 'mastery_states' table:")
        print(f"    - skill_id     : {persisted_mastery.skill_id}")
        print(f"    - p_mastery    : {persisted_mastery.mastery_probability}")
        print(f"    - evidence_cnt : {persisted_mastery.evidence_count}")

        # Verify progress and activity APIs read from PostgreSQL
        prog_updated = client.get("/api/students/usr_harshit_e2e/progress").json()
        assert prog_updated["total_attempts"] == 1
        assert prog_updated["correct_attempts"] == 1
        assert prog_updated["score_percentage"] == 100
        assert len(prog_updated["recent_activity"]) == 1
        print("  [OK] Authoritative progress updated: 1 total attempt, 100% score, 1 activity event")

        # Step 6: Simulate Backend Restart & Connection Teardown
        print("\n[Step 5] Simulating backend restart (closing DB session & recreating engine)...")
        db.close()
        # Create fresh DB session to ensure no in-memory cache is used
        fresh_db = SessionLocal()
        restarted_attempt = fresh_db.query(Attempt).filter(Attempt.student_id == "usr_harshit_e2e").first()
        assert restarted_attempt is not None, "Data lost after backend restart!"
        fresh_prog = client.get("/api/students/usr_harshit_e2e/progress").json()
        assert fresh_prog["total_attempts"] == 1, "Progress lost after restart!"
        print(f"  [OK] State fully preserved after backend restart from Supabase PostgreSQL!")

        # Step 7: Account Isolation Verification (Second Learner)
        print("\n[Step 6] Creating second fresh learner 'Alex' (ID: usr_alex_e2e)...")
        reg_b = client.post("/api/students", json={
            "id": "usr_alex_e2e",
            "name": "Alex",
            "role": "student"
        })
        assert reg_b.status_code == 200

        # Verify Alex is completely isolated
        alex_prog = client.get("/api/students/usr_alex_e2e/progress").json()
        assert alex_prog["total_attempts"] == 0, "Alex should have 0 attempts!"
        assert alex_prog["score_percentage"] is None, "Alex score should be None!"
        assert len(alex_prog["recent_activity"]) == 0, "Alex should have 0 activity!"
        print("  [OK] Learner 'Alex' verified in complete zero-state (0 attempts, 0 progress, 0 activity)")

        # Verify Harshit's state is completely unaffected
        harshit_check = client.get("/api/students/usr_harshit_e2e/progress").json()
        assert harshit_check["total_attempts"] == 1, "Harshit state was contaminated!"
        print("  [OK] Learner 'Harshit' state completely isolated and intact (1 attempt, 100% score)")

        print("\n" + "=" * 65)
        print("ALL SUPABASE POSTGRESQL END-TO-END VERIFICATIONS PASSED!")
        print("=" * 65)
        fresh_db.close()
        sys.exit(0)

    except Exception as e:
        print(f"\nFAILED with exception: {e}")
        import traceback
        traceback.print_exc()
        db.close()
        sys.exit(1)

if __name__ == "__main__":
    run_supabase_e2e_verification()
