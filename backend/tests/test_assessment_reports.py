import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database import SessionLocal
from app.models.all_models import Student, Chapter, Skill, Question, Attempt, AssessmentReport

client = TestClient(app)

def test_assessment_report_lifecycle_and_incorrect_counting():
    """
    Test that assessment reports are saved and retrieved,
    and incorrect questions are properly counted in total questions attempted.
    """
    db = SessionLocal()
    student_id = "test_student_reports_99"

    # Clean up test records
    db.query(AssessmentReport).filter(AssessmentReport.student_id == student_id).delete(synchronize_session=False)
    db.query(Attempt).filter(Attempt.student_id == student_id).delete(synchronize_session=False)
    db.query(Student).filter(Student.id == student_id).delete(synchronize_session=False)
    db.commit()

    # Step 1: Submit an assessment report where student attempted 4 out of 5 questions (2 correct, 2 incorrect, 1 skipped)
    report_payload = {
        "id": "rep_test_lifecycle_01",
        "student_id": student_id,
        "chapter_id": "chap_linear_eq",
        "chapter_title": "Mathematics: Linear Equations in One Variable",
        "total_questions": 5,
        "attempted_count": 4, # 2 correct + 2 incorrect = 4 attempted
        "correct_count": 2,
        "incorrect_count": 2,
        "score_percent": 40,
        "evaluated_items": [
            {
                "question": {
                    "id": "q1",
                    "question_text": "Solve 2x + 4 = 10",
                    "correct_answer": "3",
                    "expected_steps": ["2x = 6", "x = 3"],
                    "difficulty": "easy"
                },
                "studentAnswer": "3",
                "workShown": ["2x = 6", "x = 3"],
                "diagnosis": {
                    "correct": True,
                    "likely_misconception": None,
                    "explanation": "Correct answer: 3"
                }
            },
            {
                "question": {
                    "id": "q2",
                    "question_text": "Solve 3x - 6 = 9",
                    "correct_answer": "5",
                    "expected_steps": ["3x = 15", "x = 5"],
                    "difficulty": "medium"
                },
                "studentAnswer": "1",
                "workShown": ["3x = 3", "x = 1"],
                "diagnosis": {
                    "correct": False,
                    "likely_misconception": "Sign Error on Transposition",
                    "explanation": "Subtracted 6 instead of adding 6 to the right side."
                }
            },
            {
                "question": {
                    "id": "q3",
                    "question_text": "Solve 2(x + 3) = 14",
                    "correct_answer": "4",
                    "expected_steps": ["2x + 6 = 14", "2x = 8", "x = 4"],
                    "difficulty": "medium"
                },
                "studentAnswer": "4",
                "workShown": ["2x + 6 = 14", "2x = 8", "x = 4"],
                "diagnosis": {
                    "correct": True,
                    "likely_misconception": None,
                    "explanation": "Correct answer: 4"
                }
            },
            {
                "question": {
                    "id": "q4",
                    "question_text": "Solve 5x = 25",
                    "correct_answer": "5",
                    "expected_steps": ["x = 5"],
                    "difficulty": "easy"
                },
                "studentAnswer": "20",
                "workShown": ["5x = 25 - 5"],
                "diagnosis": {
                    "correct": False,
                    "likely_misconception": "Division vs Subtraction Confusion",
                    "explanation": "Subtracted coefficient 5 instead of dividing."
                }
            },
            {
                "question": {
                    "id": "q5",
                    "question_text": "Solve 4x + 1 = 17",
                    "correct_answer": "4",
                    "expected_steps": ["4x = 16", "x = 4"],
                    "difficulty": "hard"
                },
                "studentAnswer": "(No answer provided)",
                "workShown": [],
                "diagnosis": {
                    "correct": False,
                    "likely_misconception": "Unanswered Question",
                    "explanation": "This question was left blank."
                }
            }
        ]
    }

    res = client.post("/api/assessments/reports", json=report_payload)
    assert res.status_code == 200, f"Save report failed: {res.text}"
    saved_data = res.json()
    assert saved_data["id"] == "rep_test_lifecycle_01"
    assert saved_data["attempted_count"] == 4
    assert saved_data["correct_count"] == 2
    assert saved_data["incorrect_count"] == 2
    assert saved_data["total_questions"] == 5
    assert len(saved_data["evaluated_items"]) == 5

    # Step 2: Fetch reports for this student
    list_res = client.get(f"/api/assessments/reports?student_id={student_id}")
    assert list_res.status_code == 200
    reports = list_res.json()
    assert len(reports) == 1
    assert reports[0]["chapter_title"] == "Mathematics: Linear Equations in One Variable"
    assert reports[0]["attempted_count"] == 4
    assert reports[0]["correct_count"] == 2
    assert reports[0]["incorrect_count"] == 2

    # Step 3: Fetch detail by ID
    detail_res = client.get(f"/api/assessments/reports/rep_test_lifecycle_01")
    assert detail_res.status_code == 200
    detail = detail_res.json()
    assert len(detail["evaluated_items"]) == 5
    assert detail["evaluated_items"][1]["diagnosis"]["likely_misconception"] == "Sign Error on Transposition"
    assert detail["evaluated_items"][1]["studentAnswer"] == "1"

    # Clean up test records
    db.query(AssessmentReport).filter(AssessmentReport.student_id == student_id).delete(synchronize_session=False)
    db.commit()
    db.close()
