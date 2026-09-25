import uuid
import datetime
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session

from app.models.all_models import (
    Intervention,
    InterventionHistory,
    StudentMisconceptionInstance,
    MasteryState,
    Question,
    Skill,
)
from app.services.mastery_service import MasteryService

class InterventionService:
    @staticmethod
    def get_or_create_intervention(
        db: Session,
        skill_id: str,
        pattern_id: Optional[str],
        classification: str,
        student_id: str
    ) -> Intervention:
        """
        Dynamically routes and retrieves targeted intervention based on the diagnosis taxonomy.
        """
        skill = db.query(Skill).filter(Skill.id == skill_id).first()
        skill_name = skill.name if skill else "Algebra"
        
        # Route intervention type based on classification
        if classification == "prerequisite_gap":
            itype = "prerequisite_remediation"
            title = f"Foundational Reinforcement: {skill_name}"
        elif classification == "careless":
            itype = "guided_practice"
            title = f"Precision Check & Practice: {skill_name}"
        elif classification == "conceptual":
            itype = "conceptual_review"
            title = f"Core Concept Deep Dive: {skill_name}"
        else: # procedural
            itype = "worked_example"
            title = f"Step-by-Step Worked Example: {skill_name}"

        # Look for existing intervention
        intervention = db.query(Intervention).filter(
            Intervention.skill_id == skill_id,
            Intervention.intervention_type == itype
        ).first()

        if not intervention:
            # Build high-fidelity structured intervention content
            content = InterventionService._build_intervention_content(skill_name, itype, pattern_id)
            intervention = Intervention(
                id=f"int_{uuid.uuid4().hex[:8]}",
                skill_id=skill_id,
                pattern_id=pattern_id,
                intervention_type=itype,
                title=title,
                content=content,
                target_misconception=pattern_id or "General Skill Gap",
                practice_question_ids=[]
            )
            db.add(intervention)
            db.commit()
            db.refresh(intervention)

        return intervention

    @staticmethod
    def _build_intervention_content(skill_name: str, itype: str, pattern_id: Optional[str]) -> Dict[str, Any]:
        if "distrib" in skill_name.lower():
            return {
                "headline": "Mastering the Distributive Law: a(b + c) = ab + ac",
                "core_rule": "The multiplier outside the parentheses must multiply EVERY term inside, not just the first one.",
                "worked_steps": [
                    {"step": 1, "math": "4(x + 5) = 32", "explanation": "Identify the multiplier outside: 4. The inside has two terms: x and +5."},
                    {"step": 2, "math": "4·x + 4·5 = 32", "explanation": "Distribute 4 to BOTH terms symmetrically.", "highlight": "Multiply both terms"},
                    {"step": 3, "math": "4x + 20 = 32", "explanation": "Simplify intermediate products: 4*x = 4x, 4*5 = 20."},
                    {"step": 4, "math": "4x = 12", "explanation": "Subtract 20 from BOTH sides to isolate the variable term."},
                    {"step": 5, "math": "x = 3", "explanation": "Divide both sides by 4."}
                ],
                "common_pitfall": "Writing 4(x + 5) as 4x + 5 drops the multiplication on the constant 5.",
                "interactive_tip": "Think of parentheses like a package: the delivery fee applies to every item inside."
            }
        elif "like" in skill_name.lower() or "term" in skill_name.lower():
            return {
                "headline": "Combining Like Terms: Apples vs Oranges",
                "core_rule": "Only terms sharing the exact same variable parts can be combined by adding their coefficients.",
                "worked_steps": [
                    {"step": 1, "math": "5x + 3 + 2x = 17", "explanation": "Group terms with 'x' together and constant numbers together."},
                    {"step": 2, "math": "(5x + 2x) + 3 = 17", "explanation": "Commutative property: rearrange like terms.", "highlight": "Group like terms"},
                    {"step": 3, "math": "7x + 3 = 17", "explanation": "Add coefficients: 5 + 2 = 7. Constant 3 remains separate."},
                    {"step": 4, "math": "7x = 14", "explanation": "Subtract 3 from both sides."},
                    {"step": 5, "math": "x = 2", "explanation": "Divide both sides by 7."}
                ],
                "common_pitfall": "Combining 5x + 3 into 8x. A variable term and a constant cannot merge into a single term.",
                "interactive_tip": "5 boxes of pencils plus 3 loose pens does not make 8 boxes of pencils."
            }
        else:
            return {
                "headline": f"Structured Mastery: {skill_name}",
                "core_rule": "Apply reciprocal operations with strict bilateral equality balance.",
                "worked_steps": [
                    {"step": 1, "math": "2x - 4 = 10", "explanation": "Identify the operation binding the constant: -4."},
                    {"step": 2, "math": "2x - 4 + 4 = 10 + 4", "explanation": "Add 4 to BOTH sides to maintain equality.", "highlight": "Balance both sides"},
                    {"step": 3, "math": "2x = 14", "explanation": "Simplify both sides."},
                    {"step": 4, "math": "x = 7", "explanation": "Divide both sides by 2."}
                ],
                "common_pitfall": "Applying an operation to only one side of the equation.",
                "interactive_tip": "Keep the balance scale level at every single transformation."
            }

    @staticmethod
    def process_retest_attempt(
        db: Session,
        student_id: str,
        intervention_id: str,
        question_id: str,
        student_answer: str,
        work_shown: List[str]
    ) -> Dict[str, Any]:
        """
        Evaluates retest response, calculates before/after mastery delta,
        resolves student misconception instance, and records history.
        """
        question = db.query(Question).filter(Question.id == question_id).first()
        if not question:
            raise ValueError("Question not found")

        # Evaluate correctness
        norm_ans = student_answer.strip().lower().replace(" ", "")
        norm_corr = question.correct_answer.strip().lower().replace(" ", "")
        is_correct = (norm_ans == norm_corr)

        # Get existing mastery
        state = db.query(MasteryState).filter(
            MasteryState.student_id == student_id,
            MasteryState.skill_id == question.skill_id
        ).first()

        before_mastery = state.mastery_probability if state else 0.30

        # Update mastery via BKT
        updated_state = MasteryService.record_attempt(
            db, student_id, question.skill_id, is_correct, event_name="retest"
        )
        after_mastery = updated_state.mastery_probability
        delta_pct = round((after_mastery - before_mastery) * 100.0, 1)

        # Resolve misconception instance if correct
        misconception_resolved = False
        if is_correct:
            active_instance = db.query(StudentMisconceptionInstance).filter(
                StudentMisconceptionInstance.student_id == student_id,
                StudentMisconceptionInstance.skill_id == question.skill_id,
                StudentMisconceptionInstance.status == "active"
            ).first()
            if active_instance:
                active_instance.status = "resolved"
                res_hist = list(active_instance.resolution_history or [])
                res_hist.append({
                    "timestamp": datetime.datetime.utcnow().isoformat(),
                    "intervention_id": intervention_id,
                    "before_mastery": before_mastery,
                    "after_mastery": after_mastery,
                    "delta": delta_pct
                })
                active_instance.resolution_history = res_hist
                misconception_resolved = True
                db.commit()

        # Log intervention history
        history_entry = InterventionHistory(
            id=f"ih_{uuid.uuid4().hex[:8]}",
            student_id=student_id,
            intervention_id=intervention_id,
            skill_id=question.skill_id,
            started_at=datetime.datetime.utcnow() - datetime.timedelta(minutes=5),
            completed_at=datetime.datetime.utcnow(),
            status="completed",
            before_mastery=before_mastery,
            after_mastery=after_mastery,
            retest_result={
                "question_id": question_id,
                "is_correct": is_correct,
                "delta_percentage": delta_pct,
                "misconception_resolved": misconception_resolved
            }
        )
        db.add(history_entry)
        db.commit()

        skill = db.query(Skill).filter(Skill.id == question.skill_id).first()
        skill_name = skill.name if skill else "Skill"

        return {
            "correct": is_correct,
            "before_mastery": round(before_mastery, 2),
            "after_mastery": round(after_mastery, 2),
            "delta_percentage": delta_pct,
            "misconception_resolved": misconception_resolved,
            "skill_name": skill_name,
            "message": f"Skill mastery estimate for {skill_name} improved by +{delta_pct}% after targeted intervention!" if is_correct else "Retest attempt recorded. Additional guided practice recommended."
        }
