from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import uuid

from app.database import get_db
from app.models.all_models import Group, GroupMember, User
from app.schemas.all_schemas import GroupResponse, GroupCreate

router = APIRouter(prefix="/groups", tags=["Cohort Groups"])

@router.get("", response_model=List[GroupResponse])
def list_groups(db: Session = Depends(get_db)):
    return db.query(Group).all()

@router.post("", response_model=GroupResponse, status_code=status.HTTP_201_CREATED)
def create_group(group_in: GroupCreate, db: Session = Depends(get_db)):
    group = Group(
        id=str(uuid.uuid4()),
        name=group_in.name,
        subject_id=group_in.subject_id,
        description=group_in.description,
        cohort_year=group_in.cohort_year
    )
    db.add(group)
    db.commit()
    db.refresh(group)
    return group

@router.get("/{group_id}", response_model=GroupResponse)
def get_group(group_id: str, db: Session = Depends(get_db)):
    group = db.query(Group).filter(Group.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    return group

@router.post("/{group_id}/members/{student_id}", status_code=status.HTTP_201_CREATED)
def add_student_to_group(group_id: str, student_id: str, db: Session = Depends(get_db)):
    group = db.query(Group).filter(Group.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")

    student = db.query(User).filter(User.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    existing = db.query(GroupMember).filter(
        GroupMember.group_id == group_id,
        GroupMember.student_id == student_id
    ).first()
    if existing:
        return {"message": "Student already a member of this group"}

    member = GroupMember(
        id=str(uuid.uuid4()),
        group_id=group_id,
        student_id=student_id
    )
    db.add(member)
    db.commit()
    return {"message": f"Student {student.full_name} added to {group.name}"}
