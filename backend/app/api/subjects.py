from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Any

from app.database import get_db
from app.models.all_models import Chapter, Skill, Question

router = APIRouter(prefix="/subjects", tags=["Dynamic Subjects"])

@router.get("", response_model=List[Dict[str, Any]])
def list_subjects(db: Session = Depends(get_db)):
    """
    Dynamically lists all distinct subjects from active chapters in the database.
    Ensures frontend NEVER hardcodes the subjects list.
    DATABASE -> API -> SUBJECT LIST -> FRONTEND
    """
    chapters = db.query(Chapter).filter(Chapter.status == "active").all()
    subjects_map: Dict[str, Dict[str, Any]] = {}

    subject_descriptions = {
        "Mathematics": "Algebraic structures, equation solving, relational balance, and variable manipulation.",
        "Physics": "Electrical circuits, current, Ohm's law, and dimensional analysis.",
        "Chemistry": "Chemical reactions, conservation of mass, and equation balancing.",
        "Biology": "Cellular structures, genetics, organismal systems, and metabolic pathways.",
        "Computer Science": "Algorithms, data structures, control flow, and computational complexity."
    }

    for c in chapters:
        subj = c.subject or "General Studies"
        subj_id = subj.lower().replace(" ", "_")
        if subj not in subjects_map:
            desc = subject_descriptions.get(subj, f"Curriculum modules, diagnostics, and skill mastery for {subj}.")
            subjects_map[subj] = {
                "id": subj_id,
                "name": subj,
                "description": desc,
                "chapters_count": 0
            }
        subjects_map[subj]["chapters_count"] += 1

    return list(subjects_map.values())

@router.get("/{subject_id}/chapters", response_model=List[Dict[str, Any]])
def list_subject_chapters(subject_id: str, db: Session = Depends(get_db)):
    """
    Dynamically lists all chapters for a given subject.
    Supports subject ID (e.g. 'mathematics') or subject name (e.g. 'Mathematics').
    """
    chapters = db.query(Chapter).filter(
        Chapter.status == "active"
    ).all()

    matched = []
    for c in chapters:
        c_subj = c.subject or "General Studies"
        c_subj_id = c_subj.lower().replace(" ", "_")
        if c_subj_id == subject_id.lower() or c_subj.lower() == subject_id.lower():
            skills_count = db.query(Skill).filter(Skill.chapter_id == c.id).count()
            questions_count = db.query(Question).filter(Question.chapter_id == c.id).count()
            matched.append({
                "id": c.id,
                "title": c.title,
                "subject": c.subject,
                "description": c.description,
                "source_type": c.source_type,
                "skills_count": skills_count,
                "questions_count": questions_count,
                "created_at": c.created_at.isoformat() if c.created_at else None
            })

    return matched
