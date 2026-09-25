import datetime
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from app.models.all_models import MasteryState, Skill, StudentMisconceptionInstance, EmergingGap

class BayesianKnowledgeTracing:
    """
    Standard Bayesian Knowledge Tracing (BKT) engine.
    Maintains probability of latent skill mastery across sequential evidence.
    """
    P_INIT = 0.30   # Initial prior
    P_TRANSIT = 0.20 # Learning rate per attempt
    P_GUESS = 0.15   # Probability of guessing correctly without mastery
    P_SLIP = 0.10    # Probability of slipping (incorrect despite mastery)

    @classmethod
    def update_mastery(cls, current_p: float, is_correct: bool) -> float:
        p = max(0.01, min(0.99, current_p))
        if is_correct:
            # P(L | correct) = (P(L) * (1 - P_S)) / (P(L) * (1 - P_S) + (1 - P(L)) * P_G)
            numerator = p * (1.0 - cls.P_SLIP)
            denominator = numerator + (1.0 - p) * cls.P_GUESS
            p_posterior = numerator / max(1e-6, denominator)
        else:
            # P(L | incorrect) = (P(L) * P_S) / (P(L) * P_S + (1 - P(L)) * (1 - P_G))
            numerator = p * cls.P_SLIP
            denominator = numerator + (1.0 - p) * (1.0 - cls.P_GUESS)
            p_posterior = numerator / max(1e-6, denominator)
            
        # Transit step: student can learn from the attempt
        p_new = p_posterior + (1.0 - p_posterior) * cls.P_TRANSIT
        return round(float(max(0.05, min(0.99, p_new))), 4)


class MasteryService:
    @staticmethod
    def calculate_confidence(evidence_count: int) -> Dict[str, Any]:
        """
        Calculates evidence-based confidence separate from mastery percentage.
        """
        if evidence_count == 0:
            return {"confidence": 0.0, "label": "Not yet assessed"}
        conf = min(1.0, evidence_count / 4.0)
        if evidence_count == 1:
            label = "Low"
        elif evidence_count in (2, 3):
            label = "Moderate"
        else:
            label = "High"
        return {"confidence": round(conf, 2), "label": label}

    @staticmethod
    def record_attempt(
        db: Session,
        student_id: str,
        skill_id: str,
        is_correct: bool,
        event_name: str = "assessment"
    ) -> MasteryState:
        """
        Updates student mastery using BKT and checks for emerging gaps.
        """
        state = db.query(MasteryState).filter(
            MasteryState.student_id == student_id,
            MasteryState.skill_id == skill_id
        ).first()

        now = datetime.datetime.utcnow()
        if not state:
            init_p = BayesianKnowledgeTracing.P_INIT
            new_p = BayesianKnowledgeTracing.update_mastery(init_p, is_correct)
            conf_info = MasteryService.calculate_confidence(1)
            state = MasteryState(
                id=f"{student_id}_{skill_id}",
                student_id=student_id,
                skill_id=skill_id,
                mastery_probability=new_p,
                confidence=conf_info["confidence"],
                evidence_count=1,
                history=[{
                    "timestamp": now.isoformat(),
                    "p_mastery": new_p,
                    "event": event_name,
                    "is_correct": is_correct
                }],
                last_updated=now
            )
            db.add(state)
        else:
            old_p = state.mastery_probability
            new_p = BayesianKnowledgeTracing.update_mastery(old_p, is_correct)
            new_evidence_count = (state.evidence_count or 0) + 1
            conf_info = MasteryService.calculate_confidence(new_evidence_count)
            
            history = list(state.history or [])
            history.append({
                "timestamp": now.isoformat(),
                "p_mastery": new_p,
                "event": event_name,
                "is_correct": is_correct
            })
            
            state.mastery_probability = new_p
            state.confidence = conf_info["confidence"]
            state.evidence_count = new_evidence_count
            state.history = history
            state.last_updated = now

        db.commit()
        db.refresh(state)

        # Check for Emerging Gaps
        MasteryService.check_and_update_emerging_gaps(db, student_id, skill_id)
        
        return state

    @staticmethod
    def check_and_update_emerging_gaps(db: Session, student_id: str, skill_id: str):
        """
        Proactively detects emerging gaps:
        Prerequisite weakness + Repeated misconception = Emerging Gap warning.
        """
        target_skill = db.query(Skill).filter(Skill.id == skill_id).first()
        if not target_skill or not target_skill.prerequisite_skill_ids:
            return

        # Check prerequisite skill masteries
        prereq_weakness = False
        weak_prereq_name = ""
        for prereq_code in target_skill.prerequisite_skill_ids:
            prereq_skill = db.query(Skill).filter(Skill.code == prereq_code).first()
            if prereq_skill:
                prereq_state = db.query(MasteryState).filter(
                    MasteryState.student_id == student_id,
                    MasteryState.skill_id == prereq_skill.id
                ).first()
                if not prereq_state or prereq_state.mastery_probability < 0.50:
                    prereq_weakness = True
                    weak_prereq_name = prereq_skill.name
                    break

        # Check if student has active misconceptions in target skill
        active_misconceptions = db.query(StudentMisconceptionInstance).filter(
            StudentMisconceptionInstance.student_id == student_id,
            StudentMisconceptionInstance.skill_id == skill_id,
            StudentMisconceptionInstance.status == "active"
        ).all()

        gap_record = db.query(EmergingGap).filter(
            EmergingGap.student_id == student_id,
            EmergingGap.skill_id == skill_id,
            EmergingGap.status == "active"
        ).first()

        if prereq_weakness and len(active_misconceptions) >= 1:
            if not gap_record:
                gap = EmergingGap(
                    id=f"gap_{student_id}_{skill_id}",
                    student_id=student_id,
                    skill_id=skill_id,
                    title=f"Prerequisite Fragility in {target_skill.name}",
                    description=f"Weak mastery in foundational skill '{weak_prereq_name}' is actively impairing progress in {target_skill.name}.",
                    risk_level="high" if len(active_misconceptions) > 1 else "moderate",
                    trigger_reason=f"Prerequisite {weak_prereq_name} < 50% combined with recurring misconception.",
                    detected_at=datetime.datetime.utcnow(),
                    status="active"
                )
                db.add(gap)
                db.commit()
        elif gap_record and not prereq_weakness:
            # Resolved
            gap_record.status = "mitigated"
            db.commit()
