"""
Database Seed Script
Populates the Knowledge Twin database with a realistic demo cohort,
subjects, chapters, topics with prerequisite graphs, student twins,
and baseline mastery states.
"""
import uuid
from sqlalchemy.orm import Session
from datetime import datetime, timezone

from app.database import SessionLocal, init_db
from app.models.all_models import (
    User, Subject, Chapter, Topic, StudentTwin, TopicMastery,
    Assessment, AssessmentSubmission, Group, GroupMember, Intervention
)
from app.services.deterministic_engine import deterministic_engine

def seed_database(db: Session) -> dict:
    # Check if database already has subjects
    if db.query(Subject).first():
        print("INFO: Database already contains data. Skipping full seed.")
        return {"status": "already_seeded"}

    print("Beginning database seeding...")

    # 1. Create Users (Teacher, Admin, Students)
    teacher = User(
        id=str(uuid.uuid4()),
        email="teacher@knowledge-twin.edu",
        full_name="Prof. Sarah Jenkins",
        role="teacher",
        is_active=True
    )
    admin = User(
        id=str(uuid.uuid4()),
        email="admin@knowledge-twin.edu",
        full_name="System Administrator",
        role="admin",
        is_active=True
    )
    db.add_all([teacher, admin])
    db.commit()

    student_data = [
        ("alice@knowledge-twin.edu", "Alice Zhang"),
        ("bob@knowledge-twin.edu", "Bob Miller"),
        ("charlie@knowledge-twin.edu", "Charlie Davis"),
        ("diana@knowledge-twin.edu", "Diana Prince"),
        ("ethan@knowledge-twin.edu", "Ethan Hunt"),
        ("fiona@knowledge-twin.edu", "Fiona Gallagher"),
    ]

    students = []
    for email, name in student_data:
        s = User(
            id=str(uuid.uuid4()),
            email=email,
            full_name=name,
            role="student",
            is_active=True
        )
        students.append(s)
        db.add(s)
    db.commit()

    # 2. Create Subjects, Chapters, Topics
    # Subject 1: Advanced Physics
    physics = Subject(
        id=str(uuid.uuid4()),
        code="PHYS-101",
        name="Classical Mechanics & Dynamics",
        description="Fundamental principles of kinematics, Newton's laws, energy, and momentum.",
        grade_level="Grade 11-12"
    )
    # Subject 2: Mathematics
    math_subj = Subject(
        id=str(uuid.uuid4()),
        code="MATH-201",
        name="Calculus & Analysis",
        description="Differential and integral calculus with real-world applications.",
        grade_level="Grade 11-12"
    )
    db.add_all([physics, math_subj])
    db.commit()

    # Chapters for Physics
    p_chap1 = Chapter(id=str(uuid.uuid4()), subject_id=physics.id, title="Kinematics in 1D & 2D", order_num=1)
    p_chap2 = Chapter(id=str(uuid.uuid4()), subject_id=physics.id, title="Newtonian Dynamics", order_num=2)
    p_chap3 = Chapter(id=str(uuid.uuid4()), subject_id=physics.id, title="Work, Energy & Momentum", order_num=3)
    db.add_all([p_chap1, p_chap2, p_chap3])
    db.commit()

    # Topics for Kinematics (with prerequisite relationships)
    t_vectors = Topic(
        id=str(uuid.uuid4()), chapter_id=p_chap1.id, code="PHYS-T101",
        title="Vector Decomposition", difficulty=0.3, prerequisite_topic_ids=[]
    )
    t_velocity = Topic(
        id=str(uuid.uuid4()), chapter_id=p_chap1.id, code="PHYS-T102",
        title="Velocity & Acceleration Profiles", difficulty=0.4, prerequisite_topic_ids=[t_vectors.id]
    )
    t_projectile = Topic(
        id=str(uuid.uuid4()), chapter_id=p_chap1.id, code="PHYS-T103",
        title="2D Projectile Motion", difficulty=0.6, prerequisite_topic_ids=[t_vectors.id, t_velocity.id]
    )
    # Topics for Dynamics
    t_newton_laws = Topic(
        id=str(uuid.uuid4()), chapter_id=p_chap2.id, code="PHYS-T201",
        title="Newton's Laws & Free-Body Diagrams", difficulty=0.5, prerequisite_topic_ids=[t_vectors.id]
    )
    t_friction = Topic(
        id=str(uuid.uuid4()), chapter_id=p_chap2.id, code="PHYS-T202",
        title="Friction & Drag Forces", difficulty=0.6, prerequisite_topic_ids=[t_newton_laws.id]
    )
    db.add_all([t_vectors, t_velocity, t_projectile, t_newton_laws, t_friction])
    db.commit()

    all_physics_topics = [t_vectors, t_velocity, t_projectile, t_newton_laws, t_friction]

    # 3. Create Student Knowledge Twins & Topic Masteries
    # Define profiles: High achiever (Alice), Average (Bob), Struggling (Charlie), etc.
    profiles = {
        "Alice Zhang": [0.92, 0.88, 0.86, 0.90, 0.85],
        "Bob Miller": [0.75, 0.68, 0.55, 0.70, 0.60],
        "Charlie Davis": [0.40, 0.35, 0.28, 0.42, 0.30],  # Struggling student for interventions
        "Diana Prince": [0.85, 0.82, 0.78, 0.80, 0.76],
        "Ethan Hunt": [0.60, 0.52, 0.45, 0.50, 0.40],
        "Fiona Gallagher": [0.50, 0.48, 0.38, 0.45, 0.35],
    }

    for student in students:
        scores = profiles.get(student.full_name, [0.5, 0.5, 0.5, 0.5, 0.5])
        metrics = deterministic_engine.aggregate_twin_metrics(scores)

        twin = StudentTwin(
            id=str(uuid.uuid4()),
            student_id=student.id,
            overall_mastery=metrics["overall_mastery"],
            cognitive_load=metrics["cognitive_load"],
            learning_pace=metrics["learning_pace"],
            retention_decay=0.05
        )
        db.add(twin)
        db.commit()
        db.refresh(twin)

        for topic, score in zip(all_physics_topics, scores):
            attempts = 3 if score < 0.5 else 2
            status = deterministic_engine.evaluate_status(score, attempts)
            mastery = TopicMastery(
                id=str(uuid.uuid4()),
                twin_id=twin.id,
                topic_id=topic.id,
                score=score,
                confidence=0.8 if score > 0.8 else 0.5,
                attempts_count=attempts,
                status=status
            )
            db.add(mastery)

    db.commit()

    # 4. Create Cohort Group
    cohort = Group(
        id=str(uuid.uuid4()),
        name="Section A - Physics 2026",
        subject_id=physics.id,
        description="Spring 2026 Cohort - Classical Mechanics",
        cohort_year="2026"
    )
    db.add(cohort)
    db.commit()

    for student in students:
        gm = GroupMember(
            id=str(uuid.uuid4()),
            group_id=cohort.id,
            student_id=student.id
        )
        db.add(gm)
    db.commit()

    # 5. Create Initial Assessment
    assessment = Assessment(
        id=str(uuid.uuid4()),
        subject_id=physics.id,
        chapter_id=p_chap1.id,
        title="Kinematics Diagnostic Assessment",
        description="Comprehensive diagnostic on 1D/2D Kinematics and Vectors.",
        max_score=100.0,
        questions=[
            {"id": "q1", "topic_code": "PHYS-T101", "prompt": "Resolve a 50N vector at 30 degrees", "weight": 25},
            {"id": "q2", "topic_code": "PHYS-T102", "prompt": "Calculate acceleration from velocity curve", "weight": 25},
            {"id": "q3", "topic_code": "PHYS-T103", "prompt": "Determine range of a projectile fired at 45 deg", "weight": 50},
        ]
    )
    db.add(assessment)
    db.commit()

    print("Database seeding completed successfully.")
    return {
        "status": "success",
        "students_count": len(students),
        "subjects_count": 2,
        "topics_count": len(all_physics_topics)
    }

if __name__ == "__main__":
    init_db()
    session = SessionLocal()
    try:
        seed_database(session)
    finally:
        session.close()
