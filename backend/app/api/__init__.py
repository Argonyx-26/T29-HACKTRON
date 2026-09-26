from app.api.admin import router as admin_router
from app.api.assessments import router as assessments_router
from app.api.chapters import router as chapters_router
from app.api.documents import router as documents_router
from app.api.groups import router as groups_router
from app.api.interventions import router as interventions_router
from app.api.revision import router as revision_router
from app.api.subjects import router as subjects_router
from app.api.teacher import router as teacher_router
from app.api.twin import router as twin_router

__all__ = [
    "admin_router",
    "assessments_router",
    "chapters_router",
    "documents_router",
    "groups_router",
    "interventions_router",
    "revision_router",
    "subjects_router",
    "teacher_router",
    "twin_router"
]
