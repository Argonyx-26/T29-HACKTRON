import uuid
import shutil
import os
import datetime
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import Dict, Any, Optional, List

from app.database import get_db
from app.config import settings
from app.models.all_models import UploadedDocument, ContentExtraction, Chapter, Skill, Question
from app.services.document_ingestion import DocumentIngestionService

router = APIRouter(prefix="/documents", tags=["Bring Your Own Chapter"])

@router.get("", response_model=List[Dict[str, Any]])
def list_documents(db: Session = Depends(get_db)):
    """
    Lists all uploaded curriculum materials in the library.
    """
    docs = db.query(UploadedDocument).order_by(UploadedDocument.created_at.desc()).all()
    return [
        {
            "id": doc.id,
            "title": doc.filename,
            "file_path": doc.file_path,
            "file_size": doc.file_size_bytes or 0,
            "mime_type": doc.mime_type or "application/pdf",
            "status": "processed" if doc.status in ["ready", "processed"] else doc.status,
            "uploaded_at": doc.created_at.isoformat() if doc.created_at else datetime.datetime.utcnow().isoformat(),
        }
        for doc in docs
    ]

@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    student_id: Optional[str] = Form(None),
    db: Session = Depends(get_db)
):
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
        student_id=student_id,
        status="uploading",
        progress_percent=10,
        current_stage="uploading"
    )
    db.add(doc)
    db.commit()

    # Process extraction pipeline
    ingestion_result = DocumentIngestionService.process_pdf_document(db, doc_id)

    return {
        "id": doc_id,
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

@router.post("/{document_id}/parse")
def parse_document_endpoint(document_id: str, db: Session = Depends(get_db)):
    """
    Parses/extracts learning outline and concepts from uploaded document.
    Matches frontend apiClient.parseDocument signature.
    """
    doc = db.query(UploadedDocument).filter(UploadedDocument.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    if doc.status not in ["ready", "processed"] or not doc.chapter_id:
        DocumentIngestionService.process_pdf_document(db, document_id)
        db.refresh(doc)

    extraction = db.query(ContentExtraction).filter(ContentExtraction.document_id == document_id).first()
    skills = db.query(Skill).filter(Skill.chapter_id == doc.chapter_id).all() if doc.chapter_id else []
    chapter = db.query(Chapter).filter(Chapter.id == doc.chapter_id).first() if doc.chapter_id else None

    topics = [s.name for s in skills] or [c.get("name", "") for c in (extraction.extracted_concepts if extraction else [])]
    if not topics:
        topics = ["Core Principles", "Analytical Methods", "Applied Problem Solving"]

    outline = [
        {
            "number": 1,
            "title": chapter.title if chapter else doc.filename.replace(".pdf", ""),
            "topics": topics
        }
    ]

    return {
        "id": doc.id,
        "document_id": doc.id,
        "title": chapter.title if chapter else doc.filename.replace(".pdf", ""),
        "status": "processed",
        "extracted_length": len(extraction.extracted_text_preview) if extraction and extraction.extracted_text_preview else 1200,
        "extracted_outline": outline
    }

