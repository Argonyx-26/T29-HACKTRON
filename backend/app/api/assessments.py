from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import uuid

from app.database import get_db
from app.models.all_models import Assessment, AssessmentSubmission, Subject, Topic
from app.schemas.all_schemas import AssessmentResponse, AssessmentCreate, SubmissionCreate, SubmissionResponse
from app.services.mastery_service import mastery_service

router = APIRouter(prefix="/assessments", tags=["Assessments"])

@router.get("", response_model=List[AssessmentResponse])
def list_assessments(db: Session = Depends(get_db)):
    return db.query(Assessment).all()

@router.post("", response_model=AssessmentResponse, status_code=status.HTTP_201_CREATED)
def create_assessment(assessment_in: AssessmentCreate, db: Session = Depends(get_db)):
    subject = db.query(Subject).filter(Subject.id == assessment_in.subject_id).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")

    assessment = Assessment(
        id=str(uuid.uuid4()),
        subject_id=assessment_in.subject_id,
        chapter_id=assessment_in.chapter_id,
        title=assessment_in.title,
        description=assessment_in.description,
        max_score=assessment_in.max_score,
        questions=assessment_in.questions
    )
    db.add(assessment)
    db.commit()
    db.refresh(assessment)
    return assessment

@router.get("/{assessment_id}", response_model=AssessmentResponse)
def get_assessment(assessment_id: str, db: Session = Depends(get_db)):
    assessment = db.query(Assessment).filter(Assessment.id == assessment_id).first()
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")
    return assessment

@router.post("/{assessment_id}/submit", response_model=SubmissionResponse)
def submit_assessment(
    assessment_id: str,
    submission_in: SubmissionCreate,
    db: Session = Depends(get_db)
):
    assessment = db.query(Assessment).filter(Assessment.id == assessment_id).first()
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")

    submission = AssessmentSubmission(
        id=str(uuid.uuid4()),
        assessment_id=assessment_id,
        student_id=submission_in.student_id,
        score=submission_in.score,
        max_score=submission_in.max_score,
        responses=submission_in.responses
    )
    db.add(submission)
    db.commit()
    db.refresh(submission)

    # Automatically update Knowledge Twin if question topic tags are available
    # Or update topics associated with the assessment chapter
    percentage = submission_in.score / max(1.0, submission_in.max_score)
    is_passing = percentage >= 0.70

    if assessment.questions:
        for q in assessment.questions:
            topic_code = q.get("topic_code")
            if topic_code:
                topic = db.query(Topic).filter(Topic.code == topic_code).first()
                if topic:
                    mastery_service.record_practice_event(
                        db=db,
                        student_id=submission_in.student_id,
                        topic_id=topic.id,
                        is_correct=is_passing
                    )

    return submission
