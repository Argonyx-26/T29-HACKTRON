import pytest
from app.services.deterministic_engine import deterministic_engine

def test_bkt_correct_answer_increases_mastery():
    prior = 0.40
    updated = deterministic_engine.update_bkt(prior_mastery=prior, is_correct=True)
    assert updated > prior
    assert updated <= 1.0

def test_bkt_incorrect_answer_decreases_mastery():
    prior = 0.70
    updated = deterministic_engine.update_bkt(prior_mastery=prior, is_correct=False)
    assert updated < prior
    assert updated >= 0.0

def test_retention_decay_ebbinghaus():
    initial = 0.85
    # 0 days elapsed -> no decay
    assert deterministic_engine.apply_retention_decay(initial, days_elapsed=0) == initial
    
    # 10 days elapsed -> decayed
    decayed_10 = deterministic_engine.apply_retention_decay(initial, days_elapsed=10)
    assert decayed_10 < initial

    # 30 days elapsed -> further decayed
    decayed_30 = deterministic_engine.apply_retention_decay(initial, days_elapsed=30)
    assert decayed_30 < decayed_10

def test_evaluate_status():
    assert deterministic_engine.evaluate_status(score=0.90, attempts=3) == "mastered"
    assert deterministic_engine.evaluate_status(score=0.30, attempts=3) == "struggling"
    assert deterministic_engine.evaluate_status(score=0.70, attempts=2) == "in_progress"
    assert deterministic_engine.evaluate_status(score=0.0, attempts=0) == "unseen"

def test_aggregate_twin_metrics():
    scores = [0.90, 0.85, 0.80]
    metrics = deterministic_engine.aggregate_twin_metrics(scores)
    assert 0.80 <= metrics["overall_mastery"] <= 0.90
    assert 0.0 <= metrics["cognitive_load"] <= 1.0
    assert metrics["learning_pace"] > 1.0
