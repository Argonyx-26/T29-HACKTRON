import uuid
import shutil
import os
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import Dict, Any

from app.database import get_db
from app.config import settings
from app.models.all_models import UploadedDocument, ContentExtraction, Chapter, Skill, Question
from app.services.document_ingestion import DocumentIngestionService

router = APIRouter(prefix="/documents", tags=["Bring Your Own Chapter"])

@router.post("/upload")
async def upload_document(file: UploadFile = File(...), db: Session = Depends(get_db)):
    """
    Accepts student study materials (PDF), validates, and initiates
    the structured content extraction pipeline.
    """
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF chapter documents are currently supported.")

    doc_id = f"doc_{uuid.uuid4().hex[:8]}"
    safe_filename = f"{doc_id}_{file.filename}"
    file_path = settings.UPLOAD_DIR / safe_filename

    # Save to disk
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    file_size = os.path.getsize(file_path)

    doc = UploadedDocument(
        id=doc_id,
        filename=file.filename,
        file_path=str(file_path),
        file_size_bytes=file_size,
        status="uploading",
        progress_percent=10,
        current_stage="uploading"
    )
    db.add(doc)
    db.commit()

    # Process extraction pipeline
    ingestion_result = DocumentIngestionService.process_pdf_document(db, doc_id)

    return {
        "document_id": doc_id,
        "filename": file.filename,
        "file_size_bytes": file_size,
        "status": doc.status,
        "current_stage": doc.current_stage,
        "progress_percent": doc.progress_percent,
        "chapter_id": doc.chapter_id,
        "result": ingestion_result
    }

@router.get("/{document_id}/status")
def get_document_status(document_id: str, db: Session = Depends(get_db)):
    doc = db.query(UploadedDocument).filter(UploadedDocument.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
        
    return {
        "document_id": doc.id,
        "filename": doc.filename,
        "status": doc.status,
        "current_stage": doc.current_stage,
        "progress_percent": doc.progress_percent,
        "chapter_id": doc.chapter_id,
        "error_message": doc.error_message
    }

@router.get("/{document_id}/review")
def review_extracted_content(document_id: str, db: Session = Depends(get_db)):
    """
    Returns extracted skills, concepts, and candidate questions with complete provenance
    for student review before launching diagnostic assessment.
    """
    doc = db.query(UploadedDocument).filter(UploadedDocument.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    if not doc.chapter_id:
        return {"status": doc.status, "message": "Content still processing"}

    chapter = db.query(Chapter).filter(Chapter.id == doc.chapter_id).first()
    skills = db.query(Skill).filter(Skill.chapter_id == doc.chapter_id).order_by(Skill.order).all()
    questions = db.query(Question).filter(Question.chapter_id == doc.chapter_id).all()
    extraction = db.query(ContentExtraction).filter(ContentExtraction.document_id == document_id).first()

    return {
        "document_id": doc.id,
        "filename": doc.filename,
        "chapter_id": doc.chapter_id,
        "chapter_title": chapter.title if chapter else doc.filename,
        "subject": chapter.subject if chapter else "General",
        "skills": [{
            "id": s.id,
            "code": s.code,
            "name": s.name,
            "description": s.description,
            "prerequisites": s.prerequisite_skill_ids or []
        } for s in skills],
        "questions": [{
            "id": q.id,
            "question_text": q.question_text,
            "correct_answer": q.correct_answer,
            "expected_steps": q.expected_steps or [],
            "provenance": q.source_reference or {}
        } for q in questions],
        "extracted_concepts": extraction.extracted_concepts if extraction else [],
        "preview_text": extraction.extracted_text_preview if extraction else ""
    }
