# 🎓 EduPulse – AI-Powered Holistic Student Development & Vision Collaboration Platform

Transforming education from reactive to proactive through Artificial Intelligence.

**EduPulse** is an AI-powered student development ecosystem designed to help schools monitor, support, and improve every student's academic, personal, and extracurricular growth. Instead of focusing only on marks, EduPulse provides a holistic view of student development while automating verification using Computer Vision facial vector embeddings and strengthening collaboration between students, teachers, parents, and school administrators.

---

## 🚀 Vision

Traditional school systems primarily react after problems occur—poor marks, absenteeism, missed assignments, or behavioral issues.

EduPulse changes this by using AI to identify risks early, balance academic workload, monitor learning progress, automate anti-proxy verification, and support personalized student growth before issues become critical.

---

## 🌟 Flagship AI Features

### 📸 1. AI Vision CV Verification & Vector DB Engine
Automates student verification directly from the Student Dashboard using live camera stream scanning and vector embeddings:
- **Real-Time Webcam Scanner**: Captures live video stream frames with pose guidance overlays.
- **10-Snapshot Multi-Angle Registration**: Collects guided pose snapshots (*Center, Left, Right, Tilt Up/Down*) to index multi-vector sample clusters.
- **Dedicated Vector DB (`VectorDB`)**: Fast Cosine Similarity nearest-neighbor search ($\max_{v \in \text{samples}} \frac{q \cdot v}{\|q\| \|v\|}$) using OpenCV CLAHE lighting equalization and 4x4 spatial grid feature extraction.
- **Anti-Proxy Account Binding**: Binds face vectors strictly to active logged-in student accounts. Blocks cross-account proxy scans automatically.

### 🧠 2. AI Workload Intelligence System
- Predicts student workload before assignments are published.
- Detects assignment overload across subjects and helps teachers distribute deadlines fairly.
- Reduces student stress and burnout.

### 📈 3. Holistic Student Growth Passport
A living profile that continuously tracks:
- Academic Progress & Learning Trends
- Verification Consistency
- Leadership & Communication
- Creativity, Sports & Arts
- Extracurricular Activities & Achievements
- Wellness Indicators

### 📚 4. Learning Health Index (LHI)
Measures actual learning instead of examination scores by tracking Concept Mastery, Assignment Performance, Quiz Results, Weak Topics, and Submission Consistency.

### 🚨 5. Invisible Student Radar
Detects students who may be silently disengaging using AI by monitoring attendance trends, assignment completion, academic performance, and wellness indicators.

---

## 👥 User Roles

### 👨‍🎓 Student
- Personalized Dashboard & Learning Health Index
- AI Vision Camera Verification & Pose Registration
- AI Study Planner & Workload Analytics
- Class Timetable, Assignments & Resources
- Anonymous Doubt Portal with AI Preliminary Hints
- Personalized Opportunity Recommendations

### 👩‍🏫 Teacher
- Classroom Health Dashboard
- Student Performance & Risk Analytics
- Assignment Creation & Grading
- Learning Resource Upload to Supabase Storage
- Timetable & Doubt Management

### 👨‍👩‍👧 Parent
- Child Growth Passport Dashboard
- Academic Progress & Verification Tracking
- Wellness Overview & AI Parent Coach
- School Bus Tracking & Parent-Teacher Collaboration

### 🏫 Administrator
- School-Wide Analytics & System Administration
- Student, Teacher, Parent & Class Management
- Subject Allocation & Timetable Publishing
- Schema & Notification Oversight

---

## 💡 Key Features
- AI Workload Prediction & Stress Mitigation
- Vision Computer Vision Verification Engine
- Holistic Student Passport & 5-Axis Growth Radar
- Learning Health Analytics & Early Warning Detection
- Student Progress Monitoring & Invisible Student Radar
- Teacher Analytics & Assignment Distribution
- Parent Collaboration & AI Parent Coach
- Learning Resource Management with Supabase Storage
- Interactive Class Timetable
- School Bus Live Tracking
- In-App Notifications
- Role-Based Authentication (RBAC) & Supabase edupulse Schema Isolation

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend UI** | Next.js 16 (App Router, Turbopack), React 19, TypeScript, Tailwind CSS, Lucide Icons |
| **Backend API** | Python 3.10, FastAPI, SQLAlchemy (Strict Supabase `edupulse` schema), Pydantic v2, JWT Security |
| **Vision & AI Engine** | PyTorch 2.5, OpenCV 4.13 (CLAHE Equalization, 4x4 Spatial Grid Extraction), Custom `VectorDB` (Cosine Similarity) |
| **Database & Storage** | Supabase PostgreSQL (`edupulse` schema), Supabase Storage, SQLite Vector Cache |
| **AI LLM Engine** | Groq Cloud API (`llama-3.3-70b-versatile`), Google Gemini AI |

---

## 📂 Project Structure

```text
EduPulse/
├── docs/images/                # Documentation & Screenshot Assets
│   ├── ai_attendance_scanner.png
│   ├── registration_lock.png
│   ├── student_dashboard.png
│   └── student_profile.png
├── frontend/                   # Next.js 16 Web Frontend Application
│   ├── app/                    # App Router Pages ((dashboard), student/attendance, etc.)
│   ├── components/             # Reusable UI Components
│   └── lib/                    # API Clients & Utilities
├── backend/                    # FastAPI REST API Server
│   ├── app/
│   │   ├── auth/               # JWT Auth & Security
│   │   ├── core/               # Database Engine (Supabase edupulse schema)
│   │   └── modules/            # Student, Teacher, Parent, AI modules
│   └── run_backend.py          # Windows Selector Loop Backend Entrypoint
├── vision/                     # Computer Vision & Vector Database Service
│   ├── vision/app/
│   │   ├── ai/                 # FaceService & Feature Extractors
│   │   ├── database/           # VectorDB & SQLite Logger
│   │   └── main.py             # Vision FastAPI Server
│   └── vector_store/           # Persistent Vector JSON & SQLite Storage
└── README.md                   # Project Documentation
```

---

## 🧩 Architecture

```text
       Students              Teachers               Parents            Administrators
          │                     │                      │                     │
          └─────────────────────┴──────────┬───────────┴─────────────────────┘
                                           │
                                           ▼
                                ┌────────────────────┐
                                │ Next.js 16 Frontend│
                                │  (localhost:3000)  │
                                └──────────┬─────────┘
                                           │
                    ┌──────────────────────┴──────────────────────┐
                    ▼                                             ▼
      ┌───────────────────────────┐                 ┌───────────────────────────┐
      │   EduPulse Backend API    │                 │  Vision CV & Vector DB    │
      │   FastAPI (localhost:8000)│                 │  FastAPI (localhost:8001) │
      └─────────────┬─────────────┘                 └─────────────┬─────────────┘
                    │                                             │
                    ▼                                             ▼
      ┌───────────────────────────┐                 ┌───────────────────────────┐
      │ Supabase PostgreSQL DB    │                 │ SQLite Vector Store       │
      │ (Strict 'edupulse' Schema)│                 │ (face_vectors.json & DB)  │
      └───────────────────────────┘                 └───────────────────────────┘
```

---

## 🚀 Quick Start Guide

### Step 1: Install Dependencies

#### Backend & Vision:
```bash
pip install fastapi uvicorn torchvision torch opencv-python numpy aiosqlite psycopg[binary] python-jose passlib pillow
```

#### Frontend:
```bash
cd frontend
npm install
cd ..
```

---

### Step 2: Configure Environment Files

Create `backend/.env`:
```env
APP_NAME=EduPulse
APP_ENV=development
DEBUG=true
SECRET_KEY=edupulse_jwt_secret_key_super_secret_2026
DATA_SOURCE=real
USE_MOCK=false
DATABASE_URL=postgresql://postgres:your_password@db.czteldsmpnmrukavctyc.supabase.co:5432/postgres?sslmode=require
SUPABASE_URL=https://czteldsmpnmrukavctyc.supabase.co
GROQ_API_KEY=your_groq_cloud_api_key_here
GROQ_MODEL=llama-3.3-70b-versatile
```

Create `frontend/.env.local`:
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api/v1
NEXT_PUBLIC_VISION_API_BASE_URL=http://localhost:8001
```

---

### Step 3: Launch Services

Run in 3 separate terminal sessions:

#### Terminal 1: Vision CV Server (Port 8001)
```bash
python -m uvicorn vision.app.main:app --port 8001 --host 0.0.0.0
```

#### Terminal 2: EduPulse Backend API Server (Port 8000)
```bash
cd backend
python run_backend.py
```

#### Terminal 3: Next.js Frontend (Port 3000)
```bash
cd frontend
npm run dev
```

---

## 🔑 Demo Access Credentials

All accounts use password: **`password`**

| Role | Email Address | Password |
|---|---|---|
| **Student** | `rahul.b@edupulse.edu` | `password` |
| **Demo Student** | `demo_stu@gmail.com` | `password` |
| **Teacher** | `david.miller@teacher.edupulse.edu` | `password` |
| **Parent** | `sarah.b@parent.edupulse.edu` | `password` |

---

## 🔐 Security

EduPulse follows secure development practices including:
- JWT-based Authentication
- Anti-Proxy Face Vector Account Binding Security
- Role-Based Access Control (RBAC)
- Strict Supabase `edupulse` PostgreSQL Schema Isolation
- Environment Variable Configuration

---

## 🤝 Contributors

Developed as part of an AI-powered Smart School innovation project.

---

## 📜 License

This project is intended for educational, research, and innovation purposes.

⭐ **EduPulse** — Empowering schools with AI to build healthier learning environments, stronger collaboration, and holistic student success.
