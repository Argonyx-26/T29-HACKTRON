import glob
import os
import sqlite3

conn = sqlite3.connect('backend/knowledge_twin.db')
cur = conn.cursor()
print('=== SHARED DB STUDENTS ===')
cur.execute('SELECT id, name, email FROM students')
for row in cur.fetchall():
    print(row)

print('\n=== SHARED DB ATTEMPTS BY STUDENT ===')
cur.execute('SELECT student_id, COUNT(*) FROM attempts GROUP BY student_id')
for row in cur.fetchall():
    print(row)

print('\n=== SHARED DB REPORTS BY STUDENT ===')
cur.execute('SELECT id, student_id, chapter_title, score_percent, created_at FROM assessment_reports')
for row in cur.fetchall():
    print(row)
conn.close()

print('\n=== PER-STUDENT DBS ===')
for p in glob.glob('backend/students/*.db'):
    c = sqlite3.connect(p)
    cr = c.cursor()
    cr.execute("SELECT name FROM sqlite_master WHERE type='table'")
    tables = [r[0] for r in cr.fetchall()]
    s = cr.execute('SELECT id, name FROM students').fetchall() if 'students' in tables else []
    a = cr.execute('SELECT COUNT(*) FROM attempts').fetchone()[0] if 'attempts' in tables else 0
    r = cr.execute('SELECT COUNT(*) FROM assessment_reports').fetchone()[0] if 'assessment_reports' in tables else 0
    print(f'{os.path.basename(p)}: students={s}, attempts={a}, reports={r}')
    c.close()
