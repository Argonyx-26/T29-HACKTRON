import uuid
import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from pydantic import BaseModel

from app.database import get_db
from app.models.all_models import StudyGroup

router = APIRouter(prefix="/groups", tags=["Study Groups"])

class CreateGroupPayload(BaseModel):
    name: str
    subject: str = "Mathematics"
    description: Optional[str] = None
    target_goal: Optional[str] = None
    creator_id: Optional[str] = None
    creator_name: Optional[str] = "Student"

class JoinGroupPayload(BaseModel):
    code: str
    user_id: Optional[str] = None
    user_name: Optional[str] = "Student"

class ShareMaterialPayload(BaseModel):
    title: str
    type: str = "Notes"
    date: Optional[str] = None

class AddPromptPayload(BaseModel):
    prompt: str
    skill: str

@router.get("", response_model=List[Dict[str, Any]])
def list_groups(subject: Optional[str] = None, db: Session = Depends(get_db)):
    """List active study groups."""
    query = db.query(StudyGroup)
    if subject:
        query = query.filter(StudyGroup.subject.ilike(f"%{subject}%"))
    groups = query.order_by(StudyGroup.created_at.desc()).all()

    return [{
        "id": g.id,
        "name": g.name,
        "subject": g.subject,
        "code": g.code,
        "memberCount": g.member_count,
        "description": g.description or "",
        "targetGoal": g.target_goal or "Complete curriculum modules",
        "goalProgress": g.goal_progress or 0,
        "sharedMaterials": g.shared_materials or [],
        "collaborativePrompts": g.collaborative_prompts or [],
        "recentActivity": g.recent_activity or []
    } for g in groups]

@router.get("/{group_id}")
def get_group(group_id: str, db: Session = Depends(get_db)):
    """Get single group by ID or code."""
    group = db.query(StudyGroup).filter(
        (StudyGroup.id == group_id) | (StudyGroup.code.ilike(group_id))
    ).first()
    if not group:
        raise HTTPException(status_code=404, detail="Study group not found")

    return {
        "id": group.id,
        "name": group.name,
        "subject": group.subject,
        "code": group.code,
        "memberCount": group.member_count,
        "description": group.description,
        "targetGoal": group.target_goal,
        "goalProgress": group.goal_progress,
        "sharedMaterials": group.shared_materials or [],
        "collaborativePrompts": group.collaborative_prompts or [],
        "recentActivity": group.recent_activity or []
    }

@router.post("")
def create_group(payload: CreateGroupPayload, db: Session = Depends(get_db)):
    """Create a new study group."""
    subj_code = (payload.subject[:3] if payload.subject else "GEN").upper()
    code = f"KT-{subj_code}-{uuid.uuid4().hex[:3].upper()}"
    group_id = f"grp_{uuid.uuid4().hex[:8]}"
    
    group = StudyGroup(
        id=group_id,
        name=payload.name,
        subject=payload.subject,
        code=code,
        description=payload.description or "Collaborative learning group.",
        target_goal=payload.target_goal or "Complete joint curriculum modules",
        goal_progress=10,
        member_count=1,
        shared_materials=[],
        collaborative_prompts=[],
        recent_activity=[
            {"user": payload.creator_name or "You", "action": "created the study group", "time": "Just now"}
        ],
        creator_id=payload.creator_id,
        created_at=datetime.datetime.utcnow()
    )
    db.add(group)
    db.commit()
    db.refresh(group)

    return {
        "id": group.id,
        "name": group.name,
        "subject": group.subject,
        "code": group.code,
        "memberCount": group.member_count,
        "description": group.description,
        "targetGoal": group.target_goal,
        "goalProgress": group.goal_progress,
        "sharedMaterials": group.shared_materials,
        "collaborativePrompts": group.collaborative_prompts,
        "recentActivity": group.recent_activity
    }

@router.post("/join")
def join_group(payload: JoinGroupPayload, db: Session = Depends(get_db)):
    """Join a study group using an invite code."""
    group = db.query(StudyGroup).filter(StudyGroup.code.ilike(payload.code.strip())).first()
    if not group:
        raise HTTPException(status_code=404, detail="Invalid group code")

    group.member_count += 1
    new_act = list(group.recent_activity or [])
    new_act.insert(0, {"user": payload.user_name or "You", "action": "joined the group", "time": "Just now"})
    group.recent_activity = new_act[:10]
    db.commit()
    db.refresh(group)

    return {
        "id": group.id,
        "name": group.name,
        "subject": group.subject,
        "code": group.code,
        "memberCount": group.member_count,
        "description": group.description,
        "targetGoal": group.target_goal,
        "goalProgress": group.goal_progress,
        "sharedMaterials": group.shared_materials or [],
        "collaborativePrompts": group.collaborative_prompts or [],
        "recentActivity": group.recent_activity or []
    }

@router.post("/{group_id}/materials")
def share_material(group_id: str, payload: ShareMaterialPayload, db: Session = Depends(get_db)):
    """Share study notes or material with group members."""
    group = db.query(StudyGroup).filter(StudyGroup.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Study group not found")

    materials = list(group.shared_materials or [])
    materials.insert(0, {
        "title": payload.title,
        "type": payload.type,
        "date": payload.date or "Just now"
    })
    group.shared_materials = materials
    db.commit()
    return {"status": "shared", "shared_materials": group.shared_materials}

@router.post("/{group_id}/prompts")
def add_prompt(group_id: str, payload: AddPromptPayload, db: Session = Depends(get_db)):
    """Add a collaborative challenge practice prompt."""
    group = db.query(StudyGroup).filter(StudyGroup.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Study group not found")

    prompts = list(group.collaborative_prompts or [])
    prompts.append({
        "prompt": payload.prompt,
        "skill": payload.skill,
        "completedCount": 0
    })
    group.collaborative_prompts = prompts
    db.commit()
    return {"status": "added", "collaborative_prompts": group.collaborative_prompts}
