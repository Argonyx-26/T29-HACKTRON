"""
Analytics Service
Computes aggregate cohort metrics, topic struggle heatmaps,
and learning trajectory analytics.
"""
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Dict, Any, List

from app.models.all_models import StudentTwin, TopicMastery, Topic, Subject, User

class AnalyticsService:
    def get_cohort_overview(self, db: Session) -> Dict[str, Any]:
        students = db.query(User).filter(User.role == "student").all()
        total_students = len(students)
        if total_students == 0:
            return {
                "total_students": 0,
                "avg_cohort_mastery": 0.0,
                "struggling_students_count": 0,
                "mastered_students_count": 0,
                "at_risk_percentage": 0.0
            }

        twins = db.query(StudentTwin).all()
        if not twins:
            return {
                "total_students": total_students,
                "avg_cohort_mastery": 0.0,
                "struggling_students_count": 0,
                "mastered_students_count": 0,
                "at_risk_percentage": 0.0
            }

        masteries = [t.overall_mastery for t in twins]
        avg_mastery = sum(masteries) / len(masteries)
        struggling_count = sum(1 for m in masteries if m < 0.50)
        mastered_count = sum(1 for m in masteries if m >= 0.85)
        at_risk_pct = round((struggling_count / total_students) * 100.0, 1)

        return {
            "total_students": total_students,
            "avg_cohort_mastery": round(avg_mastery, 4),
            "struggling_students_count": struggling_count,
            "mastered_students_count": mastered_count,
            "at_risk_percentage": at_risk_pct
        }

    def get_topic_struggle_ranking(self, db: Session, limit: int = 10) -> List[Dict[str, Any]]:
        topics = db.query(Topic).all()
        results = []

        for topic in topics:
            records = db.query(TopicMastery).filter(TopicMastery.topic_id == topic.id).all()
            if not records:
                continue

            scores = [r.score for r in records]
            avg_score = sum(scores) / len(scores)
            struggling_count = sum(1 for r in records if r.status == "struggling" or r.score < 0.5)

            results.append({
                "topic_id": topic.id,
                "topic_code": topic.code,
                "topic_title": topic.title,
                "avg_mastery": round(avg_score, 4),
                "students_struggling_count": struggling_count
            })

        # Sort ascending by average mastery (hardest/most struggled first)
        results.sort(key=lambda x: x["avg_mastery"])
        return results[:limit]

    def get_student_diagnostic_report(self, db: Session, student_id: str) -> Dict[str, Any]:
        student = db.query(User).filter(User.id == student_id).first()
        if not student:
            return None

        twin = db.query(StudentTwin).filter(StudentTwin.student_id == student_id).first()
        if not twin:
            return {"student_id": student_id, "name": student.full_name, "twin": None}

        records = db.query(TopicMastery).filter(TopicMastery.twin_id == twin.id).all()
        mastered_topics = []
        struggling_topics = []
        in_progress_topics = []

        for r in records:
            topic = db.query(Topic).filter(Topic.id == r.topic_id).first()
            title = topic.title if topic else r.topic_id
            item = {"topic_id": r.topic_id, "title": title, "score": r.score}
            if r.status == "mastered":
                mastered_topics.append(item)
            elif r.status == "struggling":
                struggling_topics.append(item)
            else:
                in_progress_topics.append(item)

        return {
            "student_id": student.id,
            "student_name": student.full_name,
            "email": student.email,
            "overall_mastery": twin.overall_mastery,
            "cognitive_load": twin.cognitive_load,
            "learning_pace": twin.learning_pace,
            "topics_mastered_count": len(mastered_topics),
            "topics_struggling_count": len(struggling_topics),
            "struggling_topics": struggling_topics,
            "mastered_topics": mastered_topics,
            "in_progress_topics": in_progress_topics
        }

analytics_service = AnalyticsService()
