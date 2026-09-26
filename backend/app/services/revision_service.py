import math
import datetime
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session

from app.models.all_models import (
    Skill,
    MasteryState,
    Attempt,
    Question,
    Chapter,
    Student
)
from app.services.mastery_service import MasteryService


class RevisionService:
    """
    Continuous Knowledge Twin Revision Engine based on Ebbinghaus Forgetting Curves
    and Spaced Retrieval Scheduling.
    
    Rather than 'Mastered -> Done', skills naturally decay over time:
      Strong (>= 85%) -> Stable (70%-84%) -> Fading (50%-69%) -> At Risk (< 50%)
    """

    @staticmethod
    def calculate_memory_status(retrievability_pct: float) -> str:
        if retrievability_pct >= 85.0:
            return "strong"
        elif retrievability_pct >= 70.0:
            return "stable"
        elif retrievability_pct >= 50.0:
            return "fading"
        else:
            return "at_risk"

    @staticmethod
    def get_revision_overview(db: Session, student_id: str, student_db: Optional[Session] = None) -> Dict[str, Any]:
        """
        Calculates real-time continuous memory status for all skills tracked by the Knowledge Twin.
        Curriculum data (skills, questions) from shared db.
        Student data (attempts, mastery) from student_db (student's private DB).
        """
        sdb = student_db if student_db is not None else db
        student = sdb.query(Student).filter(Student.id == student_id).first()
        if not student:
            student = db.query(Student).filter(Student.id == student_id).first()
        if not student:
            # Return empty state for new students
            student_id_safe = student_id

        now = datetime.datetime.utcnow()

        # Load all skills (shared DB), mastery states and attempts (student DB)
        skills = db.query(Skill).order_by(Skill.order).all()
        mastery_states = sdb.query(MasteryState).filter(MasteryState.student_id == student_id).all()
        mastery_map = {m.skill_id: m for m in mastery_states}

        recent_attempts = sdb.query(Attempt).filter(
            Attempt.student_id == student_id
        ).order_by(Attempt.created_at.desc()).all()

        # Map question_id to skill_id from shared curriculum DB (do NOT lazy-load on student_db)
        question_skill_map = {q.id: q.skill_id for q in db.query(Question.id, Question.skill_id).all()}
        last_attempt_by_skill: Dict[str, Attempt] = {}
        for att in recent_attempts:
            sk_id = question_skill_map.get(att.question_id)
            if sk_id and sk_id not in last_attempt_by_skill:
                last_attempt_by_skill[sk_id] = att

        # 1. Identify active skills for THIS student:
        # STRICT ISOLATION: Only include skills the student has ACTUALLY attempted or has mastery for.
        student_skill_ids = set()
        for sk_id, m in mastery_map.items():
            if m.evidence_count > 0:
                student_skill_ids.add(sk_id)
        for sk_id in last_attempt_by_skill.keys():
            student_skill_ids.add(sk_id)

        active_skills = [s for s in skills if s.id in student_skill_ids]

        skills_memory: List[Dict[str, Any]] = []

        for skill in active_skills:
            m_state = mastery_map.get(skill.id)
            last_att = last_attempt_by_skill.get(skill.id)

            # Determine real elapsed time since last practice
            last_time = None
            if last_att and last_att.created_at:
                last_time = last_att.created_at
            elif m_state and m_state.last_updated:
                last_time = m_state.last_updated

            if last_time:
                delta_days = max(0.01, (now - last_time).total_seconds() / 86400.0)
            else:
                delta_days = 0.5

            base_mastery = m_state.mastery_probability if m_state else 0.3
            evidence_count = m_state.evidence_count if m_state else 1

            # Half-life / Memory Stability in days: based on real evidence and mastery
            stability_days = max(1.0, round(5.0 * (1.0 + 0.3 * min(evidence_count, 8)) * (base_mastery / 0.75), 1))

            # Exponential decay formula: R = e^(-t / S)
            decay_factor = math.exp(-delta_days / stability_days)
            retrievability = round(base_mastery * decay_factor * 100.0, 1)
            retrievability = max(5.0, min(100.0, retrievability))

            status = RevisionService.calculate_memory_status(retrievability)

            # Determine next recommended retrieval schedule
            if status == "at_risk":
                next_review = "Today (Overdue)"
                review_urgency = "high"
            elif status == "fading":
                next_review = "Today (Optimal window)"
                review_urgency = "high"
            elif status == "stable":
                days_left = max(1, round(stability_days * 0.3))
                next_review = f"In {days_left} day{'s' if days_left > 1 else ''}"
                review_urgency = "medium"
            else:  # strong
                days_left = max(3, round(stability_days * 0.7))
                next_review = f"In {days_left} days"
                review_urgency = "low"

            chapter = skill.chapter
            skills_memory.append({
                "skill_id": skill.id,
                "skill_code": skill.code,
                "skill_name": skill.name,
                "chapter_id": chapter.id if chapter else None,
                "chapter_title": chapter.title if chapter else "Curriculum",
                "current_mastery": round(base_mastery, 2),
                "retrievability": retrievability,
                "status": status,
                "stability_days": stability_days,
                "days_since_review": round(delta_days, 1),
                "next_review": next_review,
                "review_urgency": review_urgency,
                "evidence_count": evidence_count
            })

        # Categorize into the 4 memory status buckets
        strong_skills = [s for s in skills_memory if s["status"] == "strong"]
        stable_skills = [s for s in skills_memory if s["status"] == "stable"]
        fading_skills = [s for s in skills_memory if s["status"] == "fading"]
        at_risk_skills = [s for s in skills_memory if s["status"] == "at_risk"]

        # Urgent queue: prioritize At Risk, then Fading, then older Stable
        urgent_queue = at_risk_skills + fading_skills
        if not urgent_queue and stable_skills:
            urgent_queue = stable_skills[:2]

        needs_today = len(at_risk_skills) + len(fading_skills)
        avg_retrievability = round(
            sum(s["retrievability"] for s in skills_memory) / max(1, len(skills_memory)), 1
        ) if skills_memory else 0.0

        # Select targeted practice questions strictly for THIS student's urgent skills
        practice_questions: List[Dict[str, Any]] = []
        target_skills = urgent_queue[:3] if urgent_queue else skills_memory[:3]
        for sk_data in target_skills:
            sk_id = sk_data["skill_id"]
            q = db.query(Question).filter(Question.skill_id == sk_id, Question.active == True).first()
            if q and not any(item["question_id"] == q.id for item in practice_questions):
                practice_questions.append({
                    "question_id": q.id,
                    "skill_id": q.skill_id,
                    "skill_code": sk_data["skill_code"],
                    "skill_name": sk_data["skill_name"],
                    "question_text": q.question_text,
                    "correct_answer": q.correct_answer,
                    "difficulty": q.difficulty or "medium"
                })

        if not practice_questions:
            # Fallback to high-yield active questions so retrieval practice is always immediately ready
            fallback_qs = db.query(Question).filter(Question.active == True).limit(3).all()
            for q in fallback_qs:
                sk = db.query(Skill).filter(Skill.id == q.skill_id).first() if q.skill_id else None
                practice_questions.append({
                    "question_id": q.id,
                    "skill_id": q.skill_id or "sk_gen_01",
                    "skill_code": sk.code if sk else "REV-01",
                    "skill_name": sk.name if sk else "Core Fundamentals",
                    "question_text": q.question_text,
                    "correct_answer": q.correct_answer,
                    "difficulty": q.difficulty or "medium"
                })

        if not skills_memory:
            rationale = "Explore a quick 3-minute diagnostic practice session to baseline your initial cognitive profile and activate retention tracking."
            session_title = "3-Minute Starter Retrieval Practice"
            est_minutes = 3
        elif needs_today > 0:
            rationale = (
                f"{needs_today} skill{'s have' if needs_today != 1 else ' has'} entered the fading or at-risk zone. "
                "A 3-minute spaced retrieval practice will reset their forgetting curve and strengthen neural retention."
            )
            session_title = "3-Minute Daily Retrieval Practice"
            est_minutes = 3
        else:
            rationale = "All assessed skills are currently in stable or strong memory. Complete a quick retrieval tune-up to keep them resilient."
            session_title = "Memory Stability Maintained"
            est_minutes = 3

        return {
            "student_id": student_id,
            "student_name": student.name if student else "Student",
            "retention_resilience_index": avg_retrievability,
            "total_skills_tracked": len(skills_memory),
            "needs_practice_today_count": needs_today,
            "status_counts": {
                "strong": len(strong_skills),
                "stable": len(stable_skills),
                "fading": len(fading_skills),
                "at_risk": len(at_risk_skills)
            },
            "scheduled_session": {
                "title": session_title,
                "recommended_for": "today",
                "estimated_minutes": est_minutes,
                "questions_count": len(practice_questions),
                "rationale": rationale
            },
            "practice_questions": practice_questions,
            "buckets": {
                "strong": strong_skills,
                "stable": stable_skills,
                "fading": fading_skills,
                "at_risk": at_risk_skills
            },
            "all_skills": sorted(skills_memory, key=lambda s: s["retrievability"])
        }

    @staticmethod
    def process_retrieval_practice(
        db: Session,
        student_id: str,
        answers: List[Dict[str, Any]],
        student_db: Optional[Session] = None
    ) -> Dict[str, Any]:
        """
        Processes answers for the 3-minute retrieval practice.
        Boosts retrievability, records attempts, updates BKT mastery, and returns consolidation results.
        Curriculum data (questions) from shared db.
        Student data (attempts, mastery) written to student_db.
        """
        sdb = student_db if student_db is not None else db
        import re
        results = []
        now = datetime.datetime.utcnow()

        for item in answers:
            q_id = item.get("question_id")
            user_ans = str(item.get("answer", "")).strip()

            # Read question from shared DB
            question = db.query(Question).filter(Question.id == q_id).first()
            if not question:
                continue

            # Check correctness
            norm_user = user_ans.lower().replace(" ", "")
            norm_corr = question.correct_answer.strip().lower().replace(" ", "")
            val_user = re.sub(r'^[a-z_]+=', '', norm_user)
            val_corr = re.sub(r'^[a-z_]+=', '', norm_corr)
            is_correct = (norm_user == norm_corr) or (val_user == val_corr)
            if not is_correct:
                try:
                    if float(val_user) == float(val_corr):
                        is_correct = True
                except (ValueError, TypeError):
                    pass

            # Record attempt in student's private DB
            attempt = Attempt(
                id=f"att_rev_{q_id}_{now.strftime('%H%M%S')}",
                student_id=student_id,
                question_id=q_id,
                answer=user_ans,
                work_shown=[f"Retrieval practice: {user_ans}"],
                input_mode="retrieval_practice",
                correct=is_correct,
                confidence=0.9 if is_correct else 0.4,
                created_at=now
            )
            sdb.add(attempt)

            # Update MasteryState via BKT in student's private DB
            m_state = MasteryService.record_attempt(
                sdb, student_id, question.skill_id, is_correct, event_name="retrieval_practice"
            )
            # Ensure last_updated is explicitly bumped
            m_state.last_updated = now

            skill = db.query(Skill).filter(Skill.id == question.skill_id).first()

            results.append({
                "question_id": q_id,
                "skill_id": question.skill_id,
                "skill_code": skill.code if skill else "",
                "skill_name": skill.name if skill else "",
                "user_answer": user_ans,
                "correct_answer": question.correct_answer,
                "is_correct": is_correct,
                "new_mastery": round(m_state.mastery_probability, 2),
                "boosted_status": "strong" if is_correct else "stable"
            })

        sdb.commit()

        correct_count = sum(1 for r in results if r["is_correct"])

        return {
            "success": True,
            "total_questions": len(results),
            "correct_count": correct_count,
            "accuracy_percentage": round((correct_count / max(1, len(results))) * 100),
            "message": (
                f"Memory consolidated! {correct_count}/{len(results)} retrieval prompts answered correctly. "
                "Your Knowledge Twin has pushed your next review intervals forward."
            ),
            "results": results
        }
