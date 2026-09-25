"""
Document Ingestion Service
Handles file uploads, text extraction from curriculum documents/syllabi,
and structure parsing for chapter/topic generation.
"""
import os
import uuid
import re
from typing import Dict, Any, List
from sqlalchemy.orm import Session

from app.config import settings
from app.models.all_models import Document

class DocumentIngestionService:
    def __init__(self, upload_dir: str = settings.UPLOAD_DIR):
        self.upload_dir = upload_dir
        os.makedirs(self.upload_dir, exist_ok=True)

    def save_upload(self, filename: str, content: bytes, mime_type: str, db: Session) -> Document:
        """
        Saves raw uploaded content to disk and tracks it in the database.
        """
        doc_id = str(uuid.uuid4())
        safe_filename = f"{doc_id}_{os.path.basename(filename)}"
        file_path = os.path.join(self.upload_dir, safe_filename)

        with open(file_path, "wb") as f:
            f.write(content)

        doc = Document(
            id=doc_id,
            title=filename,
            file_path=file_path,
            file_size=len(content),
            mime_type=mime_type,
            status="uploaded"
        )
        db.add(doc)
        db.commit()
        db.refresh(doc)
        return doc

    def process_document(self, db: Session, doc_id: str) -> Dict[str, Any]:
        """
        Extracts plain text and generates an outline of chapters and concepts.
        """
        doc = db.query(Document).filter(Document.id == doc_id).first()
        if not doc:
            raise ValueError(f"Document {doc_id} not found")

        doc.status = "processing"
        db.commit()

        try:
            extracted_text = ""
            if os.path.exists(doc.file_path):
                try:
                    with open(doc.file_path, "r", encoding="utf-8", errors="ignore") as f:
                        extracted_text = f.read()
                except Exception:
                    extracted_text = f"Binary content extracted from {doc.title} ({doc.file_size} bytes)"

            doc.parsed_content = extracted_text
            doc.status = "processed"
            db.commit()
            db.refresh(doc)

            # Extract conceptual outline
            outline = self.extract_outline_heuristics(extracted_text)
            return {
                "document_id": doc.id,
                "title": doc.title,
                "status": doc.status,
                "extracted_length": len(extracted_text),
                "extracted_outline": outline
            }
        except Exception as e:
            doc.status = "failed"
            db.commit()
            raise e

    def extract_outline_heuristics(self, text: str) -> List[Dict[str, Any]]:
        """
        Heuristic regex parser to extract chapter and topic outlines from curriculum text.
        """
        chapters = []
        lines = text.splitlines()
        current_chapter = None

        for line in lines:
            line_str = line.strip()
            # Detect Chapter headers (e.g., "Chapter 1: Kinematics" or "Unit 2 - Calculus")
            chap_match = re.match(r'^(?:Chapter|Unit|Module)\s*(\d+)[\:\-\.]\s*(.*)$', line_str, re.IGNORECASE)
            if chap_match:
                current_chapter = {
                    "number": int(chap_match.group(1)),
                    "title": chap_match.group(2).strip(),
                    "topics": []
                }
                chapters.append(current_chapter)
                continue

            # Detect Topic bullets (e.g., "- 1.1 Vectors" or "• Newton's Laws")
            topic_match = re.match(r'^(?:[\-\*\•]|\d+\.\d+)\s*(.*)$', line_str)
            if topic_match and current_chapter is not None:
                topic_title = topic_match.group(1).strip()
                if len(topic_title) > 3:
                    current_chapter["topics"].append(topic_title)

        return chapters

document_ingestion_service = DocumentIngestionService()
