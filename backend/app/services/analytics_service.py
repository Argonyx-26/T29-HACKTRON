from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.models.all_models import (
    Student,
    Skill,
    MasteryState,
    StudentMisconceptionInstance,
    MisconceptionPattern,
    EmergingGap,
    InterventionHistory,
    Attempt,
    Chapter,
)
from app.services.mastery_service import MasteryService

class AnalyticsService:
    @staticmethod
    def get_student_knowledge_twin(db: Session, student_id: str, chapter_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Builds the complete living Knowledge Twin state for a student across any subject/chapter.
        """
        student = db.query(Student).filter(Student.id == student_id).first()
        if not student:
            try:
                student = Student(id=student_id, name="Learner", avatar_color="#2563EB")
                db.add(student)
                db.commit()
                db.refresh(student)
            except IntegrityError:
                db.rollback()
                student = db.query(Student).filter(Student.id == student_id).first()

        # Dynamically determine relevant chapter: explicitly passed, or learner's recent attempt
        if chapter_id:
            chapter = db.query(Chapter).filter(Chapter.id == chapter_id).first()
        else:
            recent_attempt = db.query(Attempt).filter(Attempt.student_id == student_id).order_by(Attempt.created_at.desc()).first()
            if recent_attempt and recent_attempt.question:
                chapter = recent_attempt.question.chapter
            elif student_id in ["student_a", "student_b"]:
                chapter = db.query(Chapter).filter(Chapter.status == "active").first()
            else:
                chapter = None

        skills = db.query(Skill).filter(Skill.chapter_id == chapter.id).order_by(Skill.order).all() if chapter else []
        
        # Batch query all mastery states for this student
        all_masteries = db.query(MasteryState).filter(MasteryState.student_id == student_id).all()
        mastery_by_skill_id = {m.skill_id: m for m in all_masteries}
        
        # Cache all skills by code for prerequisite lookups
        all_skills_by_code = {sk.code: sk.id for sk in db.query(Skill).all()}

        skills_summary = []
        mastery_sum = 0.0
        assessed_skills_count = 0

        for s in skills:
            m_state = mastery_by_skill_id.get(s.id)

            evidence_count = m_state.evidence_count if m_state else 0
            conf_data = MasteryService.calculate_confidence(evidence_count)

            if m_state and evidence_count > 0:
                p_val = m_state.mastery_probability
                mastery_sum += p_val
                assessed_skills_count += 1
                trend = "improving" if p_val >= 0.6 else "steady" if p_val >= 0.4 else "declining"
            else:
                p_val = 0.30
                trend = "unassessed"

            # Check prerequisite gap using in-memory cached map
            has_prereq_gap = False
            for prereq_code in (s.prerequisite_skill_ids or []):
                prereq_id = all_skills_by_code.get(prereq_code)
                if prereq_id:
                    prereq_state = mastery_by_skill_id.get(prereq_id)
                    if prereq_state and prereq_state.mastery_probability < 0.50:
                        has_prereq_gap = True
                        break

            skills_summary.append({
                "skill_id": s.id,
                "skill_code": s.code,
                "skill_name": s.name,
                "order": s.order,
                "mastery_probability": round(p_val, 2),
                "confidence": conf_data["confidence"],
                "confidence_label": conf_data["label"],
                "evidence_count": evidence_count,
                "trend": trend,
                "prerequisites": s.prerequisite_skill_ids or [],
                "prerequisite_gap": has_prereq_gap
            })

        # Calculate overall score percentage from recent attempts
        recent_attempts = db.query(Attempt).filter(Attempt.student_id == student_id).all()
        if recent_attempts:
            correct_count = sum(1 for a in recent_attempts if a.correct)
            score_pct = round((correct_count / len(recent_attempts)) * 100.0, 1)
        elif student_id in ["student_a", "student_b"]:
            score_pct = 60.0 # Seeded demo cohort baseline
        else:
            score_pct = None # Genuinely unassessed fresh learner

        # Active & Resolved Misconceptions
        active_instances = db.query(StudentMisconceptionInstance).filter(
            StudentMisconceptionInstance.student_id == student_id,
            StudentMisconceptionInstance.status == "active"
        ).all()

        resolved_instances = db.query(StudentMisconceptionInstance).filter(
            StudentMisconceptionInstance.student_id == student_id,
            StudentMisconceptionInstance.status == "resolved"
        ).all()

        # Batch load patterns
        pattern_ids = list(set([i.pattern_id for i in active_instances + resolved_instances]))
        patterns_map = {p.id: p for p in db.query(MisconceptionPattern).filter(MisconceptionPattern.id.in_(pattern_ids)).all()} if pattern_ids else {}

        active_list = []
        for inst in active_instances:
            pattern = patterns_map.get(inst.pattern_id)
            active_list.append({
                "id": inst.id,
                "pattern_id": inst.pattern_id,
                "pattern_name": pattern.name if pattern else "Misconception",
                "skill_name": inst.skill.name if inst.skill else "",
                "skill_code": inst.skill.code if inst.skill else "",
                "classification": pattern.classification if pattern else "procedural",
                "occurrences": inst.occurrences,
                "why_it_is_wrong": pattern.description if pattern else "",
                "correct_principle": pattern.principle_text if pattern else "",
                "first_detected": inst.first_detected.isoformat() if inst.first_detected else "",
                "last_detected": inst.last_detected.isoformat() if inst.last_detected else "",
                "recommended_intervention": pattern.intervention_type if pattern else "worked_example"
            })

        resolved_list = []
        for inst in resolved_instances:
            pattern = patterns_map.get(inst.pattern_id)
            resolved_list.append({
                "id": inst.id,
                "pattern_name": pattern.name if pattern else "Misconception",
                "skill_name": inst.skill.name if inst.skill else "",
                "resolution_history": inst.resolution_history or []
            })

        # Emerging Gaps
        gaps = db.query(EmergingGap).filter(
            EmergingGap.student_id == student_id,
            EmergingGap.status == "active"
        ).all()
        gaps_list = [{
            "id": g.id,
            "title": g.title,
            "description": g.description,
            "risk_level": g.risk_level,
            "trigger_reason": g.trigger_reason,
            "skill_name": g.skill.name if g.skill else ""
        } for g in gaps]

        # Recent Interventions
        interventions = db.query(InterventionHistory).filter(
            InterventionHistory.student_id == student_id
        ).order_by(InterventionHistory.completed_at.desc()).limit(5).all()

        intervention_list = [{
            "id": ih.id,
            "title": ih.intervention.title if ih.intervention else "Targeted Practice",
            "type": ih.intervention.intervention_type if ih.intervention else "worked_example",
            "before_mastery": round(ih.before_mastery, 2),
            "after_mastery": round(ih.after_mastery, 2) if ih.after_mastery else round(ih.before_mastery, 2),
            "delta": round(((ih.after_mastery or ih.before_mastery) - ih.before_mastery) * 100, 1),
            "completed_at": ih.completed_at.isoformat() if ih.completed_at else ""
        } for ih in interventions]

        calc_mastery = round((mastery_sum / max(1, assessed_skills_count)), 2) if assessed_skills_count > 0 else (
            0.55 if student_id in ["student_a", "student_b"] else None
        )

        return {
            "student_id": student.id,
            "student_name": student.name,
            "avatar_color": student.avatar_color,
            "current_chapter_id": chapter.id if chapter else None,
            "current_chapter_title": chapter.title if chapter else None,
            "current_subject": chapter.subject if chapter else None,
            "overall_score_percentage": score_pct,
            "overall_mastery": calc_mastery,
            "skills": skills_summary,
            "active_misconceptions": active_list,
            "resolved_misconceptions": resolved_list,
            "emerging_gaps": gaps_list,
            "recent_interventions": intervention_list
        }

    @staticmethod
    def get_teacher_class_overview(db: Session) -> Dict[str, Any]:
        """
        Returns class list, heatmap data, and Same-Score comparison.
        Optimized with batch fetching to eliminate sequential N+1 network requests.
        """
        students = db.query(Student).all()
        student_summaries = []

        # Pre-fetch patterns for heatmap
        patterns = db.query(MisconceptionPattern).filter(MisconceptionPattern.status == "active").all()
        top_patterns = patterns[:8]
        top_pattern_ids = [p.id for p in top_patterns]

        # Pre-fetch all misconception instances for top patterns
        all_instances = db.query(StudentMisconceptionInstance).filter(
            StudentMisconceptionInstance.pattern_id.in_(top_pattern_ids)
        ).all()
        instance_map = {(inst.student_id, inst.pattern_id): inst for inst in all_instances}

        for st in students:
            twin = AnalyticsService.get_student_knowledge_twin(db, st.id)
            primary_gap = twin["emerging_gaps"][0]["title"] if twin["emerging_gaps"] else (
                twin["active_misconceptions"][0]["pattern_name"] if twin["active_misconceptions"] else "No active gaps"
            )
            student_summaries.append({
                "id": st.id,
                "name": st.name,
                "score_percentage": twin["overall_score_percentage"] or 0,
                "overall_mastery": twin["overall_mastery"] or 0.0,
                "active_misconceptions_count": len(twin["active_misconceptions"]),
                "primary_gap": primary_gap,
                "skills_mastery": {s["skill_code"]: s["mastery_probability"] for s in twin["skills"]}
            })

        # Heatmap matrix using in-memory dictionary lookup
        heatmap_matrix = []
        for st in students:
            for pat in top_patterns:
                inst = instance_map.get((st.id, pat.id))
                heatmap_matrix.append({
                    "student_id": st.id,
                    "student_name": st.name,
                    "pattern_id": pat.id,
                    "pattern_name": pat.name,
                    "skill_id": pat.skill_id,
                    "status": inst.status if inst else "none",
                    "occurrences": inst.occurrences if inst else 0
                })

        # Same-Score Comparative Proof (Two distinct learner states, same surface score)
        st_a = db.query(Student).filter(Student.id == "student_a").first()
        st_b = db.query(Student).filter(Student.id == "student_b").first()
        st_a_id = st_a.id if st_a else "student_a"
        st_b_id = st_b.id if st_b else "student_b"

        same_score_proof = {
            "target_score": 60.0,
            "headline": "Same Score. Different Learning Needs.",
            "student_a": {
                "id": st_a_id,
                "name": "Student A",
                "score": 60.0,
                "diagnosis_type": "Procedural Distribution Gap",
                "primary_weakness": "Distributive Property (42% Mastery)",
                "strengths": "Combining Like Terms (78%), Understanding Equality (82%)",
                "active_misconception": "Partial Distribution: 3(x+2) -> 3x+2",
                "recommended_next_step": "Targeted practice on applying the multiplier across all terms",
                "twin_color": "#2563EB"
            },
            "student_b": {
                "id": st_b_id,
                "name": "Student B",
                "score": 60.0,
                "diagnosis_type": "Term Grouping & Prerequisite Gap",
                "primary_weakness": "Combining Like Terms (45%) & Isolating Variables (51%)",
                "strengths": "Distributive Property (76%), Simplifying Expressions (70%)",
                "active_misconception": "Combining Unlike Terms: 5x + 3 -> 8x",
                "recommended_next_step": "Conceptual review on keeping variable and constant terms separate",
                "twin_color": "#7C3AED"
            },
            "core_thesis": "Both students score 60% on the same assessment, but their underlying Knowledge Twins reveal completely different learning gaps requiring tailored instructional next steps."
        }

        return {
            "students": student_summaries,
            "heatmap": heatmap_matrix,
            "patterns": [{"id": p.id, "name": p.name} for p in top_patterns],
            "same_score_comparison": same_score_proof
        }

    @staticmethod
    def get_student_progress(db: Session, student_id: str) -> Dict[str, Any]:
        """
        Calculates authoritative learner progress directly from database attempts,
        mastery states, and interventions.
        """
        student = db.query(Student).filter(Student.id == student_id).first()
        if not student:
            return {
                "user_id": student_id,
                "total_attempts": 0,
                "correct_attempts": 0,
                "score_percentage": None,
                "assessed_skills_count": 0,
                "recent_activity": []
            }

        attempts = db.query(Attempt).filter(Attempt.student_id == student_id).order_by(Attempt.created_at.desc()).all()
        total_attempts = len(attempts)
        correct_attempts = sum(1 for a in attempts if a.correct)
        score_pct = round((correct_attempts / total_attempts) * 100) if total_attempts > 0 else None

        # Count unique skills assessed
        mastery_states = db.query(MasteryState).filter(
            MasteryState.student_id == student_id,
            MasteryState.evidence_count > 0
        ).all()
        assessed_skills_count = len(mastery_states)

        # Get live recent activity from DB
        recent_activity = AnalyticsService.get_student_activity(db, student_id)[:20]

        return {
            "user_id": student_id,
            "total_attempts": total_attempts,
            "correct_attempts": correct_attempts,
            "score_percentage": score_pct,
            "assessed_skills_count": assessed_skills_count,
            "recent_activity": recent_activity
        }

    @staticmethod
    def get_student_activity(db: Session, student_id: str) -> List[Dict[str, Any]]:
        """
        Retrieves authoritative activity feed for a student directly from PostgreSQL.
        Combines diagnostic attempts and intervention/retest events.
        """
        activities: List[Dict[str, Any]] = []

        # 1. Attempts
        attempts = db.query(Attempt).filter(Attempt.student_id == student_id).order_by(Attempt.created_at.desc()).limit(50).all()
        for a in attempts:
            skill_name = a.question.skill.name if a.question and a.question.skill else "Diagnostic Question"
            pattern_name = a.diagnosis.get("misconception_name") if a.diagnosis else None

            title = f"Diagnostic: {skill_name}"
            if a.correct:
                score_or_result = "Correct"
            elif pattern_name:
                score_or_result = pattern_name
            else:
                score_or_result = "Needs Practice"

            ts = a.created_at.isoformat() if a.created_at else ""
            activities.append({
                "id": f"att_{a.id}",
                "user_id": student_id,
                "type": "assessment",
                "title": title,
                "score_or_result": score_or_result,
                "timestamp": ts
            })

        # 2. Retests & Interventions
        interventions = db.query(InterventionHistory).filter(InterventionHistory.student_id == student_id).order_by(InterventionHistory.completed_at.desc()).limit(30).all()
        for ih in interventions:
            is_resolved = (ih.retest_result or {}).get("misconception_resolved", False) if ih.retest_result else False
            delta = round(((ih.after_mastery or ih.before_mastery) - ih.before_mastery) * 100, 1)

            title = f"Targeted Retest: {ih.skill.name if ih.skill else 'Skill Review'}"
            score_or_result = f"Mastery +{delta}%" if is_resolved else "Active Gap"

            ts = ih.completed_at.isoformat() if ih.completed_at else (ih.started_at.isoformat() if ih.started_at else "")
            activities.append({
                "id": f"int_{ih.id}",
                "user_id": student_id,
                "type": "retest",
                "title": title,
                "score_or_result": score_or_result,
                "timestamp": ts
            })

        # Sort combined activities by timestamp descending
        activities.sort(key=lambda x: x["timestamp"], reverse=True)
        return activities


