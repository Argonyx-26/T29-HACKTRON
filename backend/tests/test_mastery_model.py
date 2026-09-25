from app.services.mastery_service import BayesianKnowledgeTracing, MasteryService

def test_bkt_correct_increases_mastery():
    prior = 0.30
    new_p = BayesianKnowledgeTracing.update_mastery(prior, is_correct=True)
    assert new_p > prior
    # With prior 0.3, guess 0.15, slip 0.10, transit 0.20, posterior should be higher
    assert new_p >= 0.50

def test_bkt_incorrect_decreases_or_damps_mastery():
    prior = 0.70
    new_p = BayesianKnowledgeTracing.update_mastery(prior, is_correct=False)
    assert new_p < prior

def test_confidence_calculation():
    zero_conf = MasteryService.calculate_confidence(0)
    assert zero_conf["confidence"] == 0.0
    assert zero_conf["label"] == "Not yet assessed"

    low_conf = MasteryService.calculate_confidence(1)
    assert low_conf["confidence"] == 0.25
    assert low_conf["label"] == "Low"

    mod_conf = MasteryService.calculate_confidence(2)
    assert mod_conf["confidence"] == 0.50
    assert mod_conf["label"] == "Moderate"

    high_conf = MasteryService.calculate_confidence(4)
    assert high_conf["confidence"] == 1.0
    assert high_conf["label"] == "High"
