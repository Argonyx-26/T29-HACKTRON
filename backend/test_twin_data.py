import urllib.request
import json

test_ids = [
    ('58424d03-90e1-462c-84e7-bc7f2a50c430', 'Ankush'),
    ('39d1529c-b003-4756-a8ae-74c806ec3b39', 'Harshit'),
    ('test_fresh_student', 'Brand New Student')
]

for uid, name in test_ids:
    url = f'http://127.0.0.1:8000/api/students/{uid}/twin'
    try:
        with urllib.request.urlopen(url) as resp:
            data = json.loads(resp.read().decode())
            print(f"=== TWIN FOR {name} ({uid}) ===")
            print("  Student Name:", data.get('student_name'))
            print("  Subject:", data.get('current_subject'))
            print("  Chapter:", data.get('current_chapter_title'))
            print("  Overall Mastery:", data.get('overall_mastery'))
            print("  Skills count:", len(data.get('skills', [])))
            for s in data.get('skills', []):
                print(f"    - {s.get('skill_code')}: {s.get('skill_name')} (count={s.get('evidence_count')})")
            print("  Next Best Action:", data.get('next_best_action', {}).get('title'))
    except Exception as e:
        print(f"Error for {name} ({uid}): {e}")
