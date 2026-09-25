import uuid
from app.models.all_models import User, Subject, Chapter, Topic
from app.services.mastery_service import mastery_service

def test_mastery_service_practice_progression(db_session):
    # Setup test user and topic
    user = User(
        id=str(uuid.uuid4()),
        email="learner@example.com",
        full_name="Alex Learner",
        role="student"
    )
    subject = Subject(id=str(uuid.uuid4()), code="TEST-1", name="Test Subject")
    chapter = Chapter(id=str(uuid.uuid4()), subject_id=subject.id, title="Test Chapter")
    topic = Topic(id=str(uuid.uuid4()), chapter_id=chapter.id, code="T-01", title="Limits")

    db_session.add_all([user, subject, chapter, topic])
    db_session.commit()

    # 1. First practice attempt (correct)
    record1 = mastery_service.record_practice_event(
        db=db_session,
        student_id=user.id,
        topic_id=topic.id,
        is_correct=True
    )
    assert record1.attempts_count == 1
    assert record1.score > 0.1

    # 2. Second practice attempt (correct)
    record2 = mastery_service.record_practice_event(
        db=db_session,
        student_id=user.id,
        topic_id=topic.id,
        is_correct=True
    )
    assert record2.attempts_count == 2
    assert record2.score > record1.score

    # 3. Check student twin overall mastery updated
    twin = mastery_service.get_or_create_twin(db_session, user.id)
    assert twin.overall_mastery == record2.score

def test_knowledge_graph_structure(db_session):
    user = User(id=str(uuid.uuid4()), email="graph_user@example.com", full_name="Graph Student")
    subject = Subject(id=str(uuid.uuid4()), code="GRAPH-1", name="Graph Subject")
    chapter = Chapter(id=str(uuid.uuid4()), subject_id=subject.id, title="Graph Chapter")
    topic1 = Topic(id=str(uuid.uuid4()), chapter_id=chapter.id, code="G-01", title="Node A")
    topic2 = Topic(id=str(uuid.uuid4()), chapter_id=chapter.id, code="G-02", title="Node B", prerequisite_topic_ids=[topic1.id])

    db_session.add_all([user, subject, chapter, topic1, topic2])
    db_session.commit()

    graph = mastery_service.get_knowledge_graph(db_session, user.id)
    assert "nodes" in graph
    assert "edges" in graph
    assert len(graph["nodes"]) >= 2
    # Verify edge connecting prerequisite
    has_edge = any(e["source"] == topic1.id and e["target"] == topic2.id for e in graph["edges"])
    assert has_edge
