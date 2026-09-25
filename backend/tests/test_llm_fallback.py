from app.services.llm_reasoning import llm_reasoning_service

def test_llm_fallback_diagnosis():
    # Calling diagnosis without LLM keys should seamlessly produce deterministic output
    student_name = "Charlie Davis"
    overall_mastery = 0.35
    struggling_topics = [
        {"title": "2D Projectile Motion", "score": 0.28},
        {"title": "Friction & Drag Forces", "score": 0.30}
    ]
    mastered_topics = []

    diagnosis = llm_reasoning_service.generate_twin_diagnosis(
        student_name=student_name,
        overall_mastery=overall_mastery,
        struggling_topics=struggling_topics,
        mastered_topics=mastered_topics
    )

    assert diagnosis["source"] == "deterministic_fallback"
    assert diagnosis["student_name"] == student_name
    assert "Charlie Davis" in diagnosis["summary"]
    assert "bottlenecks" in diagnosis["summary"] or "gaps" in diagnosis["summary"]
    assert len(diagnosis["priority_focus"]) > 0

def test_llm_fallback_high_mastery():
    student_name = "Alice Zhang"
    overall_mastery = 0.92
    struggling_topics = []
    mastered_topics = [
        {"title": "Vector Decomposition", "score": 0.95},
        {"title": "Newton's Laws", "score": 0.90}
    ]

    diagnosis = llm_reasoning_service.generate_twin_diagnosis(
        student_name=student_name,
        overall_mastery=overall_mastery,
        struggling_topics=struggling_topics,
        mastered_topics=mastered_topics
    )

    assert diagnosis["source"] == "deterministic_fallback"
    assert "exceptional" in diagnosis["summary"].lower()

def test_llm_fallback_misconception():
    explanation = llm_reasoning_service.explain_misconception(
        topic_title="2D Projectile Motion",
        score=0.25,
        attempts=4
    )
    assert explanation["source"] == "deterministic_fallback"
    assert explanation["attempts"] == 4
    assert "prerequisite" in explanation["diagnosis"].lower()
