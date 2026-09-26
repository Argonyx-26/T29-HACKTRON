import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_teacher_overview_and_cohort_endpoints():
    res = client.get("/api/teacher/overview")
    assert res.status_code == 200
    data = res.json()
    assert "total_students" in data
    assert "avg_cohort_mastery" in data
    assert "same_score_comparison" in data
    assert "students" in data

    res_cohort = client.get("/api/teacher/cohort")
    assert res_cohort.status_code == 200
    cohort = res_cohort.json()
    assert isinstance(cohort, list)
    if cohort:
        student = cohort[0]
        assert "student_id" in student
        assert "full_name" in student
        assert "overall_mastery" in student
        assert "risk_status" in student
        assert "active_interventions_count" in student

    res_topics = client.get("/api/teacher/struggling-topics")
    assert res_topics.status_code == 200
    topics = res_topics.json()
    assert isinstance(topics, list)
    if topics:
        topic = topics[0]
        assert "topic_id" in topic
        assert "topic_code" in topic
        assert "topic_title" in topic
        assert "avg_mastery" in topic
        assert "students_struggling_count" in topic

def test_documents_and_chapters_endpoints():
    res_docs = client.get("/api/documents")
    assert res_docs.status_code == 200
    docs = res_docs.json()
    assert isinstance(docs, list)

    res_chap = client.get("/api/chapters")
    assert res_chap.status_code == 200
    chaps = res_chap.json()
    assert isinstance(chaps, list)
    if chaps:
        chap = chaps[0]
        assert "subject_id" in chap
        assert "topics" in chap
        assert isinstance(chap["topics"], list)
