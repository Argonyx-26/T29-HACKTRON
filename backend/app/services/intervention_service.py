"""
Intervention Service
Identifies learning gaps, automatically recommends targeted interventions,
and pairs struggling students with peer tutors.
"""
from sqlalchemy.orm import Session
from datetime import datetime, timezone
import uuid
from typing import List

from app.models.all_models import Intervention, TopicMastery, Topic, StudentTwin, User

class InterventionService:
    def scan_and_generate_interventions(self, db: Session) -> List[Intervention]:
        """
        Scans all topic masteries across student twins. For any topic with status 'struggling'
        (or score < 0.45 after multiple attempts), generates an intervention recommendation.
        """
        struggling_records = (
            db.query(TopicMastery)
            .filter(TopicMastery.status == "struggling")
            .all()
        )

        new_interventions = []

        for record in struggling_records:
            twin = db.query(StudentTwin).filter(StudentTwin.id == record.twin_id).first()
            if not twin:
                continue

            # Check if an active intervention already exists
            existing = (
                db.query(Intervention)
                .filter(
                    Intervention.student_id == twin.student_id,
                    Intervention.topic_id == record.topic_id,
                    Intervention.status.in_(["recommended", "scheduled"])
                )
                .first()
            )
            if existing:
                continue

            topic = db.query(Topic).filter(Topic.id == record.topic_id).first()
            topic_title = topic.title if topic else "concept"

            # Determine intervention type based on score
            if record.score < 0.30:
                intervention_type = "teacher_1on1"
                action_plan = f"Schedule a 1-on-1 diagnostic review on {topic_title} fundamentals."
            elif record.score < 0.45:
                intervention_type = "peer_tutoring"
                action_plan = f"Pair with a peer cohort mentor who has mastered {topic_title}."
            else:
                intervention_type = "remedial_material"
                action_plan = f"Assign targeted flash drills and conceptual cheat sheet on {topic_title}."

            intervention = Intervention(
                id=str(uuid.uuid4()),
                student_id=twin.student_id,
                topic_id=record.topic_id,
                type=intervention_type,
                status="recommended",
                recommendation_reason=(
                    f"Student knowledge twin indicates low mastery ({record.score * 100:.1f}%) "
                    f"after {record.attempts_count} practice attempts."
                ),
                action_plan=action_plan
            )
            db.add(intervention)
            new_interventions.append(intervention)

        if new_interventions:
            db.commit()
            for item in new_interventions:
                db.refresh(item)

        return new_interventions

    def find_peer_mentors(self, db: Session, topic_id: str, limit: int = 3) -> List[User]:
        """
        Finds students in the cohort who have mastered the given topic (score >= 0.85).
        """
        high_mastery_records = (
            db.query(TopicMastery)
            .filter(
                TopicMastery.topic_id == topic_id,
                TopicMastery.score >= 0.85
            )
            .limit(limit)
            .all()
        )

        mentors = []
        for record in high_mastery_records:
            twin = db.query(StudentTwin).filter(StudentTwin.id == record.twin_id).first()
            if twin:
                student = db.query(User).filter(User.id == twin.student_id).first()
                if student:
                    mentors.append(student)
        return mentors

    def update_intervention_status(
        self, db: Session, intervention_id: str, new_status: str
    ) -> Intervention:
        intervention = db.query(Intervention).filter(Intervention.id == intervention_id).first()
        if not intervention:
            return None
        intervention.status = new_status
        db.commit()
        db.refresh(intervention)
        return intervention

intervention_service = InterventionService()
