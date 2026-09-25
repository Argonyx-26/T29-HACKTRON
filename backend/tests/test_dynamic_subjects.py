from app.database import SessionLocal
from app.seed.seed_data import init_db, seed_database
from app.api.subjects import list_subjects, list_subject_chapters

def test_dynamic_subjects_api():
    """
    Verifies that the /api/subjects endpoint dynamically discovers all seeded subjects
    (Mathematics, Physics, Chemistry) and their chapters directly from the database.
    """
    init_db()
    seed_database()
    db = SessionLocal()
    try:
        subjects = list_subjects(db)
        subject_names = [s["name"] for s in subjects]
        
        # Verify initial seeded subjects are returned
        assert "Mathematics" in subject_names
        assert "Physics" in subject_names
        assert "Chemistry" in subject_names

        # Verify dynamic chapter listing for Mathematics
        math_chapters = list_subject_chapters("mathematics", db)
        assert len(math_chapters) >= 1
        assert any("Linear Equations" in c["title"] for c in math_chapters)

        # Verify dynamic chapter listing for Physics
        physics_chapters = list_subject_chapters("physics", db)
        assert len(physics_chapters) >= 1
        assert any("Current Electricity" in c["title"] for c in physics_chapters)

        # Verify dynamic chapter listing for Chemistry
        chem_chapters = list_subject_chapters("chemistry", db)
        assert len(chem_chapters) >= 1
        assert any("Chemical Reactions" in c["title"] for c in chem_chapters)
    finally:
        db.close()
