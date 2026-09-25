from app.seed.seed_data import seed_database
from app.models.all_models import User, Subject, StudentTwin, TopicMastery, Group

def test_seed_demo_cohort(db_session):
    result = seed_database(db_session)
    assert result["status"] == "success"
    assert result["students_count"] >= 5

    # Verify students exist
    students = db_session.query(User).filter(User.role == "student").all()
    assert len(students) >= 5

    # Verify student twins created
    twins = db_session.query(StudentTwin).all()
    assert len(twins) == len(students)

    # Verify topic masteries created
    masteries = db_session.query(TopicMastery).all()
    assert len(masteries) > 0

    # Verify groups created
    group = db_session.query(Group).first()
    assert group is not None
    assert "Physics" in group.name
