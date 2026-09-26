<p align="center">
  <img src="https://img.shields.io/badge/Team-HACKTRON%20(T29)-blueviolet?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Hackathon-ARGONYX'26-orange?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Stack-FastAPI%20%2B%20React%20%2B%20Vite-00d4ff?style=for-the-badge" />
</p>

# 🧠 Knowledge Twin

> **An AI-powered living model of what a student knows — and what they don't.**

Knowledge Twin is an intelligent diagnostic learning platform that builds a personalised cognitive model (a "twin") for every student. It identifies precise knowledge gaps through deterministic misconception analysis, delivers targeted interventions, and continuously evolves as the student learns.

---

## 📑 Table of Contents

- [Problem Statement](#-problem-statement)
- [Our Solution](#-our-solution)
- [Key Features](#-key-features)
- [Architecture](#-architecture)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [API Reference](#-api-reference)
- [Screenshots](#-screenshots)
- [Team](#-team)

---

## 🎯 Problem Statement

Traditional education treats all students the same — delivering one-size-fits-all content and assessments. Students fall behind silently because:
- Teachers can't track the **exact skill** each student struggles with
- Misconceptions compound over time without targeted correction
- Self-study material has no diagnostic feedback loop
- There is no persistent model of a student's evolving understanding

---

## 💡 Our Solution

**Knowledge Twin** creates a real-time, per-student cognitive profile that:

1. **Diagnoses** — Pinpoints exactly which micro-skills a student has mastered and which contain misconceptions
2. **Intervenes** — Routes the student to precision-targeted remediation based on the specific error pattern detected
3. **Retests** — Validates whether the intervention closed the gap
4. **Evolves** — The "twin" continuously updates mastery scores, decay curves, and skill confidence as the student learns

The result: every student gets a unique learning path. Every teacher gets a live dashboard of class-wide and per-student mastery.

---

## ✨ Key Features

### 🎓 Student Experience
| Feature | Description |
|---|---|
| **Diagnostic Assessments** | Adaptive question sets per chapter; deterministic misconception classification on every response |
| **Knowledge Twin Visualisation** | Interactive skill graph showing mastery levels, misconception patterns, and gap severity |
| **Targeted Interventions** | Auto-routed step-by-step remediation for each detected error pattern |
| **Revision Engine** | Spaced-repetition driven retrieval practice with decay-aware scheduling |
| **Bring Your Own Material** | Upload any PDF — the system extracts skills, generates diagnostic questions, and integrates it into the twin |
| **Progress Tracking** | Real-time activity feed, mastery trends, and streak tracking |
| **Per-Student Data Isolation** | Every student only sees curated curriculum + their own uploaded materials |

### 👨‍🏫 Teacher Experience
| Feature | Description |
|---|---|
| **Class Overview Dashboard** | Aggregate mastery, at-risk student identification, and cohort analytics |
| **Per-Student Drilldown** | Deep-dive into any student's twin, misconception history, and intervention outcomes |
| **Struggling Topics Analysis** | Surface the topics where the most students are failing |
| **Content & Materials Management** | View and manage all uploaded curriculum documents |

### 🔧 Platform Capabilities
| Feature | Description |
|---|---|
| **Deterministic Misconception Engine** | Rule-based pattern matching for 50+ common error patterns across subjects |
| **LLM Escalation Fallback** | When deterministic rules don't match, Gemini API provides intelligent analysis with dual-key failover |
| **Multi-Domain PDF Ingestion** | Automatic domain detection (Physics, CS, Chemistry, Math) with structured skill extraction |
| **Spaced Repetition Scheduler** | SM-2 inspired algorithm with per-skill decay tracking and optimal review timing |
| **Assessment Report Generation** | Detailed post-test reports with per-skill breakdown, misconception tagging, and intervention recommendations |

---

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      FRONTEND (React + Vite)                    │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────────────────┐  │
│  │ LoginView│ │ LearnView│ │ Assess   │ │ Knowledge Twin    │  │
│  │          │ │          │ │ Runner   │ │ Visualisation     │  │
│  └──────────┘ └──────────┘ └──────────┘ └───────────────────┘  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────────────────┐  │
│  │ Revision │ │ Progress │ │ Upload   │ │ Teacher Dashboard │  │
│  │ Engine   │ │ View     │ │ Modal    │ │                   │  │
│  └──────────┘ └──────────┘ └──────────┘ └───────────────────┘  │
│                         API Client                              │
└─────────────────────────┬───────────────────────────────────────┘
                          │ REST API (JSON)
┌─────────────────────────▼───────────────────────────────────────┐
│                     BACKEND (FastAPI + Uvicorn)                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  API Layer: subjects, chapters, assessments, twin,      │    │
│  │  interventions, documents, revision, teacher, admin     │    │
│  └─────────────────────┬───────────────────────────────────┘    │
│  ┌─────────────────────▼───────────────────────────────────┐    │
│  │  Service Layer                                           │    │
│  │  ┌─────────────────┐ ┌──────────────────┐               │    │
│  │  │ Deterministic   │ │ LLM Reasoning    │               │    │
│  │  │ Engine (Rules)  │ │ (Gemini Fallback)│               │    │
│  │  └─────────────────┘ └──────────────────┘               │    │
│  │  ┌─────────────────┐ ┌──────────────────┐               │    │
│  │  │ Mastery Service │ │ Analytics Service│               │    │
│  │  └─────────────────┘ └──────────────────┘               │    │
│  │  ┌─────────────────┐ ┌──────────────────┐               │    │
│  │  │ Intervention    │ │ Document         │               │    │
│  │  │ Service         │ │ Ingestion Service│               │    │
│  │  └─────────────────┘ └──────────────────┘               │    │
│  │  ┌─────────────────┐                                    │    │
│  │  │ Revision Service│                                    │    │
│  │  │ (Spaced Rep.)   │                                    │    │
│  │  └─────────────────┘                                    │    │
│  └─────────────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  Data Layer: SQLAlchemy ORM + SQLite / PostgreSQL        │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, TypeScript 6, Vite 8, Lucide React Icons |
| **Styling** | Custom CSS with glassmorphism, Satoshi font, responsive design |
| **Backend** | Python, FastAPI, Uvicorn, Pydantic v2 |
| **ORM & DB** | SQLAlchemy 2.x, SQLite (dev) / PostgreSQL (prod via Supabase) |
| **PDF Processing** | PyPDF for text extraction, custom domain classifiers |
| **AI / LLM** | Google Gemini API (dual-key failover for reliability) |
| **Math Engine** | SymPy for symbolic mathematics validation |
| **Migrations** | Alembic |
| **Testing** | Pytest |

---

## 📂 Project Structure

```
T29-HACKTRON/
├── backend/
│   ├── app/
│   │   ├── api/                    # REST API route handlers
│   │   │   ├── subjects.py         # Dynamic subject listing
│   │   │   ├── chapters.py         # Chapter CRUD with student isolation
│   │   │   ├── assessments.py      # Diagnostic attempt submission & scoring
│   │   │   ├── twin.py             # Knowledge Twin data assembly
│   │   │   ├── interventions.py    # Misconception-targeted remediation
│   │   │   ├── documents.py        # PDF upload & ingestion pipeline
│   │   │   ├── revision.py         # Spaced repetition scheduling
│   │   │   ├── teacher.py          # Teacher analytics endpoints
│   │   │   ├── admin.py            # System observability & pattern library
│   │   │   └── groups.py           # Student group management
│   │   ├── models/
│   │   │   └── all_models.py       # SQLAlchemy ORM models
│   │   ├── schemas/
│   │   │   └── all_schemas.py      # Pydantic request/response schemas
│   │   ├── services/
│   │   │   ├── deterministic_engine.py  # Rule-based misconception classifier
│   │   │   ├── llm_reasoning.py         # Gemini LLM fallback analyser
│   │   │   ├── mastery_service.py       # Skill mastery computation
│   │   │   ├── analytics_service.py     # Teacher & cohort analytics
│   │   │   ├── intervention_service.py  # Intervention routing & content
│   │   │   ├── document_ingestion.py    # PDF → skills → questions pipeline
│   │   │   └── revision_service.py      # Spaced repetition scheduler
│   │   ├── seed/
│   │   │   └── seed_data.py        # Database initialisation & seed data
│   │   ├── config.py               # App configuration & environment
│   │   ├── database.py             # Database engine & session management
│   │   └── main.py                 # FastAPI app entry point
│   ├── requirements.txt
│   └── run.py                      # Quick-start script
│
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   └── client.ts           # Typed API client for all endpoints
│   │   ├── components/
│   │   │   ├── auth/               # Login & registration views
│   │   │   ├── student/            # StudentHome, LearnView, ProgressView, RevisionEngine
│   │   │   ├── assessment/         # AssessmentView, DiagnosticRunner, PastAttemptReport
│   │   │   ├── twin/               # KnowledgeTwinView, MistakeCardList
│   │   │   ├── intervention/       # InterventionView (targeted remediation)
│   │   │   ├── upload/             # DocumentUploadModal (Bring Your Own Material)
│   │   │   ├── teacher/            # TeacherDashboard
│   │   │   ├── layout/             # Sidebar navigation
│   │   │   ├── landing/            # Landing page
│   │   │   └── account/            # Account settings modal
│   │   ├── services/
│   │   │   └── learningRepository.ts  # Client-side data orchestration
│   │   ├── types/
│   │   │   └── index.ts            # TypeScript type definitions
│   │   ├── App.tsx                 # Root application with routing & state
│   │   ├── index.css               # Global styles (Satoshi font, design system)
│   │   └── main.tsx                # React entry point
│   ├── package.json
│   └── vite.config.ts
│
├── .gitignore
├── .env.example
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- **Python 3.10+**
- **Node.js 18+** and **npm**
- (Optional) PostgreSQL / Supabase for production database

### 1. Clone the Repository

```bash
git clone https://github.com/Argonyx-26/T29-HACKTRON.git
cd T29-HACKTRON
```

### 2. Backend Setup

```bash
# Create and activate virtual environment
python -m venv venv

# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate

# Install dependencies
pip install -r backend/requirements.txt
```

### 3. Environment Configuration

Create a `.env` file in the project root (refer to `backend/.env.example`):

```env
# Database (leave empty for SQLite, or set a Supabase/Postgres URL)
DATABASE_URL=

# Google Gemini API Keys (for LLM-powered misconception analysis)
GEMINI_API_KEY_PRIMARY=your_primary_key
GEMINI_API_KEY_SECONDARY=your_secondary_key
```

### 4. Start the Backend

```bash
cd backend
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

The API will be available at `http://127.0.0.1:8000` with interactive docs at `/docs`.

> **Note:** The database is auto-initialised and seeded on first run — no manual migrations needed.

### 5. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The frontend will be available at `http://localhost:5173` and proxies API requests to the backend.

---

## 📡 API Reference

All endpoints are prefixed with `/api`. Full interactive documentation is available at `/docs` when the backend is running.

### Core Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/subjects` | List all subjects (supports `?student_id=` for isolation) |
| `GET` | `/api/subjects/{id}/chapters` | List chapters for a subject |
| `GET` | `/api/chapters` | List all chapters (supports `?student_id=` for isolation) |
| `GET` | `/api/chapters/{id}` | Get chapter detail with skills |
| `GET` | `/api/chapters/{id}/questions` | Get diagnostic questions for a chapter |
| `POST` | `/api/attempts/submit` | Submit a student answer for diagnostic analysis |
| `GET` | `/api/students/{id}/twin` | Get the Knowledge Twin for a student |
| `POST` | `/api/interventions/route` | Route to targeted intervention for a misconception |
| `POST` | `/api/interventions/retest` | Submit retest after intervention |
| `GET` | `/api/revision/{student_id}` | Get spaced-repetition revision schedule |
| `POST` | `/api/revision/practice` | Submit retrieval practice answers |
| `POST` | `/api/documents/upload` | Upload a PDF for skill extraction |
| `POST` | `/api/documents/{id}/parse` | Parse and extract learning content |
| `GET` | `/api/assessments/reports` | Get assessment reports for a student |
| `GET` | `/api/teacher/overview` | Teacher dashboard analytics |
| `GET` | `/api/teacher/cohort` | Per-student cohort breakdown |
| `GET` | `/api/health` | Health check |

---

## 📸 Screenshots

> _Screenshots of the live application showcasing the student dashboard, Knowledge Twin visualisation, diagnostic runner, teacher dashboard, and PDF upload flow._

---

## 👥 Team

**Team HACKTRON (T29)** — RVU ARGONYX'26 Hackathon

---

## 📄 License

This project was built for the **ARGONYX'26 Hackathon** at RV University.

---

<p align="center">
  <b>Built with ❤️ by Team HACKTRON</b>
</p>
