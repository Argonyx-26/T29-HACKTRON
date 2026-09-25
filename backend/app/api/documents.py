from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any

from app.database import get_db
from app.models.all_models import Document
from app.schemas.all_schemas import DocumentResponse
from app.services.document_ingestion import document_ingestion_service

router = APIRouter(prefix="/documents", tags=["Curriculum Documents"])

@router.get("", response_model=List[DocumentResponse])
def list_documents(db: Session = Depends(get_db)):
    return db.query(Document).order_by(Document.uploaded_at.desc()).all()

@router.post("/upload", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
async def upload_document(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    content = await file.read()
    doc = document_ingestion_service.save_upload(
        filename=file.filename,
        content=content,
        mime_type=file.content_type or "application/octet-stream",
        db=db
    )
    return doc

@router.post("/{document_id}/parse")
def parse_curriculum_document(document_id: str, db: Session = Depends(get_db)) -> Dict[str, Any]:
    try:
        result = document_ingestion_service.process_document(db, document_id)
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Parsing failed: {str(e)}")

@router.get("/{document_id}", response_model=DocumentResponse)
def get_document(document_id: str, db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return doc
