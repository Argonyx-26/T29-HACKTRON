from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db, get_student_db
from app.services.revision_service import RevisionService

router = APIRouter(prefix="/revision", tags=["Revision Engine & Continuous Memory"])


class RevisionAnswerItem(BaseModel):
    question_id: str
    answer: str


class RevisionSubmitRequest(BaseModel):
    student_id: str
    answers: List[RevisionAnswerItem]


@router.get("/{student_id}")
@router.get("/{student_id}/overview")
def get_revision_status(student_id: str, shared_db: Session = Depends(get_db)):
    """
    Returns real-time continuous memory status for the student:
    - Memory status pillars: Strong, Stable, Fading, At Risk
    - Scheduled 3-minute retrieval practice queue
    - Ebbinghaus decay and next recommended review

    Curriculum data (skills, questions) from shared DB.
    Student progress (attempts, mastery) from student's private DB.
    """
    student_db = get_student_db(student_id)
    try:
        data = RevisionService.get_revision_overview(
            db=shared_db, student_id=student_id, student_db=student_db
        )
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch revision state: {str(e)}")
    finally:
        student_db.close()


@router.post("/practice")
def submit_retrieval_practice(payload: RevisionSubmitRequest, shared_db: Session = Depends(get_db)):
    """
    Submits answers for the 3-minute retrieval practice session.
    Immediately updates Bayesian Knowledge Tracing and resets forgetting curve decay.
    Writes all student data to the student's private DB.
    """
    student_db = get_student_db(payload.student_id)
    try:
        answers_dict = [{"question_id": a.question_id, "answer": a.answer} for a in payload.answers]
        result = RevisionService.process_retrieval_practice(
            db=shared_db,
            student_id=payload.student_id,
            answers=answers_dict,
            student_db=student_db
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process retrieval practice: {str(e)}")
    finally:
        student_db.close()
