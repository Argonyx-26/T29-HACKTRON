from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Any

from app.database import get_db
from app.models.all_models import Chapter, Skill, Question

router = APIRouter(prefix="/chapters", tags=["Chapters"])

@router.get("", response_model=List[Dict[str, Any]])
def list_chapters(db: Session = Depends(get_db)):
    """List all available chapters (both curated demo and student uploaded)."""
    chapters = db.query(Chapter).filter(Chapter.status == "active").all()
    results = []
    for c in chapters:
        skills_count = db.query(Skill).filter(Skill.chapter_id == c.id).count()
        questions_count = db.query(Question).filter(Question.chapter_id == c.id).count()
        results.append({
            "id": c.id,
            "title": c.title,
            "subject": c.subject,
            "description": c.description,
            "source_type": c.source_type,
            "source_document_id": c.source_document_id,
            "skills_count": skills_count,
            "questions_count": questions_count,
            "created_at": c.created_at.isoformat() if c.created_at else None
        })
    return results

@router.get("/{chapter_id}")
def get_chapter_detail(chapter_id: str, db: Session = Depends(get_db)):
    """Get single chapter details with ordered skills list."""
    chapter = db.query(Chapter).filter(Chapter.id == chapter_id).first()
    if not chapter:
        raise HTTPException(status_code=404, detail="Chapter not found")
    
    skills = db.query(Skill).filter(Skill.chapter_id == chapter_id).order_by(Skill.order).all()
    return {
        "id": chapter.id,
        "title": chapter.title,
        "subject": chapter.subject,
        "description": chapter.description,
        "source_type": chapter.source_type,
        "skills": [{
            "id": s.id,
            "code": s.code,
            "name": s.name,
            "description": s.description,
            "prerequisite_skill_ids": s.prerequisite_skill_ids or [],
            "difficulty": s.difficulty,
            "order": s.order
        } for s in skills]
    }

@router.get("/{chapter_id}/skills")
def get_chapter_skills(chapter_id: str, db: Session = Depends(get_db)):
    """Dynamically retrieves the ordered skills for this chapter."""
    skills = db.query(Skill).filter(Skill.chapter_id == chapter_id).order_by(Skill.order).all()
    return [{
        "id": s.id,
        "chapter_id": s.chapter_id,
        "code": s.code,
        "name": s.name,
        "description": s.description,
        "prerequisite_skill_ids": s.prerequisite_skill_ids or [],
        "difficulty": s.difficulty,
        "order": s.order
    } for s in skills]

@router.get("/{chapter_id}/questions")
def get_chapter_questions(chapter_id: str, db: Session = Depends(get_db)):
    """
    Dynamically retrieves questions for this chapter from the database.
    Ensures frontend NEVER hardcodes the question bank.
    """
    questions = db.query(Question).filter(
        Question.chapter_id == chapter_id,
        Question.active == True
    ).all()
    return [{
        "id": q.id,
        "chapter_id": q.chapter_id,
        "skill_id": q.skill_id,
        "question_text": q.question_text,
        "correct_answer": q.correct_answer,
        "expected_steps": q.expected_steps or [],
        "difficulty": q.difficulty,
        "source_type": q.source_type,
        "source_reference": q.source_reference or {},
        "diagnostic_tags": q.diagnostic_tags or []
    } for q in questions]
