import urllib.request
import json

for uid in ['58424d03-90e1-462c-84e7-bc7f2a50c430', '39d1529c-b003-4756-a8ae-74c806ec3b39']:
    url = f'http://127.0.0.1:8000/api/students/{uid}/twin'
    try:
        with urllib.request.urlopen(url) as resp:
            data = json.loads(resp.read().decode())
            print(f"=== TWIN FOR {uid} ({data.get('student_name')}) ===")
            print("  Chapter:", data.get('chapter_title'))
            print("  Overall Mastery:", data.get('overall_mastery'))
            print("  Skills count:", len(data.get('skills', [])))
            for s in data.get('skills', []):
                print(f"    - {s.get('code')}: mastery={s.get('mastery')} trend={s.get('trend')}")
            print("  Active misconceptions:", len(data.get('active_misconceptions', [])))
    except Exception as e:
        print(f"Error for {uid}: {e}")
