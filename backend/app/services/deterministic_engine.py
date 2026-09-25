"""
Deterministic Knowledge Tracing & Cognitive Engine
Implements Bayesian Knowledge Tracing (BKT) and Ebbinghaus Retention Decay
without stochastic unpredictability.
"""
import math
from typing import Dict, Any

class DeterministicEngine:
    def __init__(
        self,
        default_guess: float = 0.20,
        default_slip: float = 0.10,
        default_transit: float = 0.15,
        default_decay_rate: float = 0.05
    ):
        """
        BKT Parameters:
        - guess (P(G)): Probability of guessing correctly despite not knowing
        - slip (P(S)): Probability of slipping/making a careless error despite knowing
        - transit (P(T)): Probability of learning the concept after an interaction
        - decay_rate: Exponential memory decay constant per day elapsed
        """
        self.default_guess = default_guess
        self.default_slip = default_slip
        self.default_transit = default_transit
        self.default_decay_rate = default_decay_rate

    def update_bkt(
        self,
        prior_mastery: float,
        is_correct: bool,
        guess: float = None,
        slip: float = None,
        transit: float = None
    ) -> float:
        """
        Computes the posterior knowledge state P(L_t) given observation,
        then updates with the transition probability P(T).
        """
        p_l = max(0.01, min(0.99, prior_mastery))
        p_g = guess if guess is not None else self.default_guess
        p_s = slip if slip is not None else self.default_slip
        p_t = transit if transit is not None else self.default_transit

        if is_correct:
            numerator = p_l * (1.0 - p_s)
            denominator = numerator + ((1.0 - p_l) * p_g)
        else:
            numerator = p_l * p_s
            denominator = numerator + ((1.0 - p_l) * (1.0 - p_g))

        if denominator == 0:
            p_posterior = p_l
        else:
            p_posterior = numerator / denominator

        # Knowledge transition step: student may have learned during the item
        p_updated = p_posterior + ((1.0 - p_posterior) * p_t)
        return round(float(max(0.0, min(1.0, p_updated))), 4)

    def apply_retention_decay(
        self,
        current_mastery: float,
        days_elapsed: float,
        decay_rate: float = None
    ) -> float:
        """
        Calculates memory retention decay using Ebbinghaus exponential decay.
        """
        if days_elapsed <= 0:
            return current_mastery
        
        rate = decay_rate if decay_rate is not None else self.default_decay_rate
        decayed = current_mastery * math.exp(-rate * days_elapsed)
        return round(float(max(0.0, min(1.0, decayed))), 4)

    def evaluate_status(self, score: float, attempts: int) -> str:
        """
        Deterministic status taxonomy:
        - unseen: 0 attempts
        - struggling: score < 0.50 and attempts >= 2
        - in_progress: 0.50 <= score < 0.85 (or score < 0.50 with 1 attempt)
        - mastered: score >= 0.85
        """
        if attempts == 0:
            return "unseen"
        if score >= 0.85:
            return "mastered"
        if score < 0.50 and attempts >= 2:
            return "struggling"
        return "in_progress"

    def aggregate_twin_metrics(self, topic_scores: list[float]) -> Dict[str, float]:
        """
        Calculates aggregate twin metrics: overall mastery, cognitive load, and learning pace.
        """
        if not topic_scores:
            return {
                "overall_mastery": 0.0,
                "cognitive_load": 0.2,
                "learning_pace": 1.0
            }

        avg_mastery = sum(topic_scores) / len(topic_scores)
        # Cognitive load is higher when topics are in struggling/unstable range (~0.3 - 0.6)
        variance = sum((s - avg_mastery) ** 2 for s in topic_scores) / len(topic_scores)
        cognitive_load = min(1.0, max(0.1, 0.5 * (1.0 - avg_mastery) + 0.5 * math.sqrt(variance)))
        learning_pace = round(0.5 + avg_mastery * 0.8, 2)

        return {
            "overall_mastery": round(avg_mastery, 4),
            "cognitive_load": round(cognitive_load, 4),
            "learning_pace": learning_pace
        }

deterministic_engine = DeterministicEngine()
