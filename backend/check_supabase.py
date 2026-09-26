"""
Supabase PostgreSQL Inspector for Knowledge Twin (Team HACKTRON)
Run this script anytime to inspect data stored in your live Supabase database:
    python check_supabase.py
"""
import os
import sys
from pathlib import Path
from collections import Counter

# Ensure backend root is in sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent))

from app.database import SessionLocal, engine
from app.config import settings
from app.models.all_models import (
    Student,
    Attempt,
    MasteryState,
    StudentMisconceptionInstance,
    MisconceptionPattern,
    Chapter,
    Skill,
    Question,
    UploadedDocument,
    InterventionHistory
)

def inspect_database():
    print("=" * 70)
    print("  KNOWLEDGE TWIN - SUPABASE POSTGRESQL DATA INSPECTOR")
    print("=" * 70)
    print(f"Target DB Engine : {engine.name}")
    print(f"Connection URL   : {settings.DATABASE_URL.split('@')[-1] if '@' in settings.DATABASE_URL else 'local'}")
    print(f"Database Type    : {'Supabase PostgreSQL (Live Cloud)' if settings.is_postgres else 'Local SQLite'}")
    print("=" * 70)

    db = SessionLocal()
    try:
        # 1. TABLE ROW COUNTS
        students_count = db.query(Student).count()
        chapters_count = db.query(Chapter).count()
        skills_count = db.query(Skill).count()
        questions_count = db.query(Question).count()
        attempts_count = db.query(Attempt).count()
        masteries_count = db.query(MasteryState).count()
        misconceptions_count = db.query(StudentMisconceptionInstance).count()
        docs_count = db.query(UploadedDocument).count()
        interventions_count = db.query(InterventionHistory).count()

        print("\n--- 1. OVERALL TABLE ROW COUNTS ---")
        print(f"  • students                       : {students_count}")
        print(f"  • chapters                       : {chapters_count}")
        print(f"  • skills                         : {skills_count}")
        print(f"  • questions                      : {questions_count}")
        print(f"  • attempts (diagnostic responses): {attempts_count}")
        print(f"  • mastery_states                 : {masteries_count}")
        print(f"  • student_misconceptions         : {misconceptions_count}")
        print(f"  • uploaded_documents             : {docs_count}")
        print(f"  • intervention_histories         : {interventions_count}")

        # 2. STUDENTS & PER-USER BREAKDOWN
        print("\n--- 2. REGISTERED STUDENTS & PER-USER ISOLATION ---")
        students = db.query(Student).order_by(Student.created_at.asc()).all()
        attempts = db.query(Attempt).all()
        student_attempts = Counter(a.student_id for a in attempts)
        student_correct = Counter(a.student_id for a in attempts if a.correct)

        if not students:
            print("  (No students found in database)")
        else:
            for s in students:
                total_att = student_attempts.get(s.id, 0)
                correct_att = student_correct.get(s.id, 0)
                acc = f"{round((correct_att/total_att)*100)}%" if total_att > 0 else "Unassessed"
                
                # Count masteries
                m_count = db.query(MasteryState).filter(MasteryState.student_id == s.id, MasteryState.evidence_count > 0).count()
                misc_count = db.query(StudentMisconceptionInstance).filter(StudentMisconceptionInstance.student_id == s.id, StudentMisconceptionInstance.status == 'active').count()

                print(f"  ► [{s.id}] {s.name} ({s.role})")
                print(f"      Attempts: {total_att} total ({correct_att} correct, Accuracy: {acc})")
                print(f"      Assessed Skills: {m_count} | Active Misconceptions: {misc_count}")

        # 3. RECENT 5 ATTEMPTS IN DATABASE
        print("\n--- 3. RECENT 5 STUDENT ATTEMPTS (DIAGNOSTIC RESPONSES) ---")
        recent_attempts = db.query(Attempt).order_by(Attempt.created_at.desc()).limit(5).all()
        if not recent_attempts:
            print("  (No attempts recorded yet)")
        else:
            for att in recent_attempts:
                status_symbol = "✓ Correct" if att.correct else "✗ Incorrect"
                q_text = (att.question.prompt if att.question else "Unknown question")[:45]
                print(f"  • [{att.created_at.strftime('%Y-%m-%d %H:%M:%S') if att.created_at else 'N/A'}]")
                print(f"      Student: {att.student_id} | Result: {status_symbol}")
                print(f"      Question: {q_text}...")
                print(f"      Answer: '{att.raw_answer}'")
                if att.likely_misconception_id:
                    print(f"      Diagnosed Misconception: {att.likely_misconception_id}")

        # 4. RECENT DOCUMENT UPLOADS
        print("\n--- 4. UPLOADED DOCUMENTS & GENERATED MODULES ---")
        docs = db.query(UploadedDocument).order_by(UploadedDocument.created_at.desc()).limit(5).all()
        if not docs:
            print("  (No document uploads yet)")
        else:
            for d in docs:
                print(f"  • [{d.id}] {d.filename} ({d.subject_name}) - Status: {d.status} ({d.progress_percent}%)")

        print("\n" + "=" * 70)
        print("  HOW TO VIEW IN SUPABASE DASHBOARD:")
        print("  1. Visit: https://supabase.com/dashboard/project/yvbikzuuixzijcjlvbwl")
        print("  2. In the left sidebar, click 'Table Editor' (icon with tables).")
        print("  3. Click any table: 'students', 'attempts', 'mastery_states', 'chapters'.")
        print("  4. Or click 'SQL Editor' and run: SELECT * FROM attempts ORDER BY created_at DESC;")
        print("=" * 70)

    finally:
        db.close()

if __name__ == "__main__":
    inspect_database()
