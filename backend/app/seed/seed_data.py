import datetime
from sqlalchemy.orm import Session
from app.database import Base, engine, SessionLocal
from app.models.all_models import (
    Student,
    TeacherDemo,
    Chapter,
    Skill,
    Question,
    MisconceptionPattern,
    StudentMisconceptionInstance,
    MasteryState,
    EmergingGap,
    Intervention,
    InterventionHistory,
    Attempt,
    UploadedDocument,
    ContentExtraction,
)

from app.config import settings

def init_db():
    Base.metadata.create_all(bind=engine)

def seed_curriculum(db: Session):
    """Seed legitimate curriculum/content records (Mathematics, Physics, Chemistry).
    No fake students, no demo accounts, no fake learner progress.
    """
    now = datetime.datetime.utcnow()

    # 1. Curated Chapter - Linear Equations
    chapter_math = db.query(Chapter).filter(Chapter.id == "chap_linear_eq").first()
    if not chapter_math:
        chapter_math = Chapter(
            id="chap_linear_eq",
            title="Linear Equations in One Variable",
            subject="Mathematics",
            description="Foundations of algebraic equality, expression manipulation, distribution, and systematic variable isolation.",
            source_type="curated",
            status="active"
        )
        db.add(chapter_math)
        db.flush()

        # 4. Exactly Six Skills
        skills_data = [
            {
                "id": "sk_eq_01",
                "code": "EQ-01",
                "name": "Understanding Equality",
                "desc": "Equality as relational balance across sides, not merely an operational prompt.",
                "prereqs": [],
                "order": 1,
                "diff": "easy"
            },
            {
                "id": "sk_simp_02",
                "code": "SIMP-02",
                "name": "Simplifying Expressions",
                "desc": "Evaluating constant terms and simplifying expressions without dropping terms.",
                "prereqs": ["EQ-01"],
                "order": 2,
                "diff": "easy"
            },
            {
                "id": "sk_like_03",
                "code": "LIKE-03",
                "name": "Combining Like Terms",
                "desc": "Combining terms with identical variable bases while keeping constants separate.",
                "prereqs": ["EQ-01", "SIMP-02"],
                "order": 3,
                "diff": "medium"
            },
            {
                "id": "sk_dist_04",
                "code": "DIST-04",
                "name": "Distributive Property",
                "desc": "Applying multipliers across parenthesized polynomials: a(b + c) = ab + ac.",
                "prereqs": ["SIMP-02"],
                "order": 4,
                "diff": "medium"
            },
            {
                "id": "sk_isol_05",
                "code": "ISOL-05",
                "name": "Isolating the Variable",
                "desc": "Applying bilateral inverse operations to isolate unknown variables.",
                "prereqs": ["EQ-01", "LIKE-03"],
                "order": 5,
                "diff": "medium"
            },
            {
                "id": "sk_multi_06",
                "code": "MULTI-06",
                "name": "Multi-Step Equations",
                "desc": "Synthesizing distribution, like terms, and balance operations in complex equations.",
                "prereqs": ["DIST-04", "ISOL-05"],
                "order": 6,
                "diff": "hard"
            }
        ]

        for sk in skills_data:
            skill = Skill(
                id=sk["id"],
                chapter_id=chapter_math.id,
                code=sk["code"],
                name=sk["name"],
                description=sk["desc"],
                prerequisite_skill_ids=sk["prereqs"],
                difficulty=sk["diff"],
                order=sk["order"]
            )
            db.add(skill)
        db.flush()

        # 5. Seed Exactly 18 Misconception Patterns (Deterministic & Configurable)
        patterns_data = [
            # Skill 1: Understanding Equality
            {
                "id": "PAT_EQ_OP_TRIGGER",
                "skill_id": "sk_eq_01",
                "name": "Operational Trigger View of '='",
                "desc": "Treating '=' as an instruction to compute preceding numbers rather than a relational balance statement.",
                "rule_type": "EXACT_WRONG_ANSWER",
                "rule_config": {"wrong_answer": "9"},
                "classification": "conceptual",
                "itype": "conceptual_review",
                "principle": "The equals sign '=' means both sides balance to the exact same numerical quantity.",
                "ex_w": "4 + 5 = _ + 2 → Student answers 9",
                "ex_c": "4 + 5 = 7 + 2 → Correct balance is 7"
            },
            {
                "id": "PAT_EQ_UNBALANCED_ADD",
                "skill_id": "sk_eq_01",
                "name": "Unilateral Addition Error",
                "desc": "Adding or subtracting a constant to only one side of an equation.",
                "rule_type": "SIDE_BALANCE_CHECK",
                "rule_config": {"require_both_sides": True},
                "classification": "procedural",
                "itype": "worked_example",
                "principle": "Whatever operation is performed on one side must be performed symmetrically on the opposite side.",
                "ex_w": "x - 5 = 12 → x = 12",
                "ex_c": "x - 5 + 5 = 12 + 5 → x = 17"
            },
            {
                "id": "PAT_EQ_COMM_SWAP",
                "skill_id": "sk_eq_01",
                "name": "Subtractive Order Distortion",
                "desc": "Treating subtraction as commutative across equality: assuming a - b = b - a.",
                "rule_type": "EXACT_WRONG_ANSWER",
                "rule_config": {"wrong_answer": "-x"},
                "classification": "conceptual",
                "itype": "conceptual_review",
                "principle": "Subtraction is not commutative: 8 - x ≠ x - 8.",
                "ex_w": "8 - x = 5 → x - 8 = 5",
                "ex_c": "8 - x = 5 → -x = -3 → x = 3"
            },
            # Skill 2: Simplifying Expressions
            {
                "id": "PAT_SIMP_DROP_TERM",
                "skill_id": "sk_simp_02",
                "name": "Dropped Constant Term",
                "desc": "Inadvertently dropping a trailing constant term during intermediate expression rewriting.",
                "rule_type": "MISSING_TERM_CHECK",
                "rule_config": {"term_type": "constant"},
                "classification": "careless",
                "itype": "guided_practice",
                "principle": "Every term in an expression must be accounted for in consecutive steps.",
                "ex_w": "3x + 4 + 5 = 18 → 3x + 5 = 18",
                "ex_c": "3x + 9 = 18"
            },
            {
                "id": "PAT_SIMP_ARITH_SLIP",
                "skill_id": "sk_simp_02",
                "name": "Arithmetic Calculation Slip",
                "desc": "Basic arithmetic computation error in adding or subtracting constants.",
                "rule_type": "NUMERIC_RELATIONSHIP",
                "rule_config": {"tolerance": 2},
                "classification": "careless",
                "itype": "guided_practice",
                "principle": "Double-check basic integer arithmetic operations.",
                "ex_w": "14 - 8 = 7",
                "ex_c": "14 - 8 = 6"
            },
            {
                "id": "PAT_SIMP_NEG_PROD",
                "skill_id": "sk_simp_02",
                "name": "Negative Multiplication Sign Confusion",
                "desc": "Multiplying two negative numbers and retaining a negative sign.",
                "rule_type": "SIGN_CHECK",
                "rule_config": {"check": "double_negative"},
                "classification": "procedural",
                "itype": "worked_example",
                "principle": "The product of two negative values is strictly positive: (-a) * (-b) = +ab.",
                "ex_w": "(-3) * (-4) = -12",
                "ex_c": "(-3) * (-4) = +12"
            },
            # Skill 3: Combining Like Terms
            {
                "id": "PAT_LIKE_UNLIKE",
                "skill_id": "sk_like_03",
                "name": "Combining Unlike Terms",
                "desc": "Adding variable terms to constant terms into a combined variable term: 4x + 7 = 11x.",
                "rule_type": "LIKE_TERM_CHECK",
                "rule_config": {"disallow_var_const_merge": True},
                "classification": "conceptual",
                "itype": "conceptual_review",
                "principle": "Variable terms and constant terms cannot be combined into a single term.",
                "ex_w": "4x + 7 = 19 → 11x = 19",
                "ex_c": "4x + 7 = 19 → 4x = 12"
            },
            {
                "id": "PAT_LIKE_COEFF_SUB",
                "skill_id": "sk_like_03",
                "name": "Incorrect Negative Coefficient Combination",
                "desc": "Subtracting negative variable terms improperly: 3x - (-5x) treated as 3x - 5x = -2x.",
                "rule_type": "SIGN_CHECK",
                "rule_config": {"pattern": "sub_negative_coeff"},
                "classification": "procedural",
                "itype": "worked_example",
                "principle": "Subtracting a negative term is equivalent to adding that term: a - (-b) = a + b.",
                "ex_w": "3x - (-5x) → -2x",
                "ex_c": "3x - (-5x) → 3x + 5x = 8x"
            },
            {
                "id": "PAT_LIKE_EXP_ADD",
                "skill_id": "sk_like_03",
                "name": "Exponent Addition on Linear Sum",
                "desc": "Adding variable exponents during addition: x + x = x^2 instead of 2x.",
                "rule_type": "EXACT_WRONG_ANSWER",
                "rule_config": {"wrong_answer": "x^2"},
                "classification": "conceptual",
                "itype": "conceptual_review",
                "principle": "Combining like terms adds coefficients, not exponents: x + x = 2x.",
                "ex_w": "x + x = x^2",
                "ex_c": "x + x = 2x"
            },
            # Skill 4: Distributive Property
            {
                "id": "PAT_DIST_PARTIAL",
                "skill_id": "sk_dist_04",
                "name": "Partial Distribution",
                "desc": "Multiplying the outer coefficient to the first variable term but failing to multiply the constant term.",
                "rule_type": "DISTRIBUTION_CHECK",
                "rule_config": {"require_all_terms": True},
                "classification": "procedural",
                "itype": "worked_example",
                "principle": "The multiplier must be applied to every single term inside the parentheses: a(b + c) = ab + ac.",
                "ex_w": "3(x + 2) = 15 → 3x + 2 = 15",
                "ex_c": "3(x + 2) = 15 → 3x + 6 = 15"
            },
            {
                "id": "PAT_DIST_SIGN",
                "skill_id": "sk_dist_04",
                "name": "Negative Distribution Sign Error",
                "desc": "Distributing a negative multiplier but failing to invert the sign of negative inner terms.",
                "rule_type": "DISTRIBUTION_CHECK",
                "rule_config": {"sign_sensitive": True},
                "classification": "procedural",
                "itype": "worked_example",
                "principle": "-a(x - c) = -ax + ac because negative times negative yields positive.",
                "ex_w": "-2(x - 4) → -2x - 8",
                "ex_c": "-2(x - 4) → -2x + 8"
            },
            {
                "id": "PAT_DIST_ADD_FIRST",
                "skill_id": "sk_dist_04",
                "name": "Premature Multiplication Before Parentheses",
                "desc": "Adding an external term to the multiplier before distributing: 2 + 3(x + 1) = 5(x + 1).",
                "rule_type": "EXACT_WRONG_ANSWER",
                "rule_config": {"wrong_answer": "5x+5"},
                "classification": "conceptual",
                "itype": "conceptual_review",
                "principle": "Order of operations (PEMDAS): multiplication/distribution precedes external addition.",
                "ex_w": "2 + 3(x + 1) → 5(x + 1) = 5x + 5",
                "ex_c": "2 + 3x + 3 = 3x + 5"
            },
            # Skill 5: Isolating the Variable
            {
                "id": "PAT_ISOL_WRONG_INV",
                "skill_id": "sk_isol_05",
                "name": "Wrong Inverse Operation",
                "desc": "Using subtraction instead of division to isolate a multiplied variable: 4x = 12 → x = 12 - 4 = 8.",
                "rule_type": "OPERATION_CHECK",
                "rule_config": {"target_op": "divide"},
                "classification": "procedural",
                "itype": "worked_example",
                "principle": "The inverse operation of multiplication is division.",
                "ex_w": "4x = 12 → x = 12 - 4 = 8",
                "ex_c": "4x = 12 → x = 12 / 4 = 3"
            },
            {
                "id": "PAT_ISOL_ONE_SIDE",
                "skill_id": "sk_isol_05",
                "name": "Single-Sided Operation Application",
                "desc": "Performing the inverse operation to eliminate a term on one side without executing it on the opposite side.",
                "rule_type": "SIDE_BALANCE_CHECK",
                "rule_config": {"enforce_bilateral": True},
                "classification": "procedural",
                "itype": "worked_example",
                "principle": "Bilateral balance requires identical operations applied simultaneously to both sides.",
                "ex_w": "x - 7 = 10 → x = 10",
                "ex_c": "x - 7 + 7 = 10 + 7 → x = 17"
            },
            {
                "id": "PAT_ISOL_COEFF_MULT",
                "skill_id": "sk_isol_05",
                "name": "Multiplying Instead of Dividing Coefficient",
                "desc": "Multiplying the RHS by the coefficient rather than dividing: 2x = 8 → x = 16.",
                "rule_type": "COEFFICIENT_CHECK",
                "rule_config": {"check_multiplication": True},
                "classification": "procedural",
                "itype": "worked_example",
                "principle": "Divide both sides by the variable's coefficient.",
                "ex_w": "2x = 8 → x = 16",
                "ex_c": "2x = 8 → x = 8 / 2 = 4"
            },
            # Skill 6: Multi-Step Equations
            {
                "id": "PAT_MULTI_PREMATURE_DIV",
                "skill_id": "sk_multi_06",
                "name": "Premature Division in Multi-Step Equations",
                "desc": "Dividing only the variable term or RHS before subtracting the constant term: 2x + 6 = 14 → x + 6 = 7.",
                "rule_type": "OPERATION_CHECK",
                "rule_config": {"step_order": "sub_before_div"},
                "classification": "procedural",
                "itype": "worked_example",
                "principle": "Clear additive constants before dividing by the variable coefficient.",
                "ex_w": "2x + 6 = 14 → x + 6 = 7",
                "ex_c": "2x + 6 = 14 → 2x = 8 → x = 4"
            },
            {
                "id": "PAT_MULTI_SIGN_CROSS",
                "skill_id": "sk_multi_06",
                "name": "Sign Reversal Failure Crossing Equality",
                "desc": "Moving a term to the opposite side of equality without changing its sign.",
                "rule_type": "SIGN_CHECK",
                "rule_config": {"cross_equality": True},
                "classification": "procedural",
                "itype": "worked_example",
                "principle": "Transposing a term to the opposite side requires applying its opposite inverse operation.",
                "ex_w": "3x + 5 = x + 13 → 3x + x = 13 - 5",
                "ex_c": "3x - x = 13 - 5 → 2x = 8"
            },
            {
                "id": "PAT_MULTI_DIST_CHAIN",
                "skill_id": "sk_multi_06",
                "name": "Chain Distribution Sign Inversion",
                "desc": "Inverting subsequent term signs during multi-bracket distribution.",
                "rule_type": "DISTRIBUTION_CHECK",
                "rule_config": {"multi_bracket": True},
                "classification": "procedural",
                "itype": "worked_example",
                "principle": "Evaluate each parenthesized group independently using standard distribution laws.",
                "ex_w": "2(x + 3) - (x - 4) = 15 → 2x + 6 - x - 4 = 15",
                "ex_c": "2x + 6 - x + 4 = 15"
            }
        ]

        for p in patterns_data:
            pat = MisconceptionPattern(
                id=p["id"],
                skill_id=p["skill_id"],
                name=p["name"],
                description=p["desc"],
                subject="Mathematics",
                rule_type=p["rule_type"],
                rule_config=p["rule_config"],
                classification=p["classification"],
                intervention_type=p["itype"],
                principle_text=p["principle"],
                example_wrong=p["ex_w"],
                example_correct=p["ex_c"],
                source="curated",
                status="active",
                occurrences=0
            )
            db.add(pat)
        db.flush()

        # 6. Seed Curated Question Bank (30 Questions across 6 skills)
        questions_data = [
            # Skill 1: Understanding Equality (sk_eq_01)
            {"id": "q_eq_01", "skill": "sk_eq_01", "q": "Find x: x + 4 = 11", "ans": "7", "steps": ["x + 4 = 11", "x = 11 - 4", "x = 7"], "diff": "easy"},
            {"id": "q_eq_02", "skill": "sk_eq_01", "q": "Solve for y: y - 8 = 15", "ans": "23", "steps": ["y - 8 = 15", "y = 15 + 8", "y = 23"], "diff": "easy"},
            {"id": "q_eq_03", "skill": "sk_eq_01", "q": "Find a: 14 = a + 6", "ans": "8", "steps": ["14 = a + 6", "a = 14 - 6", "a = 8"], "diff": "easy"},
            {"id": "q_eq_04", "skill": "sk_eq_01", "q": "Balance the equality: 7 + 5 = x + 3. What is x?", "ans": "9", "steps": ["7 + 5 = 12", "12 = x + 3", "x = 9"], "diff": "medium"},
            {"id": "q_eq_05", "skill": "sk_eq_01", "q": "Solve: 20 - x = 12", "ans": "8", "steps": ["20 - x = 12", "-x = 12 - 20", "-x = -8", "x = 8"], "diff": "medium"},

            # Skill 2: Simplifying Expressions (sk_simp_02)
            {"id": "q_simp_01", "skill": "sk_simp_02", "q": "Simplify: 5 + 3 - 2 + 10", "ans": "16", "steps": ["5 + 3 = 8", "8 - 2 = 6", "6 + 10 = 16"], "diff": "easy"},
            {"id": "q_simp_02", "skill": "sk_simp_02", "q": "Evaluate: (-4) * (-3) + 5", "ans": "17", "steps": ["(-4) * (-3) = 12", "12 + 5 = 17"], "diff": "easy"},
            {"id": "q_simp_03", "skill": "sk_simp_02", "q": "Simplify: 18 - 4 * 2 + 6", "ans": "16", "steps": ["4 * 2 = 8", "18 - 8 = 10", "10 + 6 = 16"], "diff": "medium"},
            {"id": "q_simp_04", "skill": "sk_simp_02", "q": "Calculate: -15 + (-7) - (-10)", "ans": "-12", "steps": ["-15 + (-7) = -22", "-22 + 10 = -12"], "diff": "medium"},
            {"id": "q_simp_05", "skill": "sk_simp_02", "q": "Evaluate: 6 * (8 - 5) - 4", "ans": "14", "steps": ["8 - 5 = 3", "6 * 3 = 18", "18 - 4 = 14"], "diff": "medium"},

            # Skill 3: Combining Like Terms (sk_like_03)
            {"id": "q_like_01", "skill": "sk_like_03", "q": "Combine like terms: 4x + 3x = 21. What is x?", "ans": "3", "steps": ["4x + 3x = 7x", "7x = 21", "x = 3"], "diff": "easy"},
            {"id": "q_like_02", "skill": "sk_like_03", "q": "Solve: 8x - 5x = 18", "ans": "6", "steps": ["8x - 5x = 3x", "3x = 18", "x = 6"], "diff": "easy"},
            {"id": "q_like_03", "skill": "sk_like_03", "q": "Solve: 2x + 5 + 3x = 25", "ans": "4", "steps": ["(2x + 3x) + 5 = 25", "5x + 5 = 25", "5x = 20", "x = 4"], "diff": "medium"},
            {"id": "q_like_04", "skill": "sk_like_03", "q": "Solve: 7x - 2x + 4 = 29", "ans": "5", "steps": ["5x + 4 = 29", "5x = 25", "x = 5"], "diff": "medium"},
            {"id": "q_like_05", "skill": "sk_like_03", "q": "Solve: 9x - 4 - 3x = 14", "ans": "3", "steps": ["6x - 4 = 14", "6x = 18", "x = 3"], "diff": "medium"},

            # Skill 4: Distributive Property (sk_dist_04)
            {"id": "q_dist_01", "skill": "sk_dist_04", "q": "Solve: 3(x + 2) = 15", "ans": "3", "steps": ["3(x + 2) = 15", "3x + 6 = 15", "3x = 9", "x = 3"], "diff": "medium"},
            {"id": "q_dist_02", "skill": "sk_dist_04", "q": "Solve: 4(x + 3) = 28", "ans": "4", "steps": ["4(x + 3) = 28", "4x + 12 = 28", "4x = 16", "x = 4"], "diff": "medium"},
            {"id": "q_dist_03", "skill": "sk_dist_04", "q": "Solve: 2(x - 5) = 14", "ans": "12", "steps": ["2(x - 5) = 14", "2x - 10 = 14", "2x = 24", "x = 12"], "diff": "medium"},
            {"id": "q_dist_04", "skill": "sk_dist_04", "q": "Solve: -2(x - 4) = 6", "ans": "1", "steps": ["-2(x - 4) = 6", "-2x + 8 = 6", "-2x = -2", "x = 1"], "diff": "hard"},
            {"id": "q_dist_05", "skill": "sk_dist_04", "q": "Solve: 5(2x + 1) = 35", "ans": "3", "steps": ["10x + 5 = 35", "10x = 30", "x = 3"], "diff": "hard"},

            # Skill 5: Isolating the Variable (sk_isol_05)
            {"id": "q_isol_01", "skill": "sk_isol_05", "q": "Solve for x: 4x = 24", "ans": "6", "steps": ["4x = 24", "x = 24 / 4", "x = 6"], "diff": "easy"},
            {"id": "q_isol_02", "skill": "sk_isol_05", "q": "Solve for x: 3x - 5 = 16", "ans": "7", "steps": ["3x - 5 = 16", "3x = 21", "x = 7"], "diff": "medium"},
            {"id": "q_isol_03", "skill": "sk_isol_05", "q": "Solve for x: 5x + 9 = 34", "ans": "5", "steps": ["5x + 9 = 34", "5x = 25", "x = 5"], "diff": "medium"},
            {"id": "q_isol_04", "skill": "sk_isol_05", "q": "Solve: x / 3 + 4 = 9", "ans": "15", "steps": ["x / 3 = 5", "x = 5 * 3", "x = 15"], "diff": "medium"},
            {"id": "q_isol_05", "skill": "sk_isol_05", "q": "Solve: 8 - 2x = 2", "ans": "3", "steps": ["-2x = 2 - 8", "-2x = -6", "x = 3"], "diff": "hard"},

            # Skill 6: Multi-Step Equations (sk_multi_06)
            {"id": "q_multi_01", "skill": "sk_multi_06", "q": "Solve: 2x + 3x - 4 = 16", "ans": "4", "steps": ["5x - 4 = 16", "5x = 20", "x = 4"], "diff": "medium"},
            {"id": "q_multi_02", "skill": "sk_multi_06", "q": "Solve: 3(x + 1) + 2x = 18", "ans": "3", "steps": ["3x + 3 + 2x = 18", "5x + 3 = 18", "5x = 15", "x = 3"], "diff": "hard"},
            {"id": "q_multi_03", "skill": "sk_multi_06", "q": "Solve: 4(x - 2) = 2x + 6", "ans": "7", "steps": ["4x - 8 = 2x + 6", "2x - 8 = 6", "2x = 14", "x = 7"], "diff": "hard"},
            {"id": "q_multi_04", "skill": "sk_multi_06", "q": "Solve: 5x - (2x + 3) = 12", "ans": "5", "steps": ["5x - 2x - 3 = 12", "3x - 3 = 12", "3x = 15", "x = 5"], "diff": "hard"},
            {"id": "q_multi_05", "skill": "sk_multi_06", "q": "Solve: 2(3x - 1) = 4(x + 2)", "ans": "5", "steps": ["6x - 2 = 4x + 8", "2x - 2 = 8", "2x = 10", "x = 5"], "diff": "hard"}
        ]

        for q in questions_data:
            new_q = Question(
                id=q["id"],
                chapter_id=chapter_math.id,
                skill_id=q["skill"],
                question_text=q["q"],
                correct_answer=q["ans"],
                expected_steps=q["steps"],
                difficulty=q["diff"],
                source_type="curated",
                source_reference={"chapter": "Linear Equations", "level": "curated_demo"},
                diagnostic_tags=[q["skill"], q["diff"]],
                active=True
            )
            db.add(new_q)
        db.flush()

        # 7. Seed Curated Interventions
        interventions_data = [
            {
                "id": "int_worked_dist",
                "skill_id": "sk_dist_04",
                "pattern_id": "PAT_DIST_PARTIAL",
                "itype": "worked_example",
                "title": "Worked Example: The Distributive Law Symmetrical Multiplier",
                "content": {
                    "headline": "Distributive Property: Multiply Every Term",
                    "core_rule": "When expanding a(b + c), the multiplier outside applies to EVERY term inside: ab + ac.",
                    "worked_steps": [
                        {"step": 1, "math": "3(x + 2) = 15", "explanation": "Notice the 3 outside the parentheses. It controls both x AND +2."},
                        {"step": 2, "math": "3·x + 3·2 = 15", "explanation": "Distribute 3 to x AND 3 to 2.", "highlight": "Multiply both terms"},
                        {"step": 3, "math": "3x + 6 = 15", "explanation": "Calculate 3*2 = 6 (Common mistake is leaving this as 2)."},
                        {"step": 4, "math": "3x = 9", "explanation": "Subtract 6 from both sides."},
                        {"step": 5, "math": "x = 3", "explanation": "Divide by 3 to isolate x."}
                    ],
                    "common_pitfall": "Writing 3(x + 2) as 3x + 2 skips the constant multiplication.",
                    "interactive_tip": "If 3 students each get 1 notebook and 2 pens, you need 3 notebooks AND 6 pens!"
                }
            },
            {
                "id": "int_concept_like",
                "skill_id": "sk_like_03",
                "pattern_id": "PAT_LIKE_UNLIKE",
                "itype": "conceptual_review",
                "title": "Conceptual Review: Like vs Unlike Algebraic Terms",
                "content": {
                    "headline": "Why We Never Combine Variables with Pure Constants",
                    "core_rule": "Only terms that share the exact same variable part can have their coefficients added.",
                    "worked_steps": [
                        {"step": 1, "math": "4x + 7 = 19", "explanation": "4x represents an unknown quantity scaled by 4. 7 is a fixed number."},
                        {"step": 2, "math": "4x ≠ 11x", "explanation": "You cannot combine 4x and 7 into 11x. Keep them separate.", "highlight": "Do not merge"},
                        {"step": 3, "math": "4x = 19 - 7", "explanation": "Subtract constant 7 from both sides."},
                        {"step": 4, "math": "4x = 12", "explanation": "Now we have variable on left, constant on right."},
                        {"step": 5, "math": "x = 3", "explanation": "Divide by 4."}
                    ],
                    "common_pitfall": "Combining 4x + 7 into 11x.",
                    "interactive_tip": "4 apples plus 7 dollars does not equal 11 apple-dollars."
                }
            }
        ]

        for iv in interventions_data:
            new_iv = Intervention(
                id=iv["id"],
                skill_id=iv["skill_id"],
                pattern_id=iv["pattern_id"],
                intervention_type=iv["itype"],
                title=iv["title"],
                content=iv["content"],
                target_misconception=iv["pattern_id"]
            )
            db.add(new_iv)
        db.flush()

        db.flush()

        # 8. Seed Sample Uploaded Chapter: Mode B ("Current Electricity")
        doc_sample = db.query(UploadedDocument).filter(UploadedDocument.id == "doc_sample_physics").first()
        if not doc_sample:
            doc_sample = UploadedDocument(
                id="doc_sample_physics",
                filename="Physics — Current Electricity.pdf",
                file_path="uploads/Physics_Current_Electricity.pdf",
                file_size_bytes=425120,
                mime_type="application/pdf",
                status="ready",
                progress_percent=100,
                current_stage="ready",
                chapter_id="chap_current_elec",
                created_at=now - datetime.timedelta(minutes=15)
            )
            db.add(doc_sample)

        chap_physics = db.query(Chapter).filter(Chapter.id == "chap_current_elec").first()
        if not chap_physics:
            chap_physics = Chapter(
                id="chap_current_elec",
                title="Physics — Current Electricity",
                subject="Physics",
                description="Extracted student learning material covering electric current, Ohm's law, resistance, and circuit configurations.",
                source_type="uploaded_pdf",
                source_document_id="doc_sample_physics",
                status="active"
            )
            db.add(chap_physics)
            db.flush()

            physics_skills = [
                ("sk_phy_01", "OHM-01", "Ohm's Law & Resistance", [], 1),
                ("sk_phy_02", "RES-02", "Resistivity & Dimensional Factors", ["OHM-01"], 2),
                ("sk_phy_03", "SER-03", "Series Circuit Analysis", ["OHM-01"], 3),
                ("sk_phy_04", "PAR-04", "Parallel Circuit Analysis", ["OHM-01"], 4),
                ("sk_phy_05", "POW-05", "Electrical Power & Energy", ["OHM-01", "SER-03"], 5),
                ("sk_phy_06", "CIR-06", "Complex Multi-branch Networks", ["SER-03", "PAR-04"], 6)
            ]
            for p_id, p_code, p_name, p_pre, p_ord in physics_skills:
                db.add(Skill(
                    id=p_id,
                    chapter_id="chap_current_elec",
                    code=p_code,
                    name=p_name,
                    description=f"Extracted from uploaded chapter: {p_name}",
                    prerequisite_skill_ids=p_pre,
                    difficulty="medium",
                    order=p_ord
                ))
            db.flush()

            db.add(Question(
                id="q_phy_01",
                chapter_id="chap_current_elec",
                skill_id="sk_phy_01",
                question_text="A circuit component has a potential difference of 12 V and carries a current of 2 A. Calculate its electrical resistance in Ohms.",
                correct_answer="6",
                expected_steps=["V = I * R", "R = V / I", "R = 12 / 2 = 6 Ohms"],
                difficulty="easy",
                source_type="uploaded_pdf",
                source_reference={
                    "source_type": "uploaded_pdf",
                    "source_document": "Physics — Current Electricity.pdf",
                    "source_section": "Section 1.2 — Ohm's Law and Potential Difference",
                    "generated_by": "content_pipeline",
                    "validated": True
                },
                diagnostic_tags=["uploaded_material", "OHM-01"],
                active=True
            ))

        # 9. Seed Chemistry Initial Dataset (Demonstrates Subject-Agnostic Architecture)
        chap_chem = db.query(Chapter).filter(Chapter.id == "chap_chem_reactions").first()
        if not chap_chem:
            chap_chem = Chapter(
                id="chap_chem_reactions",
                title="Chemical Reactions and Equations",
                subject="Chemistry",
                description="Foundations of chemical formulas, reactants and products, and balancing equations under the law of conservation of mass.",
                source_type="curated",
                status="active"
            )
            db.add(chap_chem)
            db.flush()

            chem_skills = [
                ("sk_chem_01", "CHEM-01", "Identifying Chemical Formulas", [], 1),
                ("sk_chem_02", "CHEM-02", "Conservation of Mass in Reactions", ["CHEM-01"], 2),
                ("sk_chem_03", "CHEM-03", "Balancing Chemical Equations", ["CHEM-01", "CHEM-02"], 3)
            ]
            for c_id, c_code, c_name, c_pre, c_ord in chem_skills:
                db.add(Skill(
                    id=c_id,
                    chapter_id="chap_chem_reactions",
                    code=c_code,
                    name=c_name,
                    description=f"Core concept: {c_name}",
                    prerequisite_skill_ids=c_pre,
                    difficulty="medium",
                    order=c_ord
                ))
            db.flush()

            db.add(Question(
                id="q_chem_01",
                chapter_id="chap_chem_reactions",
                skill_id="sk_chem_03",
                question_text="Balance the equation for the synthesis of water: H₂ + O₂ → H₂O. What is the stoichiometric coefficient for H₂O?",
                correct_answer="2",
                expected_steps=[
                    "Count atoms on reactants side: 2 Hydrogen, 2 Oxygen",
                    "Count atoms on products side: 2 Hydrogen, 1 Oxygen",
                    "Balance Oxygen atoms with coefficient 2 for H₂O: H₂ + O₂ → 2H₂O",
                    "Balance Hydrogen atoms with coefficient 2 for H₂: 2H₂ + O₂ → 2H₂O"
                ],
                difficulty="medium",
                source_type="curated",
                source_reference={"subject": "Chemistry", "topic": "Balancing Equations"},
                diagnostic_tags=["chemistry", "CHEM-03"],
                active=True
            ))

        db.flush()
        print("Curriculum seeded successfully (Mathematics, Physics, Chemistry).")


def seed_demo_cohort(db: Session):
    """Seed demo cohort (Student A through Student E) strictly for local offline tests/demonstrations.
    MUST NEVER be invoked on production PostgreSQL/Supabase.
    """
    now = datetime.datetime.utcnow()

    # Teacher demo
    if not db.query(TeacherDemo).filter(TeacherDemo.id == "teacher_demo").first():
        db.add(TeacherDemo(
            id="teacher_demo",
            name="Demo Instructor",
            classroom="Cohort 101"
        ))

    # Neutral Demo Students
    students = [
        Student(id="student_a", name="Student A", role="student", email="student_a@hacktron.edu", avatar_color="#2563EB"),
        Student(id="student_b", name="Student B", role="student", email="student_b@hacktron.edu", avatar_color="#7C3AED"),
        Student(id="student_c", name="Student C", role="student", email="student_c@hacktron.edu", avatar_color="#059669"),
        Student(id="student_d", name="Student D", role="student", email="student_d@hacktron.edu", avatar_color="#D97706"),
        Student(id="student_e", name="Student E", role="student", email="student_e@hacktron.edu", avatar_color="#DB2777"),
    ]
    for s in students:
        if not db.query(Student).filter(Student.id == s.id).first():
            db.add(s)
    db.flush()

    # Student A Mastery States
    student_a_masteries = [
        ("sk_eq_01", 0.82, 4),
        ("sk_simp_02", 0.74, 3),
        ("sk_like_03", 0.78, 4),
        ("sk_dist_04", 0.42, 3), # Weakness
        ("sk_isol_05", 0.63, 3),
        ("sk_multi_06", 0.52, 2)
    ]
    for sk_id, p_val, ev in student_a_masteries:
        m_id = f"student_a_{sk_id}"
        if not db.query(MasteryState).filter(MasteryState.id == m_id).first():
            db.add(MasteryState(
                id=m_id,
                student_id="student_a",
                skill_id=sk_id,
                mastery_probability=p_val,
                confidence=min(1.0, ev / 4.0),
                evidence_count=ev,
                history=[{"timestamp": (now - datetime.timedelta(days=1)).isoformat(), "p_mastery": p_val}],
                last_updated=now
            ))

    if not db.query(StudentMisconceptionInstance).filter(StudentMisconceptionInstance.id == "smi_a_dist").first():
        db.add(StudentMisconceptionInstance(
            id="smi_a_dist",
            student_id="student_a",
            pattern_id="PAT_DIST_PARTIAL",
            skill_id="sk_dist_04",
            status="active",
            occurrences=1,
            evidence_examples=["3(x + 2) = 15 → 3x + 2 = 15"],
            first_detected=now - datetime.timedelta(hours=2),
            last_detected=now - datetime.timedelta(hours=2)
        ))

    # Student B Mastery States
    student_b_masteries = [
        ("sk_eq_01", 0.68, 3),
        ("sk_simp_02", 0.70, 3),
        ("sk_like_03", 0.45, 3), # Weakness
        ("sk_dist_04", 0.76, 4), # Strong
        ("sk_isol_05", 0.51, 3), # Weakness
        ("sk_multi_06", 0.50, 2)
    ]
    for sk_id, p_val, ev in student_b_masteries:
        m_id = f"student_b_{sk_id}"
        if not db.query(MasteryState).filter(MasteryState.id == m_id).first():
            db.add(MasteryState(
                id=m_id,
                student_id="student_b",
                skill_id=sk_id,
                mastery_probability=p_val,
                confidence=min(1.0, ev / 4.0),
                evidence_count=ev,
                history=[{"timestamp": (now - datetime.timedelta(days=1)).isoformat(), "p_mastery": p_val}],
                last_updated=now
            ))

    if not db.query(StudentMisconceptionInstance).filter(StudentMisconceptionInstance.id == "smi_b_like").first():
        db.add(StudentMisconceptionInstance(
            id="smi_b_like",
            student_id="student_b",
            pattern_id="PAT_LIKE_UNLIKE",
            skill_id="sk_like_03",
            status="active",
            occurrences=2,
            evidence_examples=["5x + 3 = 18 → 8x = 18"],
            first_detected=now - datetime.timedelta(hours=5),
            last_detected=now - datetime.timedelta(hours=1)
        ))

    if not db.query(EmergingGap).filter(EmergingGap.id == "gap_b_like").first():
        db.add(EmergingGap(
            id="gap_b_like",
            student_id="student_b",
            skill_id="sk_like_03",
            title="Prerequisite Gap in Term Grouping",
            description="Combining unlike terms is blocking progression to multi-step variable isolation.",
            risk_level="high",
            trigger_reason="Recurring error in like terms combined with sub-50% mastery.",
            detected_at=now,
            status="active"
        ))

    # Other Class Students (Student C, Student D, Student E)
    skills_math = ["sk_eq_01", "sk_simp_02", "sk_like_03", "sk_dist_04", "sk_isol_05", "sk_multi_06"]
    for st_id, base_score in [("student_c", 0.85), ("student_d", 0.72), ("student_e", 0.52)]:
        for idx, sk_id in enumerate(skills_math):
            m_id = f"{st_id}_{sk_id}"
            if not db.query(MasteryState).filter(MasteryState.id == m_id).first():
                db.add(MasteryState(
                    id=m_id,
                    student_id=st_id,
                    skill_id=sk_id,
                    mastery_probability=max(0.35, min(0.95, base_score + (0.05 if idx <= 1 else -0.05))),
                    confidence=0.75,
                    evidence_count=3,
                    history=[],
                    last_updated=now
                ))
    db.flush()
    print("Demo cohort seeded successfully (for local SQLite tests only).")


def seed_database(force_reset: bool = False, include_demo_cohort: bool = None):
    # Determine whether demo cohort should be included
    # Supabase / PostgreSQL NEVER receives fake demo cohort
    if settings.is_postgres:
        include_demo_cohort = False
    elif include_demo_cohort is None:
        include_demo_cohort = settings.is_sqlite

    db = SessionLocal()
    try:
        if force_reset and settings.is_sqlite:
            print("Resetting local SQLite database...")
            Base.metadata.drop_all(bind=engine)
            Base.metadata.create_all(bind=engine)

        # 1. Seed legitimate curriculum records
        existing_chapter = db.query(Chapter).filter(Chapter.id == "chap_linear_eq").first()
        if not existing_chapter or force_reset:
            seed_curriculum(db)

        # 2. Seed demo cohort strictly for local tests if requested
        if include_demo_cohort:
            existing_student = db.query(Student).filter(Student.id == "student_a").first()
            if not existing_student or force_reset:
                seed_demo_cohort(db)

        db.commit()
    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    init_db()
    seed_database()

