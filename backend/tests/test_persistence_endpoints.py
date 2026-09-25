def test_root_and_health_endpoints(client):
    r_root = client.get("/")
    assert r_root.status_code == 200
    assert r_root.json()["status"] == "online"

    r_health = client.get("/health")
    assert r_health.status_code == 200
    assert r_health.json()["status"] == "ok"

def test_full_system_flow_with_endpoints(client):
    # 1. Seed Cohort Data
    seed_res = client.post("/api/admin/seed")
    assert seed_res.status_code == 200

    # 2. Query Teacher Cohort
    cohort_res = client.get("/api/teacher/cohort")
    assert cohort_res.status_code == 200
    students = cohort_res.json()
    assert len(students) >= 5
    first_student_id = students[0]["student_id"]

    # 3. Query Student Knowledge Twin
    twin_res = client.get(f"/api/twin/{first_student_id}")
    assert twin_res.status_code == 200
    twin_data = twin_res.json()
    assert "overall_mastery" in twin_data
    assert "topic_masteries" in twin_data

    # 4. Query Knowledge Graph
    graph_res = client.get(f"/api/twin/{first_student_id}/graph")
    assert graph_res.status_code == 200
    graph_data = graph_res.json()
    assert len(graph_data["nodes"]) > 0

    # 5. Trigger Intervention Generation
    gen_res = client.post("/api/interventions/generate")
    assert gen_res.status_code == 200

    # 6. List Interventions
    interv_res = client.get("/api/interventions")
    assert interv_res.status_code == 200
    interventions = interv_res.json()
    assert len(interventions) >= 1

    # 7. Check Teacher Overview
    overview_res = client.get("/api/teacher/overview")
    assert overview_res.status_code == 200
    overview_data = overview_res.json()
    assert overview_data["total_students"] >= 5
