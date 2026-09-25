import re
from typing import List, Dict, Any, Optional, Tuple

class ExpressionParser:
    """
    Normalizes and parses algebraic expressions and linear equations
    into structured components: LHS, RHS, terms, coefficients, constants,
    and parenthesized sub-expressions.
    """
    
    @staticmethod
    def normalize_string(s: str) -> str:
        if not s:
            return ""
        # Lowercase, trim
        s = s.strip().lower()
        # Remove extra spaces around operators
        s = re.sub(r'\s+', '', s)
        # Normalize multiplication signs: \times, *, ·, etc.
        s = s.replace('×', '*').replace('·', '*').replace('**', '^')
        # Standardize signs: +- -> -, -+ -> -, -- -> +, ++ -> +
        s = s.replace('+-', '-').replace('-+', '-').replace('--', '+').replace('++', '+')
        return s

    @staticmethod
    def split_equation(eq_str: str) -> Tuple[str, str]:
        norm = ExpressionParser.normalize_string(eq_str)
        if '=' in norm:
            parts = norm.split('=', 1)
            return parts[0], parts[1]
        return norm, ""

    @staticmethod
    def extract_distribution_components(expr: str) -> Optional[Dict[str, Any]]:
        """
        Detects patterns like a(bx + c) or a(x + c) or -a(x - c)
        Returns: { 'multiplier': float, 'inner_var_coeff': float, 'var': str, 'inner_const': float }
        """
        # Match: (optional sign and number)( (optional sign and number)(x) (sign and number) )
        pattern = r'^([+-]?\d*)\(([+-]?\d*)([a-z])([+-]\d+)\)$'
        m = re.match(pattern, expr)
        if not m:
            # Check if there is trailing terms like 3(x+2)+5
            pattern_prefix = r'^([+-]?\d*)\(([+-]?\d*)([a-z])([+-]\d+)\)'
            m = re.match(pattern_prefix, expr)
            if not m:
                return None

        mult_str, var_coeff_str, var, const_str = m.groups()
        
        # Multiplier
        if mult_str in ("", "+"):
            mult = 1.0
        elif mult_str == "-":
            mult = -1.0
        else:
            mult = float(mult_str)
            
        # Inner variable coefficient
        if var_coeff_str in ("", "+"):
            var_coeff = 1.0
        elif var_coeff_str == "-":
            var_coeff = -1.0
        else:
            var_coeff = float(var_coeff_str)
            
        inner_const = float(const_str)
        
        return {
            "multiplier": mult,
            "var_coeff": var_coeff,
            "var": var,
            "inner_const": inner_const,
            "raw_match": m.group(0)
        }

    @staticmethod
    def extract_linear_terms(expr: str, var: str = "x") -> Dict[str, float]:
        """
        Parses an expression like 3x + 4 - 2x + 7 into total var coefficient and constant sum.
        Handles basic expanded linear polynomials.
        """
        norm = ExpressionParser.normalize_string(expr)
        # Tokenize by + and -
        tokens = re.findall(r'[+-]?[^+-]+', norm if norm.startswith(('+', '-')) else '+' + norm)
        
        var_sum = 0.0
        const_sum = 0.0
        
        for tok in tokens:
            if var in tok:
                coeff_part = tok.replace(var, "")
                if coeff_part in ("", "+"):
                    var_sum += 1.0
                elif coeff_part == "-":
                    var_sum -= 1.0
                else:
                    try:
                        var_sum += float(coeff_part)
                    except ValueError:
                        pass
            else:
                try:
                    const_sum += float(tok)
                except ValueError:
                    pass
                    
        return {"var_coeff": var_sum, "constant": const_sum}


class DeterministicMisconceptionEngine:
    """
    Deterministic rule-based misconception diagnostic engine.
    Analyzes student work step-by-step against formal algebraic rules.
    Runs 100% deterministically with zero LLM invocations.
    """
    
    def __init__(self, rule_registry: Optional[List[Dict[str, Any]]] = None):
        self.rule_registry = rule_registry or []

    def evaluate_attempt(
        self,
        question_text: str,
        correct_answer: str,
        student_answer: str,
        work_shown: List[str],
        skill_id: str,
        pattern_rules: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Main entry point for diagnosing student attempts.
        Returns structured diagnosis with confidence, pattern_id, rule_type, and explanation.
        """
        norm_student_ans = ExpressionParser.normalize_string(student_answer)
        norm_correct_ans = ExpressionParser.normalize_string(correct_answer)
        
        # Check overall correctness
        is_correct = (norm_student_ans == norm_correct_ans)
        if not is_correct and student_answer:
            # Try float comparison if numeric
            try:
                if abs(float(norm_student_ans) - float(norm_correct_ans)) < 1e-5:
                    is_correct = True
            except ValueError:
                pass

        if is_correct:
            return {
                "matched": True,
                "is_correct": True,
                "engine_used": "deterministic",
                "pattern_id": None,
                "classification": "correct",
                "confidence": 1.0,
                "likely_misconception": None,
                "explanation": "Correct solution! All mathematical transitions and principles were applied accurately.",
                "mistake_card": None
            }

        # If answer is wrong but no work shown (Mode 3)
        if not work_shown or len(work_shown) == 0:
            return {
                "matched": False,
                "is_correct": False,
                "engine_used": "none",
                "pattern_id": None,
                "classification": "careless",
                "confidence": 0.3,
                "likely_misconception": "Unspecified calculation error (No work shown)",
                "explanation": "Your final answer is incorrect. Because no work was submitted, limited reasoning evidence is available to determine the exact misconception.",
                "mistake_card": None
            }

        # Clean and deduplicate steps: avoid duplicate question text at steps[0]
        cleaned_steps = [question_text]
        for w in work_shown:
            w_strip = w.strip()
            if w_strip and ExpressionParser.normalize_string(w_strip) != ExpressionParser.normalize_string(cleaned_steps[-1]):
                cleaned_steps.append(w_strip)
        steps = cleaned_steps
        
        # Iterate over rule library for matches
        for rule in pattern_rules:
            rule_type = rule.get("rule_type", "")
            rule_config = rule.get("rule_config", {})
            pattern_id = rule.get("id")
            
            match_result = self._check_rule(steps, rule_type, rule_config, norm_student_ans, norm_correct_ans)
            if match_result and match_result.get("matched"):
                # Detected known misconception deterministically!
                return {
                    "matched": True,
                    "is_correct": False,
                    "engine_used": "deterministic",
                    "pattern_id": pattern_id,
                    "rule_type": rule_type,
                    "classification": rule.get("classification", "procedural"),
                    "confidence": match_result.get("confidence", 0.95),
                    "likely_misconception": rule.get("name"),
                    "explanation": match_result.get("explanation", rule.get("description")),
                    "what_you_did": match_result.get("what_you_did"),
                    "why_it_is_wrong": rule.get("description"),
                    "correct_principle": rule.get("principle_text", "Apply inverse operations symmetrically."),
                    "recommended_intervention": rule.get("intervention_type", "worked_example"),
                    "mistake_card": {
                        "misconception_name": rule.get("name"),
                        "skill_name": rule.get("skill_name", "Algebra"),
                        "what_you_did": match_result.get("what_you_did", "Incorrect algebraic transition"),
                        "why_it_is_wrong": rule.get("description", "Principle misapplied"),
                        "correct_principle": rule.get("principle_text", "Standard algebraic law"),
                        "occurrences": 1,
                        "status": "active",
                        "recommended_intervention": rule.get("intervention_type", "worked_example")
                    }
                }

        # Fallback within deterministic engine: check common arithmetic / wrong sign
        arithmetic_check = self._check_arithmetic_slip(norm_student_ans, norm_correct_ans)
        if arithmetic_check:
            return {
                "matched": True,
                "is_correct": False,
                "engine_used": "deterministic",
                "pattern_id": "SIMP_ARITH_SLIP",
                "rule_type": "NUMERIC_RELATIONSHIP",
                "classification": "careless",
                "confidence": 0.85,
                "likely_misconception": "Arithmetic Calculation Slip",
                "explanation": arithmetic_check["explanation"],
                "what_you_did": arithmetic_check["what_you_did"],
                "why_it_is_wrong": "The algebraic procedure was followed, but an arithmetic computation error occurred.",
                "correct_principle": "Verify intermediate addition, subtraction, or multiplication results.",
                "recommended_intervention": "light_retry",
                "mistake_card": {
                    "misconception_name": "Arithmetic Calculation Slip",
                    "skill_name": "Simplifying Expressions",
                    "what_you_did": arithmetic_check["what_you_did"],
                    "why_it_is_wrong": "Arithmetic slip in final step.",
                    "correct_principle": "Double-check basic arithmetic calculations.",
                    "occurrences": 1,
                    "status": "active",
                    "recommended_intervention": "light_retry"
                }
            }

        # If no deterministic rule confidently matches -> escalate to LLM Fallback!
        return {
            "matched": False,
            "is_correct": False,
            "engine_used": "deterministic",
            "confidence": 0.2,
            "likely_misconception": None,
            "explanation": "No known deterministic pattern confidently explains this error.",
            "mistake_card": None
        }

    def _check_rule(
        self,
        steps: List[str],
        rule_type: str,
        config: Dict[str, Any],
        student_ans: str,
        correct_ans: str
    ) -> Optional[Dict[str, Any]]:
        """
        Dispatches to specialized structural rule evaluators.
        """
        if rule_type == "DISTRIBUTION_CHECK":
            return self._eval_distribution_check(steps, config)
        elif rule_type == "LIKE_TERM_CHECK":
            return self._eval_like_term_check(steps, config)
        elif rule_type == "SIGN_CHECK":
            return self._eval_sign_check(steps, config)
        elif rule_type == "SIDE_BALANCE_CHECK":
            return self._eval_side_balance_check(steps, config)
        elif rule_type == "OPERATION_CHECK":
            return self._eval_operation_check(steps, config)
        elif rule_type == "COEFFICIENT_CHECK":
            return self._eval_coefficient_check(steps, config)
        elif rule_type == "EXACT_WRONG_ANSWER":
            return self._eval_exact_wrong_answer(student_ans, config)
        return None

    def _eval_distribution_check(self, steps: List[str], config: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Evaluates partial distribution: e.g. 3(x + 2) = 15 -> 3x + 2 = 15
        or sign errors in distribution: -2(x - 3) = 8 -> -2x - 6 = 8
        """
        step0 = steps[0] # Equation with parenthesized term
        if len(steps) < 2:
            return None
        step1 = steps[1] # First student step
        
        lhs0, rhs0 = ExpressionParser.split_equation(step0)
        lhs1, rhs1 = ExpressionParser.split_equation(step1)
        
        dist_comp = ExpressionParser.extract_distribution_components(lhs0)
        if not dist_comp:
            # Check if rhs had the distribution
            dist_comp = ExpressionParser.extract_distribution_components(rhs0)
            target_side = "rhs"
            curr_step_side = rhs1
        else:
            target_side = "lhs"
            curr_step_side = lhs1

        if not dist_comp:
            return None
            
        m = dist_comp["multiplier"]
        var = dist_comp["var"]
        c = dist_comp["inner_const"]
        
        # Expected expansion: (m * var) + (m * c)
        expected_const = m * c
        unmultiplied_const = c
        
        curr_parsed = ExpressionParser.extract_linear_terms(curr_step_side, var)
        
        # Check Partial Distribution: multiplier applied to var, but NOT to constant
        # e.g. 3(x + 2) -> 3x + 2 (curr_parsed['constant'] == 2 instead of 6)
        if abs(curr_parsed["var_coeff"] - m * dist_comp["var_coeff"]) < 1e-5:
            if abs(curr_parsed["constant"] - unmultiplied_const) < 1e-5 and abs(expected_const - unmultiplied_const) > 1e-5:
                return {
                    "matched": True,
                    "confidence": 0.98,
                    "what_you_did": f"{dist_comp['raw_match']} → {curr_step_side}",
                    "explanation": f"You distributed the multiplier {int(m) if m.is_integer() else m} to the variable term, but forgot to multiply the constant term inside the parentheses (wrote {int(unmultiplied_const)} instead of {int(expected_const)})."
                }
                
            # Check Sign Error in Distribution: -a(x - c) -> -ax - ac instead of -ax + ac
            if abs(curr_parsed["constant"] - (-expected_const)) < 1e-5 and abs(expected_const) > 1e-5:
                return {
                    "matched": True,
                    "confidence": 0.95,
                    "what_you_did": f"{dist_comp['raw_match']} → {curr_step_side}",
                    "explanation": f"Sign error during distribution: Multiplying negative {int(m) if m.is_integer() else m} by {int(c) if c.is_integer() else c} should produce positive {int(expected_const)}, but negative sign was retained."
                }

        return None

    def _eval_like_term_check(self, steps: List[str], config: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Detects combining unlike terms (e.g. 4x + 7 = 19 -> 11x = 19)
        """
        for i in range(len(steps) - 1):
            s_curr = steps[i]
            s_next = steps[i + 1]
            lhs_c, _ = ExpressionParser.split_equation(s_curr)
            lhs_n, _ = ExpressionParser.split_equation(s_next)
            
            p_curr = ExpressionParser.extract_linear_terms(lhs_c)
            p_next = ExpressionParser.extract_linear_terms(lhs_n)
            
            # If current had both a variable and a non-zero constant (e.g. 4x + 7)
            # and next has combined them into a single variable term (e.g. 11x)
            if p_curr["constant"] != 0 and p_curr["var_coeff"] != 0:
                combined_sum = p_curr["var_coeff"] + p_curr["constant"]
                if abs(p_next["var_coeff"] - combined_sum) < 1e-5 and abs(p_next["constant"]) < 1e-5:
                    return {
                        "matched": True,
                        "confidence": 0.98,
                        "what_you_did": f"{lhs_c} → {lhs_n}",
                        "explanation": f"You combined unlike terms: variable term ({int(p_curr['var_coeff'])}x) and constant term ({int(p_curr['constant'])}) were added together to make {int(combined_sum)}x. Only like terms with matching variables can be combined."
                    }
        return None

    def _eval_side_balance_check(self, steps: List[str], config: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Detects applying an operation to only one side (e.g. x - 5 = 12 -> x = 12)
        """
        if len(steps) < 2:
            return None
        lhs0, rhs0 = ExpressionParser.split_equation(steps[0])
        lhs1, rhs1 = ExpressionParser.split_equation(steps[1])
        
        p0_l = ExpressionParser.extract_linear_terms(lhs0)
        p1_l = ExpressionParser.extract_linear_terms(lhs1)
        
        try:
            r0_val = float(rhs0)
            r1_val = float(rhs1)
        except ValueError:
            return None
            
        # If LHS eliminated constant (e.g. x - 5 -> x) but RHS remained unchanged (12 -> 12)
        if p0_l["constant"] != 0 and p1_l["constant"] == 0 and abs(r0_val - r1_val) < 1e-5:
            return {
                "matched": True,
                "confidence": 0.96,
                "what_you_did": f"{steps[0]} → {steps[1]}",
                "explanation": f"You eliminated the constant on the left side, but did not perform the balance operation on the right side. The equation must remain balanced on both sides of '='."
            }
        return None

    def _eval_operation_check(self, steps: List[str], config: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Detects wrong inverse operation: e.g. 3x = 12 -> x = 12 - 3 = 9 (subtracting instead of dividing)
        """
        if len(steps) < 2:
            return None
        lhs0, rhs0 = ExpressionParser.split_equation(steps[0])
        lhs1, rhs1 = ExpressionParser.split_equation(steps[1])
        
        p0_l = ExpressionParser.extract_linear_terms(lhs0)
        
        try:
            r0_val = float(rhs0)
            r1_val = float(rhs1)
        except ValueError:
            return None
            
        if p0_l["var_coeff"] != 1.0 and p0_l["var_coeff"] != 0.0 and p0_l["constant"] == 0:
            coeff = p0_l["var_coeff"]
            # Subtracted instead of divided
            subtracted = r0_val - coeff
            if abs(r1_val - subtracted) < 1e-5:
                return {
                    "matched": True,
                    "confidence": 0.95,
                    "what_you_did": f"{steps[0]} → x = {int(subtracted)}",
                    "explanation": f"You subtracted {int(coeff)} instead of dividing by {int(coeff)}. Since {int(coeff)} is multiplying the variable, the inverse operation required is division."
                }
        return None

    def _eval_coefficient_check(self, steps: List[str], config: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Detects multiplying instead of dividing: e.g. 2x = 8 -> x = 16
        """
        if len(steps) < 2:
            return None
        lhs0, rhs0 = ExpressionParser.split_equation(steps[0])
        lhs1, rhs1 = ExpressionParser.split_equation(steps[1])
        p0_l = ExpressionParser.extract_linear_terms(lhs0)
        try:
            r0_val = float(rhs0)
            r1_val = float(rhs1)
        except ValueError:
            return None
            
        if p0_l["var_coeff"] > 1 and p0_l["constant"] == 0:
            multiplied = r0_val * p0_l["var_coeff"]
            if abs(r1_val - multiplied) < 1e-5:
                return {
                    "matched": True,
                    "confidence": 0.95,
                    "what_you_did": f"{steps[0]} → x = {int(multiplied)}",
                    "explanation": f"You multiplied by {int(p0_l['var_coeff'])} instead of dividing. To isolate x, divide both sides by the coefficient."
                }
        return None

    def _eval_sign_check(self, steps: List[str], config: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Detects sign flip failure when moving term: e.g. x + 7 = 15 -> x = 15 + 7 = 22
        """
        if len(steps) < 2:
            return None
        lhs0, rhs0 = ExpressionParser.split_equation(steps[0])
        lhs1, rhs1 = ExpressionParser.split_equation(steps[1])
        p0_l = ExpressionParser.extract_linear_terms(lhs0)
        try:
            r0_val = float(rhs0)
            r1_val = float(rhs1)
        except ValueError:
            return None
            
        if p0_l["constant"] > 0: # was +c
            # Wrong: added instead of subtracted
            if abs(r1_val - (r0_val + p0_l["constant"])) < 1e-5:
                return {
                    "matched": True,
                    "confidence": 0.95,
                    "what_you_did": f"{steps[0]} → x = {int(r0_val + p0_l['constant'])}",
                    "explanation": f"Sign error: You added {int(p0_l['constant'])} instead of subtracting it to cancel positive {int(p0_l['constant'])}."
                }
        return None

    def _eval_exact_wrong_answer(self, student_ans: str, config: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        target_answer = str(config.get("wrong_answer", "")).strip().lower()
        if student_ans == target_answer:
            return {
                "matched": True,
                "confidence": 0.92,
                "what_you_did": f"Final answer: {student_ans}",
                "explanation": config.get("explanation", "Recognized common incorrect outcome.")
            }
        return None

    def _check_arithmetic_slip(self, student_ans: str, correct_ans: str) -> Optional[Dict[str, Any]]:
        try:
            s_val = float(student_ans)
            c_val = float(correct_ans)
            diff = abs(s_val - c_val)
            if 0 < diff <= 2.0:
                return {
                    "what_you_did": f"Final answer: {student_ans} (Expected: {correct_ans})",
                    "explanation": f"Off by {diff:g}: Basic arithmetic computation error near the final solution step."
                }
        except ValueError:
            pass
        return None
