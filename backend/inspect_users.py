from app.database import get_db, get_student_db
from app.models.all_models import Student, Attempt, MasteryState, Question, Chapter

shared_db = next(get_db())

for s in shared_db.query(Student).filter(Student.name.in_(['Harshit', 'Ankush'])).all():
    print(f"\n=== PRIVATE DB FOR {s.name} ({s.id}) ===")
    try:
        sdb = get_student_db(s.id)
        attempts = sdb.query(Attempt).all()
        print(f"  Attempts count: {len(attempts)}")
        for a in attempts:
            q = shared_db.query(Question).filter(Question.id == a.question_id).first()
            chap = shared_db.query(Chapter).filter(Chapter.id == q.chapter_id).first() if q else None
            print(f"    - Attempt Q: {a.question_id}, Chapter: {chap.title if chap else 'Unknown'}, Skill: {q.skill_id if q else 'None'}, Correct: {a.correct}")
        masteries = sdb.query(MasteryState).all()
        print(f"  Masteries count: {len(masteries)}")
        for m in masteries:
            print(f"    - Skill {m.skill_id}: prob={m.mastery_probability}, count={m.evidence_count}")
        sdb.close()
    except Exception as e:
        print(f"  Error: {e}")
