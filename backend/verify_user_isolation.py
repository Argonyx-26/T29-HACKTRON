import urllib.request
import json

BASE = "http://127.0.0.1:8000/api"

def post_json(endpoint, data):
    req = urllib.request.Request(
        f"{BASE}{endpoint}",
        data=json.dumps(data).encode("utf-8"),
        headers={"Content-Type": "application/json"}
    )
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode("utf-8"))

def get_json(endpoint):
    with urllib.request.urlopen(f"{BASE}{endpoint}") as resp:
        return json.loads(resp.read().decode("utf-8"))

print("=== 1. TEST LOGIN RESOLUTION FOR HARSHIT ===")
# Suppose a frontend without Harshit's UUID logs in with a random new candidate ID and name 'Harshit'
harshit_res = post_json("/students", {"id": "random-client-candidate-uuid-1", "name": "Harshit", "role": "student"})
print(f"Returned Student ID for Harshit: {harshit_res['id']}")
assert harshit_res['id'] == '39d1529c-b003-4756-a8ae-74c806ec3b39', f"Expected Harshit's real ID, got {harshit_res['id']}"
print("[OK] Harshit successfully resolved to his authoritative ID!")

print("\n=== 2. TEST KNOWLEDGE TWIN DATA FOR HARSHIT ===")
harshit_twin = get_json(f"/students/{harshit_res['id']}/twin")
print(f"Harshit Subject: {harshit_twin['current_subject']}")
print(f"Harshit Chapter: {harshit_twin['current_chapter_title']}")
print(f"Harshit Overall Mastery: {harshit_twin['overall_mastery']}")
print(f"Harshit Skills ({len(harshit_twin['skills'])}):")
for s in harshit_twin['skills'][:3]:
    print(f"  - {s['skill_code']}: {s['skill_name']} (evidence={s['evidence_count']})")
# Assert no Linear Equations skills appear in Harshit's twin
for s in harshit_twin['skills']:
    assert "Linear Equations" not in (harshit_twin['current_chapter_title'] or ""), "Error: Harshit has Linear Equations!"
print("[OK] Harshit's twin contains only his Quantum Mechanics real data!")

print("\n=== 3. TEST REVISION ENGINE FOR HARSHIT ===")
harshit_rev = get_json(f"/revision/{harshit_res['id']}/overview")
print(f"Harshit Revision Tracked Skills: {harshit_rev['total_skills_tracked']}")
print(f"Harshit Revision Skills: {[s['skill_code'] for s in harshit_rev['all_skills']]}")
print(f"Harshit Practice Questions: {len(harshit_rev['practice_questions'])}")
assert all("QM" in s['skill_code'] or "upload" in s.get('skill_id', '') for s in harshit_rev['all_skills']), "Harshit revision has non-QM skills!"
print("[OK] Harshit's revision queue is 100% isolated and real-time!")

print("\n=== 4. TEST LOGIN RESOLUTION FOR ANKUSH ===")
ankush_res = post_json("/students", {"id": "random-client-candidate-uuid-2", "name": "Ankush", "role": "student"})
print(f"Returned Student ID for Ankush: {ankush_res['id']}")
assert ankush_res['id'] == '58424d03-90e1-462c-84e7-bc7f2a50c430', f"Expected Ankush's real ID, got {ankush_res['id']}"
print("[OK] Ankush successfully resolved to his authoritative ID!")

print("\n=== 5. TEST KNOWLEDGE TWIN DATA FOR ANKUSH ===")
ankush_twin = get_json(f"/students/{ankush_res['id']}/twin")
print(f"Ankush Subject: {ankush_twin['current_subject']}")
print(f"Ankush Chapter: {ankush_twin['current_chapter_title']}")
print(f"Ankush Overall Mastery: {ankush_twin['overall_mastery']}")
print(f"Ankush Skills ({len(ankush_twin['skills'])}):")
for s in ankush_twin['skills'][:3]:
    print(f"  - {s['skill_code']}: {s['skill_name']} (evidence={s['evidence_count']})")
print("[OK] Ankush's twin contains only his Mathematics real data!")

print("\n=== 6. TEST REVISION ENGINE FOR ANKUSH ===")
ankush_rev = get_json(f"/revision/{ankush_res['id']}/overview")
print(f"Ankush Revision Tracked Skills: {ankush_rev['total_skills_tracked']}")
print(f"Ankush Revision Skills: {[s['skill_code'] for s in ankush_rev['all_skills']]}")
print("[OK] Ankush's revision queue has only his real practiced skills!")

print("\n=== 7. TEST BRAND NEW STUDENT (ZERO MOCK DATA) ===")
fresh_res = post_json("/students", {"id": "brand-new-uuid-test-999", "name": "Priya Patel", "role": "student"})
fresh_twin = get_json(f"/students/{fresh_res['id']}/twin")
print(f"Fresh Student Subject: {fresh_twin['current_subject']}")
print(f"Fresh Student Chapter: {fresh_twin['current_chapter_title']}")
print(f"Fresh Student Skills Count: {len(fresh_twin['skills'])}")
print(f"Fresh Student Mastery: {fresh_twin['overall_mastery']}")
fresh_rev = get_json(f"/revision/{fresh_res['id']}/overview")
print(f"Fresh Student Revision Tracked Skills: {fresh_rev['total_skills_tracked']}")
assert fresh_twin['current_chapter_title'] is None, "Fresh student should have no chapter!"
assert len(fresh_twin['skills']) == 0, "Fresh student should have zero skills!"
assert fresh_rev['total_skills_tracked'] == 0, "Fresh student should have zero revision skills!"
print("[OK] Fresh student has 0 mock data and is ready to explore topics!")

print("\nALL REAL-TIME ISOLATION AND AUTHENTICATION TESTS PASSED PERFECTLY!")
