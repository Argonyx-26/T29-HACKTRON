"""
Mastery Service
Coordinates knowledge twin state updates, mastery recalculations,
and persistence into database sessions.
"""
from sqlalchemy.orm import Session
from datetime import datetime, timezone
import uuid

from app.models.all_models import StudentTwin, TopicMastery, Topic, AssessmentSubmission
from app.services.deterministic_engine import deterministic_engine

class MasteryService:
    def get_or_create_twin(self, db: Session, student_id: str) -> StudentTwin:
        twin = db.query(StudentTwin).filter(StudentTwin.student_id == student_id).first()
        if not twin:
            twin = StudentTwin(
                id=str(uuid.uuid4()),
                student_id=student_id,
                overall_mastery=0.0,
                cognitive_load=0.2,
                learning_pace=1.0,
                retention_decay=0.05
            )
            db.add(twin)
            db.commit()
            db.refresh(twin)
        return twin

    def get_or_create_topic_mastery(self, db: Session, twin_id: str, topic_id: str) -> TopicMastery:
        record = db.query(TopicMastery).filter(
            TopicMastery.twin_id == twin_id,
            TopicMastery.topic_id == topic_id
        ).first()
        if not record:
            record = TopicMastery(
                id=str(uuid.uuid4()),
                twin_id=twin_id,
                topic_id=topic_id,
                score=0.1,  # initial prior
                confidence=0.5,
                attempts_count=0,
                status="unseen"
            )
            db.add(record)
            db.commit()
            db.refresh(record)
        return record

    def record_practice_event(
        self,
        db: Session,
        student_id: str,
        topic_id: str,
        is_correct: bool
    ) -> TopicMastery:
        """
        Processes a single practice / item attempt and deterministically updates
        the TopicMastery and the StudentTwin's overall cognitive state.
        """
        twin = self.get_or_create_twin(db, student_id)
        topic_mastery = self.get_or_create_topic_mastery(db, twin.id, topic_id)

        # Apply BKT update
        new_score = deterministic_engine.update_bkt(
            prior_mastery=topic_mastery.score,
            is_correct=is_correct
        )

        topic_mastery.score = new_score
        topic_mastery.attempts_count += 1
        topic_mastery.confidence = min(0.95, round(topic_mastery.confidence + 0.05, 2))
        topic_mastery.last_practiced = datetime.now(timezone.utc)
        topic_mastery.status = deterministic_engine.evaluate_status(new_score, topic_mastery.attempts_count)

        db.commit()
        db.refresh(topic_mastery)

        # Recalculate StudentTwin overall status
        self.recalculate_twin_aggregates(db, twin.id)
        return topic_mastery

    def recalculate_twin_aggregates(self, db: Session, twin_id: str) -> StudentTwin:
        twin = db.query(StudentTwin).filter(StudentTwin.id == twin_id).first()
        if not twin:
            return None

        mastery_records = db.query(TopicMastery).filter(TopicMastery.twin_id == twin_id).all()
        scores = [r.score for r in mastery_records]

        metrics = deterministic_engine.aggregate_twin_metrics(scores)
        twin.overall_mastery = metrics["overall_mastery"]
        twin.cognitive_load = metrics["cognitive_load"]
        twin.learning_pace = metrics["learning_pace"]
        twin.last_synced_at = datetime.now(timezone.utc)

        db.commit()
        db.refresh(twin)
        return twin

    def get_knowledge_graph(self, db: Session, student_id: str) -> dict:
        """
        Constructs a structured knowledge graph representation for the student twin.
        """
        twin = self.get_or_create_twin(db, student_id)
        all_topics = db.query(Topic).all()
        masteries = {
            m.topic_id: m
            for m in db.query(TopicMastery).filter(TopicMastery.twin_id == twin.id).all()
        }

        nodes = []
        edges = []

        for topic in all_topics:
            m = masteries.get(topic.id)
            score = m.score if m else 0.0
            status = m.status if m else "unseen"

            nodes.append({
                "id": topic.id,
                "label": topic.title,
                "code": topic.code,
                "mastery": score,
                "status": status,
                "difficulty": topic.difficulty,
                "prerequisites": topic.prerequisite_topic_ids or []
            })

            for prereq_id in (topic.prerequisite_topic_ids or []):
                edges.append({"source": prereq_id, "target": topic.id})

        return {
            "student_id": student_id,
            "twin_id": twin.id,
            "overall_mastery": twin.overall_mastery,
            "nodes": nodes,
            "edges": edges
        }

mastery_service = MasteryService()
