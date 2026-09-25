from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
import uuid

from app.database import get_db
from app.models.all_models import Chapter, Topic, Subject
from app.schemas.all_schemas import ChapterResponse, ChapterCreate, TopicResponse, TopicCreate

router = APIRouter(prefix="/chapters", tags=["Chapters & Topics"])

@router.get("", response_model=List[ChapterResponse])
def list_chapters(
    subject_id: Optional[str] = Query(None, description="Filter chapters by subject ID"),
    db: Session = Depends(get_db)
):
    query = db.query(Chapter)
    if subject_id:
        query = query.filter(Chapter.subject_id == subject_id)
    return query.order_num.asc() if hasattr(query, 'order_num') else query.all()

@router.post("", response_model=ChapterResponse, status_code=status.HTTP_201_CREATED)
def create_chapter(chapter_in: ChapterCreate, db: Session = Depends(get_db)):
    subject = db.query(Subject).filter(Subject.id == chapter_in.subject_id).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")

    chapter = Chapter(
        id=str(uuid.uuid4()),
        subject_id=chapter_in.subject_id,
        title=chapter_in.title,
        order_num=chapter_in.order_num,
        description=chapter_in.description
    )
    db.add(chapter)
    db.commit()
    db.refresh(chapter)
    return chapter

@router.get("/{chapter_id}", response_model=ChapterResponse)
def get_chapter(chapter_id: str, db: Session = Depends(get_db)):
    chapter = db.query(Chapter).filter(Chapter.id == chapter_id).first()
    if not chapter:
        raise HTTPException(status_code=404, detail="Chapter not found")
    return chapter

@router.post("/topics", response_model=TopicResponse, status_code=status.HTTP_201_CREATED)
def create_topic(topic_in: TopicCreate, db: Session = Depends(get_db)):
    chapter = db.query(Chapter).filter(Chapter.id == topic_in.chapter_id).first()
    if not chapter:
        raise HTTPException(status_code=404, detail="Chapter not found")

    topic = Topic(
        id=str(uuid.uuid4()),
        chapter_id=topic_in.chapter_id,
        code=topic_in.code,
        title=topic_in.title,
        description=topic_in.description,
        difficulty=topic_in.difficulty,
        prerequisite_topic_ids=topic_in.prerequisite_topic_ids
    )
    db.add(topic)
    db.commit()
    db.refresh(topic)
    return topic
