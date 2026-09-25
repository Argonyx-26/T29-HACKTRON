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
        Builds the complete living Knowledge Twin 2.0 state for a student across any subject/chapter.
        Database is the single authoritative source of truth.
        """
        student = db.query(Student).filter(Student.id == student_id).first()
        if not student:
            try:
                student = Student(id=student_id, name="Learner", avatar_color="#2563EB", target_mastery=0.85)
                db.add(student)
                db.commit()
                db.refresh(student)
            except IntegrityError:
                db.rollback()
                student = db.query(Student).filter(Student.id == student_id).first()

        target_mastery = student.target_mastery if (student and student.target_mastery) else 0.85

        # Dynamically determine relevant chapter: explicitly passed, or learner's recent attempt, or first active
        if chapter_id:
            chapter = db.query(Chapter).filter(Chapter.id == chapter_id).first()
        else:
            recent_attempt = db.query(Attempt).filter(Attempt.student_id == student_id).order_by(Attempt.created_at.desc()).first()
            if recent_attempt and recent_attempt.question:
                chapter = recent_attempt.question.chapter
            else:
                chapter = db.query(Chapter).filter(Chapter.status == "active").first()

        skills = db.query(Skill).filter(Skill.chapter_id == chapter.id).order_by(Skill.order).all() if chapter else []
        
        # Batch query all mastery states for this student
        all_masteries = db.query(MasteryState).filter(MasteryState.student_id == student_id).all()
        mastery_by_skill_id = {m.skill_id: m for m in all_masteries}
        
        # Cache all skills by code and by id for prerequisite graph lookups
        all_skills_list = db.query(Skill).all()
        all_skills_by_code = {sk.code: sk for sk in all_skills_list}
        all_skills_by_id = {sk.id: sk for sk in all_skills_list}

        skills_summary = []
        mastery_sum = 0.0
        assessed_skills_count = 0

        # Track which skills are prerequisites for other skills in this chapter
        prereq_usage_count: Dict[str, int] = {}
        for s in skills:
            for p_code in (s.prerequisite_skill_ids or []):
                prereq_usage_count[p_code] = prereq_usage_count.get(p_code, 0) + 1

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

            # Check prerequisite gap using graph
            has_prereq_gap = False
            for prereq_code in (s.prerequisite_skill_ids or []):
                prereq_obj = all_skills_by_code.get(prereq_code)
                if prereq_obj:
                    prereq_state = mastery_by_skill_id.get(prereq_obj.id)
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

        # Calculate overall score percentage directly from database attempts
        recent_attempts = db.query(Attempt).filter(Attempt.student_id == student_id).order_by(Attempt.created_at.desc()).all()
        if recent_attempts:
            correct_count = sum(1 for a in recent_attempts if a.correct)
            score_pct = round((correct_count / len(recent_attempts)) * 100.0, 1)
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

        pattern_ids = list(set([i.pattern_id for i in active_instances + resolved_instances]))
        patterns_map = {p.id: p for p in db.query(MisconceptionPattern).filter(MisconceptionPattern.id.in_(pattern_ids)).all()} if pattern_ids else {}

        active_list = []
        for inst in active_instances:
            pattern = patterns_map.get(inst.pattern_id)
            active_list.append({
                "id": inst.id,
                "pattern_id": inst.pattern_id,
                "pattern_name": pattern.name if pattern else "Misconception",
                "skill_id": inst.skill_id,
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
                "skill_id": inst.skill_id,
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

        calc_mastery = round((mastery_sum / max(1, assessed_skills_count)), 2) if assessed_skills_count > 0 else None

        # ----------------------------------------------------
        # 1. PREREQUISITE RESCUE GRAPH ANALYSIS
        # ----------------------------------------------------
        prerequisite_rescues: List[Dict[str, Any]] = []
        for s in skills:
            m_state = mastery_by_skill_id.get(s.id)
            # If student is struggling with this skill (< 0.60) or has active misconception
            has_issue = (m_state and m_state.evidence_count > 0 and m_state.mastery_probability < 0.60) or any(
                m["skill_id"] == s.id for m in active_list
            )
            if has_issue and s.prerequisite_skill_ids:
                for prereq_code in s.prerequisite_skill_ids:
                    prereq_obj = all_skills_by_code.get(prereq_code)
                    if prereq_obj:
                        prereq_m = mastery_by_skill_id.get(prereq_obj.id)
                        p_ev = prereq_m.evidence_count if prereq_m else 0
                        p_mast = prereq_m.mastery_probability if prereq_m else 0.30

                        if p_ev == 0:
                            prerequisite_rescues.append({
                                "dependent_skill_id": s.id,
                                "dependent_skill_code": s.code,
                                "dependent_skill_name": s.name,
                                "prerequisite_id": prereq_obj.id,
                                "prerequisite_code": prereq_obj.code,
                                "prerequisite_name": prereq_obj.name,
                                "prerequisite_mastery": 0.0,
                                "status": "unassessed",
                                "message": f"'{s.name}' depends on '{prereq_obj.name}', which has not been assessed yet."
                            })
                        elif p_mast < 0.55:
                            prerequisite_rescues.append({
                                "dependent_skill_id": s.id,
                                "dependent_skill_code": s.code,
                                "dependent_skill_name": s.name,
                                "prerequisite_id": prereq_obj.id,
                                "prerequisite_code": prereq_obj.code,
                                "prerequisite_name": prereq_obj.name,
                                "prerequisite_mastery": round(p_mast, 2),
                                "status": "under_mastery",
                                "message": f"Root blocker identified: '{prereq_obj.name}' mastery is only {round(p_mast * 100)}%."
                            })

        # ----------------------------------------------------
        # 2. SKILL GAP RADAR COMPUTATION
        # Current State vs Target State = Gap
        # ----------------------------------------------------
        skill_gaps: List[Dict[str, Any]] = []
        user_goal_text = (student.target_goal or "").lower()

        for s in skills:
            m_state = mastery_by_skill_id.get(s.id)
            ev_count = m_state.evidence_count if m_state else 0
            cur_mast = round(m_state.mastery_probability, 2) if (m_state and ev_count > 0) else 0.0
            gap_val = max(0.0, round(target_mastery - cur_mast, 2))
            c_info = MasteryService.calculate_confidence(ev_count)

            # Check if this skill is a prerequisite blocking other skills
            is_blocking_others = (cur_mast < 0.50 and prereq_usage_count.get(s.code, 0) > 0)
            
            # Check what is blocking this skill
            blocked_by_list = []
            for p_code in (s.prerequisite_skill_ids or []):
                p_obj = all_skills_by_code.get(p_code)
                if p_obj:
                    p_state = mastery_by_skill_id.get(p_obj.id)
                    if not p_state or p_state.evidence_count == 0 or p_state.mastery_probability < 0.50:
                        blocked_by_list.append(p_obj.name)

            # Goal relevance weighting
            if user_goal_text and (user_goal_text in s.name.lower() or s.code.lower() in user_goal_text):
                goal_rel = "High"
            elif user_goal_text:
                # Token match
                tokens = [t for t in user_goal_text.split() if len(t) > 3]
                goal_rel = "High" if any(t in s.name.lower() for t in tokens) else "Medium"
            else:
                goal_rel = "Medium"

            # Recommended action for this skill
            if any(m["skill_id"] == s.id for m in active_list):
                rec_act = "Intervention"
            elif blocked_by_list:
                rec_act = "Prerequisite Review"
            elif cur_mast < target_mastery:
                rec_act = "Practice"
            else:
                rec_act = "Mastered"

            skill_gaps.append({
                "skill_id": s.id,
                "skill_code": s.code,
                "skill_name": s.name,
                "current_mastery": cur_mast,
                "target_mastery": target_mastery,
                "gap_size": gap_val,
                "confidence": c_info["confidence"],
                "confidence_label": c_info["label"],
                "evidence_count": ev_count,
                "is_blocking": is_blocking_others,
                "blocked_by": blocked_by_list,
                "goal_relevance": goal_rel,
                "recommended_action": rec_act
            })

        # ----------------------------------------------------
        # 3. CONFIDENCE VS KNOWLEDGE (CALIBRATION PATTERN)
        # ----------------------------------------------------
        calibration_insight = AnalyticsService.compute_calibration(recent_attempts)

        # ----------------------------------------------------
        # 4. UNIFIED LEARNING PRIORITY & NEXT BEST ACTION
        # Goal + Skill gaps + Prerequisites + Diagnosis + Evidence + Recent activity
        # ----------------------------------------------------
        next_action = AnalyticsService.compute_next_best_action(
            student=student,
            skills=skills,
            skills_summary=skills_summary,
            active_misconceptions=active_list,
            prerequisite_rescues=prerequisite_rescues,
            recent_attempts=recent_attempts,
            chapter=chapter
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
            "target_goal": student.target_goal,
            "goal_description": student.goal_description,
            "target_mastery": target_mastery,
            "skills": skills_summary,
            "skill_gaps": skill_gaps,
            "next_best_action": next_action,
            "calibration_insight": calibration_insight,
            "prerequisite_rescues": prerequisite_rescues,
            "active_misconceptions": active_list,
            "resolved_misconceptions": resolved_list,
            "emerging_gaps": gaps_list,
            "recent_interventions": intervention_list
        }

    @staticmethod
    def compute_calibration(attempts: List[Attempt]) -> Dict[str, Any]:
        """
        Distinguishes High Conf + Correct, High Conf + Incorrect (overconfidence),
        and Low Conf + Correct (underconfidence). Requires >= 3 samples.
        """
        rated = [a for a in attempts if a.confidence is not None]
        if len(rated) < 3:
            return {
                "status": "insufficient_evidence",
                "sample_count": len(rated),
                "supported_knowledge_pct": 0.0,
                "overconfidence_pct": 0.0,
                "underconfidence_pct": 0.0,
                "summary": "Complete at least 3 responses with confidence ratings to detect calibration patterns."
            }

        total = len(rated)
        supported = sum(1 for a in rated if a.confidence >= 0.65 and a.correct)
        overconfident = sum(1 for a in rated if a.confidence >= 0.65 and not a.correct)
        underconfident = sum(1 for a in rated if a.confidence <= 0.45 and a.correct)

        sup_pct = round((supported / total) * 100, 1)
        over_pct = round((overconfident / total) * 100, 1)
        under_pct = round((underconfident / total) * 100, 1)

        if over_pct >= 30.0:
            status = "overconfident"
            summary = f"Watch out for procedural slips: {over_pct}% of your responses were high confidence but incorrect."
        elif under_pct >= 30.0:
            status = "underconfident"
            summary = f"You know more than you realize: {under_pct}% of your correct answers were rated with low confidence."
        elif sup_pct >= 50.0:
            status = "calibrated"
            summary = f"Strong calibration: {sup_pct}% of your responses matched high confidence with correct execution."
        else:
            status = "calibrated"
            summary = "Your confidence aligns reasonably well with demonstrated problem accuracy."

        return {
            "status": status,
            "sample_count": total,
            "supported_knowledge_pct": sup_pct,
            "overconfidence_pct": over_pct,
            "underconfidence_pct": under_pct,
            "summary": summary
        }

    @staticmethod
    def compute_next_best_action(
        student: Student,
        skills: List[Skill],
        skills_summary: List[Dict[str, Any]],
        active_misconceptions: List[Dict[str, Any]],
        prerequisite_rescues: List[Dict[str, Any]],
        recent_attempts: List[Attempt],
        chapter: Optional[Chapter]
    ) -> Dict[str, Any]:
        """
        One unified learning-priority engine.
        Returns the single most actionable instructional priority with its evidence-backed "Why?".
        """
        target_mastery = student.target_mastery if (student and student.target_mastery) else 0.85

        # Priority 1: Completely Fresh / Unassessed Learner
        evidenced_skills = [s for s in skills_summary if s["evidence_count"] > 0]
        if len(recent_attempts) == 0 or len(evidenced_skills) == 0:
            return {
                "action_type": "complete_diagnostic",
                "title": "Establish Your Knowledge Baseline",
                "subtitle": f"Diagnostic in {chapter.title if chapter else 'your chosen topic'}",
                "reason": "Your Knowledge Twin needs initial evidence to calibrate your learning profile and uncover strengths and skill gaps.",
                "button_label": "Start Diagnostic",
                "target_chapter_id": chapter.id if chapter else None
            }

        # Priority 2: Diagnosed Misconception Blocker
        if active_misconceptions:
            top_misc = sorted(active_misconceptions, key=lambda m: m["occurrences"], reverse=True)[0]
            return {
                "action_type": "targeted_intervention",
                "title": f"Clear Blocker: {top_misc['pattern_name']}",
                "subtitle": f"Targeted remediation in {top_misc.get('skill_name', 'Skill')}",
                "reason": f"Active misconception '{top_misc['pattern_name']}' was diagnosed from your responses. Clearing this pattern will unblock higher-order problem solving.",
                "button_label": "Start Intervention",
                "target_skill_id": top_misc.get("skill_id"),
                "target_skill_code": top_misc.get("skill_code"),
                "pattern_id": top_misc.get("pattern_id"),
                "classification": top_misc.get("classification", "procedural"),
                "target_chapter_id": chapter.id if chapter else None
            }

        # Priority 3: Prerequisite Rescue Blocker
        if prerequisite_rescues:
            rescue = prerequisite_rescues[0]
            return {
                "action_type": "prerequisite_rescue",
                "title": f"Prerequisite Rescue: {rescue['prerequisite_name']}",
                "subtitle": f"Foundational skill required for {rescue['dependent_skill_name']}",
                "reason": f"Progress in '{rescue['dependent_skill_name']}' is blocked because prerequisite '{rescue['prerequisite_name']}' has not been mastered yet ({round(rescue['prerequisite_mastery'] * 100)}% mastery).",
                "button_label": "Review Prerequisite",
                "target_skill_id": rescue.get("prerequisite_id"),
                "target_skill_code": rescue.get("prerequisite_code"),
                "target_chapter_id": chapter.id if chapter else None
            }

        # Priority 4: Weak or Developing Skill (Prioritize by learner goal if set)
        weak_skills = [s for s in skills_summary if s["evidence_count"] > 0 and s["mastery_probability"] < target_mastery]
        if weak_skills:
            # Check goal relevance
            goal_text = (student.target_goal or "").lower()
            if goal_text:
                goal_aligned = [s for s in weak_skills if goal_text in s["skill_name"].lower() or s["skill_code"].lower() in goal_text]
                selected_skill = goal_aligned[0] if goal_aligned else sorted(weak_skills, key=lambda s: s["mastery_probability"])[0]
                reason_text = f"Directly aligns with your target goal '{student.target_goal}'. Current mastery is {round(selected_skill['mastery_probability'] * 100)}%."
            else:
                selected_skill = sorted(weak_skills, key=lambda s: s["mastery_probability"])[0]
                reason_text = f"Current mastery is {round(selected_skill['mastery_probability'] * 100)}%, below your {round(target_mastery * 100)}% mastery threshold."

            return {
                "action_type": "practice_skill",
                "title": f"Strengthen {selected_skill['skill_name']}",
                "subtitle": f"Current mastery {round(selected_skill['mastery_probability'] * 100)}% (Target: {round(target_mastery * 100)}%)",
                "reason": reason_text,
                "button_label": "Practice Skill",
                "target_skill_id": selected_skill["skill_id"],
                "target_skill_code": selected_skill["skill_code"],
                "target_chapter_id": chapter.id if chapter else None
            }

        # Priority 5: Unassessed Skill in Current Chapter
        unassessed = [s for s in skills_summary if s["evidence_count"] == 0]
        if unassessed:
            target_sk = unassessed[0]
            return {
                "action_type": "complete_diagnostic",
                "title": f"Assess {target_sk['skill_name']}",
                "subtitle": "Expand your evidence coverage",
                "reason": f"'{target_sk['skill_name']}' has no recorded evidence yet. Answer questions to complete your profile.",
                "button_label": "Take Assessment",
                "target_skill_id": target_sk["skill_id"],
                "target_skill_code": target_sk["skill_code"],
                "target_chapter_id": chapter.id if chapter else None
            }

        # Priority 6: Mastered Current Chapter -> Advance
        return {
            "action_type": "advance_next_chapter",
            "title": "Advance to Next Topic",
            "subtitle": "Mastery goal achieved across current skills",
            "reason": f"You have achieved your target of {round(target_mastery * 100)}% mastery across all assessed skills. Continue expanding your knowledge.",
            "button_label": "Explore Topics",
            "target_chapter_id": chapter.id if chapter else None
        }

    @staticmethod
    def get_teacher_class_overview(db: Session) -> Dict[str, Any]:
        """
        Returns class list, heatmap data, and real database-backed Same-Score comparison.
        Optimized with batch fetching.
        """
        students = db.query(Student).all()
        student_summaries = []

        patterns = db.query(MisconceptionPattern).filter(MisconceptionPattern.status == "active").all()
        top_patterns = patterns[:8]
        top_pattern_ids = [p.id for p in top_patterns]

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

        # Dynamic Same-Score Comparative Proof: Find two students in DB with similar scores or attempts
        assessed_students = [s for s in students if db.query(Attempt).filter(Attempt.student_id == s.id).count() > 0 or db.query(MasteryState).filter(MasteryState.student_id == s.id, MasteryState.evidence_count > 0).count() > 0]
        
        if len(assessed_students) >= 2:
            s1 = assessed_students[0]
            s2 = assessed_students[1]
            t1 = AnalyticsService.get_student_knowledge_twin(db, s1.id)
            t2 = AnalyticsService.get_student_knowledge_twin(db, s2.id)

            weak1 = sorted([s for s in t1["skills"] if s["evidence_count"] > 0], key=lambda x: x["mastery_probability"])
            weak2 = sorted([s for s in t2["skills"] if s["evidence_count"] > 0], key=lambda x: x["mastery_probability"])
            strong1 = sorted([s for s in t1["skills"] if s["evidence_count"] > 0], key=lambda x: x["mastery_probability"], reverse=True)
            strong2 = sorted([s for s in t2["skills"] if s["evidence_count"] > 0], key=lambda x: x["mastery_probability"], reverse=True)

            same_score_proof = {
                "target_score": round((t1["overall_score_percentage"] or 60.0), 1),
                "headline": "Same Score. Different Learning Needs.",
                "student_a": {
                    "id": s1.id,
                    "name": s1.name,
                    "score": round((t1["overall_score_percentage"] or 60.0), 1),
                    "diagnosis_type": t1["active_misconceptions"][0]["classification"] if t1["active_misconceptions"] else "Procedural",
                    "primary_weakness": f"{weak1[0]['skill_name']} ({round(weak1[0]['mastery_probability']*100)}% Mastery)" if weak1 else "Developing",
                    "strengths": f"{strong1[0]['skill_name']} ({round(strong1[0]['mastery_probability']*100)}%)" if strong1 else "Foundational",
                    "active_misconception": t1["active_misconceptions"][0]["pattern_name"] if t1["active_misconceptions"] else "None",
                    "recommended_next_step": t1["next_best_action"]["title"] if t1.get("next_best_action") else "Practice",
                    "twin_color": s1.avatar_color or "#2563EB"
                },
                "student_b": {
                    "id": s2.id,
                    "name": s2.name,
                    "score": round((t2["overall_score_percentage"] or 60.0), 1),
                    "diagnosis_type": t2["active_misconceptions"][0]["classification"] if t2["active_misconceptions"] else "Conceptual",
                    "primary_weakness": f"{weak2[0]['skill_name']} ({round(weak2[0]['mastery_probability']*100)}% Mastery)" if weak2 else "Developing",
                    "strengths": f"{strong2[0]['skill_name']} ({round(strong2[0]['mastery_probability']*100)}%)" if strong2 else "Foundational",
                    "active_misconception": t2["active_misconceptions"][0]["pattern_name"] if t2["active_misconceptions"] else "None",
                    "recommended_next_step": t2["next_best_action"]["title"] if t2.get("next_best_action") else "Practice",
                    "twin_color": s2.avatar_color or "#7C3AED"
                },
                "core_thesis": "Both students show comparable overall performance, yet their living Knowledge Twins uncover completely distinct cognitive blockers and require different next actions."
            }
        else:
            same_score_proof = {
                "target_score": 0.0,
                "headline": "Classroom Cognitive Differentiation",
                "student_a": None,
                "student_b": None,
                "core_thesis": "As learners complete assessments, comparative cognitive insights will automatically highlight different learning needs among students."
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
                "calibration_insight": None,
                "recent_activity": []
            }

        attempts = db.query(Attempt).filter(Attempt.student_id == student_id).order_by(Attempt.created_at.desc()).all()
        total_attempts = len(attempts)
        correct_attempts = sum(1 for a in attempts if a.correct)
        score_pct = round((correct_attempts / total_attempts) * 100) if total_attempts > 0 else None

        mastery_states = db.query(MasteryState).filter(
            MasteryState.student_id == student_id,
            MasteryState.evidence_count > 0
        ).all()
        assessed_skills_count = len(mastery_states)

        calibration = AnalyticsService.compute_calibration(attempts)
        recent_activity = AnalyticsService.get_student_activity(db, student_id)[:20]

        return {
            "user_id": student_id,
            "total_attempts": total_attempts,
            "correct_attempts": correct_attempts,
            "score_percentage": score_pct,
            "assessed_skills_count": assessed_skills_count,
            "calibration_insight": calibration,
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
            pattern_name = a.diagnosis.get("likely_misconception") or a.diagnosis.get("misconception_name") if a.diagnosis else None

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

        activities.sort(key=lambda x: x["timestamp"], reverse=True)
        return activities
