def test_create_and_query_subject_hierarchy(client):
    # 1. Create Subject
    subject_payload = {
        "code": "CHEM-101",
        "name": "General Chemistry",
        "description": "Atomic theory, bonding, and stoichiometry.",
        "grade_level": "Grade 11"
    }
    resp = client.post("/api/subjects", json=subject_payload)
    assert resp.status_code == 201
    subj_data = resp.json()
    subject_id = subj_data["id"]
    assert subj_data["code"] == "CHEM-101"

    # 2. Create Chapter
    chapter_payload = {
        "subject_id": subject_id,
        "title": "Atomic Structure",
        "order_num": 1,
        "description": "Electrons, protons, and quantum numbers."
    }
    resp = client.post("/api/chapters", json=chapter_payload)
    assert resp.status_code == 201
    chap_data = resp.json()
    chapter_id = chap_data["id"]

    # 3. Create Topics
    topic1_payload = {
        "chapter_id": chapter_id,
        "code": "CHEM-T01",
        "title": "Subatomic Particles",
        "difficulty": 0.3,
        "prerequisite_topic_ids": []
    }
    resp = client.post("/api/chapters/topics", json=topic1_payload)
    assert resp.status_code == 201
    t1_id = resp.json()["id"]

    topic2_payload = {
        "chapter_id": chapter_id,
        "code": "CHEM-T02",
        "title": "Electron Configurations",
        "difficulty": 0.5,
        "prerequisite_topic_ids": [t1_id]
    }
    resp = client.post("/api/chapters/topics", json=topic2_payload)
    assert resp.status_code == 201
    assert t1_id in resp.json()["prerequisite_topic_ids"]

    # 4. Fetch subject detail
    detail_resp = client.get(f"/api/subjects/{subject_id}")
    assert detail_resp.status_code == 200
    detail_data = detail_resp.json()
    assert len(detail_data["chapters"]) == 1
    assert len(detail_data["chapters"][0]["topics"]) == 2
