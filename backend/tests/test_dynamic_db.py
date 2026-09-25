import uuid
from app.models.all_models import User, StudentTwin, TopicMastery, Subject, Chapter, Topic

def test_dynamic_db_user_and_twin_relation(db_session):
    # Create user
    user = User(
        id=str(uuid.uuid4()),
        email="test_user@example.com",
        full_name="Test User",
        role="student"
    )
    db_session.add(user)
    db_session.commit()

    # Create twin
    twin = StudentTwin(
        id=str(uuid.uuid4()),
        student_id=user.id,
        overall_mastery=0.75,
        cognitive_load=0.25
    )
    db_session.add(twin)
    db_session.commit()

    # Query back via relationship
    queried_user = db_session.query(User).filter(User.id == user.id).first()
    assert queried_user is not None
    assert queried_user.twin is not None
    assert queried_user.twin.overall_mastery == 0.75

def test_dynamic_db_cascade_cleanup(db_session):
    subject = Subject(
        id=str(uuid.uuid4()),
        code="CS-50",
        name="Intro to Computer Science"
    )
    db_session.add(subject)
    db_session.commit()

    chapter = Chapter(
        id=str(uuid.uuid4()),
        subject_id=subject.id,
        title="Algorithms",
        order_num=1
    )
    db_session.add(chapter)
    db_session.commit()

    topic = Topic(
        id=str(uuid.uuid4()),
        chapter_id=chapter.id,
        code="CS-T01",
        title="Binary Search"
    )
    db_session.add(topic)
    db_session.commit()

    assert db_session.query(Topic).filter(Topic.id == topic.id).first() is not None

    # Delete subject should cascade to chapters and topics
    db_session.delete(subject)
    db_session.commit()

    assert db_session.query(Chapter).filter(Chapter.id == chapter.id).first() is None
    assert db_session.query(Topic).filter(Topic.id == topic.id).first() is None
