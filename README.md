# 🚀 EduPulse — AI-Powered Holistic Student Development & Vision CV Attendance System

![EduPulse Banner](https://img.shields.io/badge/EduPulse-v2.0-5e6ad2?style=for-the-badge&logo=react)
![Next.js](https://img.shields.io/badge/Next.js-16.2-black?style=for-the-badge&logo=nextdotjs)
![FastAPI](https://img.shields.io/badge/FastAPI-0.140-009688?style=for-the-badge&logo=fastapi)
![PyTorch](https://img.shields.io/badge/PyTorch-2.5-EE4C2C?style=for-the-badge&logo=pytorch)
![OpenCV](https://img.shields.io/badge/OpenCV-4.13-5C3EE8?style=for-the-badge&logo=opencv)
![VectorDB](https://img.shields.io/badge/Vector_DB-Cosine_Search-008080?style=for-the-badge)

**EduPulse** is an end-to-end AI-powered educational ecosystem designed to monitor student learning health, track workload stress, provide personalized AI study recommendations, and automate attendance verification using computer vision facial embeddings and a custom Vector Database.

---

## 📸 Integrated AI Attendance System with Camera & Vector DB

EduPulse features a state-of-the-art **Computer Vision AI Attendance Engine** integrated directly into the Student Dashboard. Using live camera stream scanning, normalized vector embeddings, and real-time similarity search, it automates attendance verification while preventing proxy attendance.

### 🌟 Key AI Attendance Features

1. **📷 Real-Time Live Webcam Scanner**:
   - Integrated HTML5 video scanner running live frame capture at 30 FPS.
   - Built-in pose guidance overlay instructing students through 10 multi-angle pose snapshots (*Center, Left, Right, Tilt Up, Tilt Down*).

2. **🧠 Multi-Sample Centroid Vector DB (`VectorDB`)**:
   - Computes normalized 128-dimensional facial feature vectors using OpenCV CLAHE lighting equalization and 4x4 spatial grid extraction.
   - Indexes both multi-angle sample clusters and profile centroid vectors using Cosine Similarity Nearest-Neighbor search:
     $$\text{Similarity Score} = \max_{v \in \text{samples}} \frac{q \cdot v}{\|q\| \|v\|}$$

3. **🔒 Anti-Proxy Account Binding Security**:
   - **Account Lock**: Once a face is registered under Account A, it is cryptographically locked to that student ID.
   - **Cross-Account Fraud Prevention**: If Student 1 attempts to scan their face while logged into Account B, the system flags a **Security Alert** and blocks attendance marking.

4. **⚡ Double-Registration Protection**:
   - Prevents duplicate registrations. Registered students are immediately locked to verification mode.

---

## 🖼️ Application Screenshot Showcase

### 1. 📸 Live AI Camera Scanner & Pose Registration
![AI Attendance Live Camera Scanner](docs/images/ai_attendance_scanner.png)
*Interactive live camera scanner capturing multi-angle pose snapshots for vector embedding indexing.*

---

### 2. 🔒 Registration Lock & Anti-Proxy Security Alert
![Registration Lock & Security Prompt](docs/images/registration_lock.png)
*Account binding lock ensuring one face profile per student account and blocking proxy scans.*

---

### 3. 📊 Student Dashboard Overview
![Student Dashboard Overview](docs/images/student_dashboard.png)
*Real-time Learning Health Index, Workload Pressure Radar, and AI Recommendations.*

---

### 4. 👤 Student Profile & Academic Progress
![Student Profile & Progress](docs/images/student_profile.png)
*Comprehensive student details, guardian info, and class performance tracking.*

---

## ✨ System Architecture

```
                               ┌────────────────────────┐
                               │  Next.js 16 Frontend   │
                               │   (localhost:3000)     │
                               └───────────┬────────────┘
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

| Component | Technology |
|---|---|
| **Frontend UI** | Next.js 16 (App Router, Turbopack), React 19, Tailwind CSS, Lucide Icons |
| **Backend API** | Python 3.10, FastAPI, SQLAlchemy (Strict `edupulse` schema), Groq Cloud AI |
| **Vision & AI Engine** | PyTorch 2.5, OpenCV 4.13 (CLAHE Equalization, Spatial Grid Feature Extraction) |
| **Vector Database** | Dedicated `VectorDB` Engine with Cosine Distance Similarity Indexing |

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

## 🚀 Quick Start Guide

### Step 1: Install Dependencies

#### Backend & Vision Dependencies:
```bash
pip install fastapi uvicorn torchvision torch opencv-python numpy aiosqlite psycopg[binary] python-jose passlib pillow
```

#### Frontend Dependencies:
```bash
cd frontend
npm install
cd ..
```

---

### Step 2: Environment Configuration

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

### Step 3: Launch All 3 Services

Run the following in 3 separate terminal sessions:

#### Terminal 1: Vision CV & Vector DB Server (Port 8001)
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

## 🌐 Application URLs

- 📱 **Web Application**: [http://localhost:3000](http://localhost:3000)
- 📸 **AI Attendance Page**: [http://localhost:3000/student/attendance](http://localhost:3000/student/attendance)
- ⚙️ **Backend REST API**: [http://localhost:8000](http://localhost:8000)
- 👁️ **Vision CV API**: [http://localhost:8001](http://localhost:8001)
