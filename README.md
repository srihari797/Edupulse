# 🚀 EduPulse — AI-Powered Holistic Student Development & Vision CV Attendance System

![EduPulse Banner](https://img.shields.io/badge/EduPulse-v2.0-5e6ad2?style=for-the-badge&logo=react)
![Next.js](https://img.shields.io/badge/Next.js-16.2-black?style=for-the-badge&logo=nextdotjs)
![FastAPI](https://img.shields.io/badge/FastAPI-0.140-009688?style=for-the-badge&logo=fastapi)
![PyTorch](https://img.shields.io/badge/PyTorch-2.5-EE4C2C?style=for-the-badge&logo=pytorch)
![OpenCV](https://img.shields.io/badge/OpenCV-4.13-5C3EE8?style=for-the-badge&logo=opencv)
![VectorDB](https://img.shields.io/badge/Vector_DB-Cosine_Search-008080?style=for-the-badge)

**EduPulse** is an end-to-end AI-powered educational ecosystem designed to monitor student learning health, track workload stress, provide personalized AI study recommendations, and automate attendance verification using computer vision facial embeddings and a custom Vector Database.

---

## ✨ Key Features

### 📸 1. AI Vision CV Attendance & Vector DB Engine
- **Real-Time Webcam Face Recognition**: Captures live video stream frames and extracts normalized facial feature vectors.
- **10-Snapshot Multi-Angle Registration**: Collects 10 guided snapshots (straight, left, right, tilt up/down) to generate robust facial profile centroids and multi-vector sample clusters.
- **Dedicated Vector Database (`VectorDB`)**: Performs fast Cosine Distance similarity search ($\max_{v \in \text{samples}} S_c(q, v)$) across all stored face vectors.
- **Strict Anti-Proxy Account Verification**: Binds face vector matches to active logged-in accounts. Rejects unauthorized proxy attendance scans automatically.
- **CLAHE Lighting Invariance**: Pre-processes video frames with Contrast Limited Adaptive Histogram Equalization for reliable accuracy under any lighting condition.

### 📊 2. Student Learning Health & Growth Dashboard
- **Learning Health Index (LHI)**: Evaluates concept mastery, assignment completions, and subject weakness detection.
- **Workload & Mental Pressure Radar**: Monitors active assignment density and stress progression.
- **5-Axis Growth Radar Chart**: Displays holistic growth across Academics, Extracurriculars, Sports, Clubs, and Competitions.
- **AI Study Plan Recommendations**: Tailored study windows and disengagement alerts.

### 👨‍🏫 3. Teacher & Parent Portals
- **Teacher Dashboard**: Student roster risk alerts, class test submissions, assignment grading, and doubt resolution.
- **Parent Portal**: Real-time bus tracking, AI parenting coach, and academic progress updates.

---

## 🏗️ Architecture & Tech Stack

```
                              ┌────────────────────────┐
                              │  Next.js 16 Frontend   │
                              │   (localhost:3000)     │
                              └───────────┬────────────┘
                                          │
                    ┌─────────────────────┴─────────────────────┐
                    ▼                                           ▼
      ┌───────────────────────────┐               ┌───────────────────────────┐
      │   EduPulse Backend API    │               │  Vision CV & Vector DB    │
      │   FastAPI (localhost:8000)│               │  FastAPI (localhost:8001) │
      └─────────────┬─────────────┘               └─────────────┬─────────────┘
                    │                                           │
                    ▼                                           ▼
      ┌───────────────────────────┐               ┌───────────────────────────┐
      │  SQLite / ADSA Data Engine│               │   VectorDB & SQLite Logs  │
      └───────────────────────────┘               └───────────────────────────┘
```

| Component | Stack |
|---|---|
| **Frontend UI** | Next.js 16 (Turbopack, App Router), React 19, Tailwind CSS, Lucide Icons, Recharts |
| **Backend API** | Python 3.10, FastAPI, Pydantic v2, SQLAlchemy, JWT Security |
| **Vision & AI Engine** | PyTorch 2.5, OpenCV 4.13 (CLAHE, 4x4 Spatial Grid Extractors), InsightFace ArcFace |
| **Vector Database** | Custom `VectorDB` Engine with Cosine Distance Nearest-Neighbor Search |

---

## 📂 Project Structure

```text
EduPulse/
├── frontend/                   # Next.js 16 Web Frontend Application
│   ├── app/                    # App Router Pages ((dashboard), student/attendance, etc.)
│   ├── components/             # Reusable UI & Layout Components (Sidebar, Header, KPI Cards)
│   └── lib/                    # API Clients & frozen constants
├── backend/                    # FastAPI Main REST API Server
│   ├── app/
│   │   ├── auth/               # JWT Auth & Mock Database Resolvers
│   │   ├── core/               # Database Engine & Security Config
│   │   └── modules/            # Student, Teacher, Parent, AI modules
│   └── requirements.txt        # Python Backend Dependencies
├── vision/                     # Standalone Computer Vision & Vector Database Service
│   ├── vision/
│   │   └── app/
│   │       ├── ai/             # FaceService & Spatial Grid Feature Extractor
│   │       ├── database/       # VectorDB & SQLite Attendance Logger
│   │       └── main.py         # Vision FastAPI Entrypoint Server
│   └── vector_store/           # Persistent JSON & SQLite Vector Storage
└── README.md                   # Project Documentation
```

---

## 🚀 Quick Start Guide

### Prerequisites
- **Python 3.10+**
- **Node.js 18+ & npm**

---

### Step 1: Install Dependencies

#### 1. Backend & Vision Dependencies
```bash
pip install fastapi uvicorn torchvision torch opencv-python numpy aiosqlite python-jose passlib pillow
```

#### 2. Frontend Dependencies
```bash
cd frontend
npm install
cd ..
```

---

### Step 2: Configure Environment Files

Create `frontend/.env.local`:
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api/v1
NEXT_PUBLIC_VISION_API_BASE_URL=http://localhost:8001
```

Create `backend/.env`:
```env
APP_NAME=EduPulse
APP_ENV=development
DEBUG=true
SECRET_KEY=edupulse-super-secret-jwt-key-2026-hackathon
DATA_SOURCE=mock
USE_MOCK=true
DATABASE_URL=sqlite+aiosqlite:///./edupulse.db
```

---

### Step 3: Launch Services

Run the following 3 commands in separate terminal sessions:

#### Terminal 1: Vision CV Attendance & Vector DB Server
```bash
python -m uvicorn vision.app.main:app --port 8001 --host 0.0.0.0
```

#### Terminal 2: EduPulse Backend API Server
```bash
python -m uvicorn app.main:app --port 8000 --host 0.0.0.0
```

#### Terminal 3: Next.js Frontend Application
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
| **Admin** | `admin@edupulse.edu` | `password` |

---

## 🌐 Application URLs

- 📱 **Web Application**: [http://localhost:3000](http://localhost:3000)
- 📸 **AI Attendance Page**: [http://localhost:3000/student/attendance](http://localhost:3000/student/attendance)
- ⚙️ **Backend REST API**: [http://localhost:8000](http://localhost:8000)
- 👁️ **Vision CV API**: [http://localhost:8001](http://localhost:8001)

---

## 📜 License
Developed for Hackathon 2026. All rights reserved.
