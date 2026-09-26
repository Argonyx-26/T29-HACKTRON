"""
migrate_to_per_student_dbs.py
Migrates all student-specific records from the shared knowledge_twin.db
into isolated per-student SQLite databases located in backend/students/student_<id>.db.
"""
import sys
from pathlib import Path

# Add backend directory to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent))

from app.database import get_student_db, SessionLocal, _student_db_path
from app.models.all_models import (
    Student, Attempt, MasteryState, StudentMisconceptionInstance,
    InterventionHistory, AssessmentReport, EmergingGap, AuditLog
)

def run_migration():
    shared = SessionLocal()
    students = shared.query(Student).all()
    print(f"Found {len(students)} students in shared DB.")

    migrated_stats = {}

    for s in students:
        sdb = get_student_db(s.id)
        try:
            # 1. Profile
            existing_s = sdb.query(Student).filter(Student.id == s.id).first()
            if not existing_s:
                sdb.add(Student(
                    id=s.id,
                    name=s.name,
                    role=s.role or "student",
                    email=s.email,
                    avatar_color=s.avatar_color or "#3B82F6",
                    target_goal=s.target_goal,
                    goal_description=s.goal_description,
                    target_mastery=s.target_mastery or 0.85,
                    created_at=s.created_at
                ))
            elif s.name and s.name != existing_s.name:
                existing_s.name = s.name
            
            # 2. Attempts
            atts = shared.query(Attempt).filter(Attempt.student_id == s.id).all()
            for a in atts:
                if not sdb.query(Attempt).filter(Attempt.id == a.id).first():
                    sdb.add(Attempt(
                        id=a.id,
                        student_id=a.student_id,
                        question_id=a.question_id,
                        assessment_id=a.assessment_id,
                        answer=a.answer,
                        work_shown=a.work_shown,
                        input_mode=a.input_mode or "steps",
                        correct=a.correct,
                        confidence=a.confidence or 0.5,
                        diagnosis=a.diagnosis,
                        created_at=a.created_at
                    ))

            # 3. Mastery states
            msts = shared.query(MasteryState).filter(MasteryState.student_id == s.id).all()
            for m in msts:
                if not sdb.query(MasteryState).filter(MasteryState.id == m.id).first():
                    sdb.add(MasteryState(
                        id=m.id,
                        student_id=m.student_id,
                        skill_id=m.skill_id,
                        mastery_probability=m.mastery_probability,
                        confidence=m.confidence,
                        evidence_count=m.evidence_count,
                        history=m.history,
                        last_updated=m.last_updated
                    ))

            # 4. Misconceptions
            miscs = shared.query(StudentMisconceptionInstance).filter(StudentMisconceptionInstance.student_id == s.id).all()
            for mi in miscs:
                if not sdb.query(StudentMisconceptionInstance).filter(StudentMisconceptionInstance.id == mi.id).first():
                    sdb.add(StudentMisconceptionInstance(
                        id=mi.id,
                        student_id=mi.student_id,
                        pattern_id=mi.pattern_id,
                        skill_id=mi.skill_id,
                        status=mi.status,
                        occurrences=mi.occurrences,
                        evidence_examples=mi.evidence_examples,
                        first_detected=mi.first_detected,
                        last_detected=mi.last_detected,
                        resolution_history=mi.resolution_history
                    ))

            # 5. Intervention histories
            ihs = shared.query(InterventionHistory).filter(InterventionHistory.student_id == s.id).all()
            for ih in ihs:
                if not sdb.query(InterventionHistory).filter(InterventionHistory.id == ih.id).first():
                    sdb.add(InterventionHistory(
                        id=ih.id,
                        student_id=ih.student_id,
                        intervention_id=ih.intervention_id,
                        skill_id=ih.skill_id,
                        pattern_id=ih.pattern_id,
                        started_at=ih.started_at,
                        completed_at=ih.completed_at,
                        status=ih.status,
                        before_mastery=ih.before_mastery,
                        after_mastery=ih.after_mastery,
                        retest_attempt_id=ih.retest_attempt_id,
                        retest_result=ih.retest_result
                    ))

            # 6. Assessment reports
            reps = shared.query(AssessmentReport).filter(AssessmentReport.student_id == s.id).all()
            for r in reps:
                if not sdb.query(AssessmentReport).filter(AssessmentReport.id == r.id).first():
                    sdb.add(AssessmentReport(
                        id=r.id,
                        student_id=r.student_id,
                        chapter_id=r.chapter_id,
                        chapter_title=r.chapter_title,
                        total_questions=r.total_questions,
                        attempted_count=r.attempted_count,
                        correct_count=r.correct_count,
                        incorrect_count=r.incorrect_count,
                        score_percent=r.score_percent,
                        evaluated_items=r.evaluated_items,
                        created_at=r.created_at
                    ))

            # 7. Emerging gaps
            gaps = shared.query(EmergingGap).filter(EmergingGap.student_id == s.id).all()
            for g in gaps:
                if not sdb.query(EmergingGap).filter(EmergingGap.id == g.id).first():
                    sdb.add(EmergingGap(
                        id=g.id,
                        student_id=g.student_id,
                        skill_id=g.skill_id,
                        title=g.title,
                        description=g.description,
                        risk_level=g.risk_level,
                        trigger_reason=g.trigger_reason,
                        detected_at=g.detected_at,
                        status=g.status
                    ))

            # 8. Audit logs
            audits = shared.query(AuditLog).filter(AuditLog.student_id == s.id).all()
            for au in audits:
                if not sdb.query(AuditLog).filter(AuditLog.id == au.id).first():
                    sdb.add(AuditLog(
                        id=au.id,
                        event_type=au.event_type,
                        student_id=au.student_id,
                        details=au.details,
                        created_at=au.created_at
                    ))

            sdb.commit()
            migrated_stats[s.id] = {
                "name": s.name,
                "attempts": len(atts),
                "mastery_states": len(msts),
                "misconceptions": len(miscs),
                "reports": len(reps),
                "db_path": str(_student_db_path(s.id))
            }
        except Exception as e:
            sdb.rollback()
            print(f"Error migrating student {s.id}: {e}")
        finally:
            sdb.close()

    shared.close()
    print("Migration finished successfully.")
    for sid, info in migrated_stats.items():
        print(f"  [{sid}] {info['name']}: {info['attempts']} attempts, {info['mastery_states']} masteries, {info['reports']} reports -> {info['db_path']}")

if __name__ == "__main__":
    run_migration()
