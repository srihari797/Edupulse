# 🚀 EduPulse Production Deployment Guide

This guide covers all options and best practices for deploying the **EduPulse** full-stack ecosystem into production.

---

## 🏗️ System Architecture Overview

EduPulse is comprised of three services:

| Service | Technology | Default Port | Role |
| :--- | :--- | :--- | :--- |
| **Frontend** | Next.js 16 (React 19, TypeScript) | `3000` | Web Dashboard for Students, Teachers, Parents, Admins |
| **Backend API** | FastAPI, SQLAlchemy, Python 3.10 | `8000` | Business Logic, JWT Auth, Supabase `edupulse` DB queries |
| **Vision AI** | FastAPI, OpenCV, PyTorch, VectorDB | `8001` | Live Webcam Verification, Vector Embedding Indexing |

**Database**: Supabase PostgreSQL (strictly using schema `edupulse`).

---

## 📦 Option 1: Docker Compose Deployment (Recommended)

This is the fastest and most reliable deployment method for any cloud VPS (AWS EC2, DigitalOcean Droplet, GCP Compute Engine, Hetzner, or Linode).

### 1. Prerequisites
- Linux Server (Ubuntu 22.04 LTS / Debian 12 recommended)
- Docker & Docker Compose installed:
  ```bash
  curl -fsSL https://get.docker.com -o get-docker.sh
  sh get-docker.sh
  ```

### 2. Clone Repository & Setup Environment
```bash
git clone https://github.com/srihari797/Edupulse.git
cd EduPulse

# Copy and configure environment variables
cp .env.example .env
cp backend/.env.example backend/.env
```

Edit `backend/.env` with your real production values:
```env
APP_NAME=EduPulse
APP_ENV=production
DEBUG=false
SECRET_KEY=generate_a_random_secure_secret_key
DATA_SOURCE=real
USE_MOCK=false
DATABASE_URL=postgresql://postgres:your_password@db.your_ref.supabase.co:5432/postgres?sslmode=require
SUPABASE_URL=https://your_ref.supabase.co
GROQ_API_KEY=gsk_your_groq_api_key
GROQ_MODEL=llama-3.3-70b-versatile
```

### 3. Launch with Docker Compose
```bash
# Build and run containers in background
docker compose up -d --build

# Verify all containers are healthy
docker compose ps

# Check logs
docker compose logs -f
```

### 4. Reverse Proxy with SSL (Nginx / Caddy)

> [!IMPORTANT]
> Modern web browsers **require HTTPS** to access webcam/camera streams. Ensure you serve EduPulse through a domain with SSL.

Example Caddy configuration (`/etc/caddy/Caddyfile`):
```caddy
# Frontend
app.yourdomain.com {
    reverse_proxy localhost:3000
}

# Backend API
api.yourdomain.com {
    reverse_proxy localhost:8000
}

# Vision Vector AI
vision.yourdomain.com {
    reverse_proxy localhost:8001
}
```

---

## ☁️ Option 2: Cloud PaaS Deployment (Vercel + Render / Railway)

### 1. Frontend on Vercel
1. Import the repository into [Vercel](https://vercel.com).
2. Set **Root Directory** to `frontend`.
3. Set **Framework Preset** to `Next.js`.
4. Add Environment Variables:
   - `NEXT_PUBLIC_API_BASE_URL` = `https://your-backend-api.onrender.com/api/v1`
   - `NEXT_PUBLIC_VISION_API_BASE_URL` = `https://your-vision-service.onrender.com`
5. Click **Deploy**.

### 2. Backend on Render / Railway
1. Create a **Web Service** pointing to the `backend/` directory.
2. Select **Runtime**: `Python 3` or `Docker` (using `backend/Dockerfile`).
3. Build Command: `pip install -r requirements.txt`
4. Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. Add Environment Variables from `backend/.env`.

### 3. Vision AI Service on Render / Railway
1. Create a **Web Service** pointing to `vision/` directory using `vision/Dockerfile`.
2. Attach a **Persistent Disk** mounted at `/app/vision/vector_store` (minimum 1GB) so face vectors and attendance logs survive redeployments.
3. Start Command: `uvicorn vision.app.main:app --host 0.0.0.0 --port $PORT`

---

## 🖥️ Option 3: Direct Linux VM (systemd + PM2)

If deploying directly on an Ubuntu/Debian server without Docker:

### 1. Setup Backend Service
Create `/etc/systemd/system/edupulse-backend.service`:
```ini
[Unit]
Description=EduPulse Backend API
After=network.target

[Service]
User=ubuntu
WorkingDirectory=/var/www/EduPulse/backend
EnvironmentFile=/var/www/EduPulse/backend/.env
ExecStart=/var/www/EduPulse/backend/.venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000
Restart=always

[Install]
WantedBy=multi-user.target
```

### 2. Setup Vision Service
Create `/etc/systemd/system/edupulse-vision.service`:
```ini
[Unit]
Description=EduPulse Vision Vector Service
After=network.target

[Service]
User=ubuntu
WorkingDirectory=/var/www/EduPulse/vision
ExecStart=/var/www/EduPulse/vision/.venv/bin/uvicorn vision.app.main:app --host 0.0.0.0 --port 8001
Restart=always

[Install]
WantedBy=multi-user.target
```

Enable and start services:
```bash
sudo systemctl daemon-reload
sudo systemctl enable --now edupulse-backend edupulse-vision
```

### 3. Setup Frontend with PM2
```bash
cd /var/www/EduPulse/frontend
npm install
npm run build
pm2 start npm --name "edupulse-frontend" -- start
pm2 save
pm2 startup
```

---

## 🔒 Security & Production Checklist

- [ ] **HTTPS / SSL**: Required for WebRTC/HTML5 webcam scanner access.
- [ ] **JWT Secret**: Change `SECRET_KEY` in `backend/.env` to a 64+ character random string.
- [ ] **Database Schema**: Ensure Supabase uses strict `schema="edupulse"`.
- [ ] **CORS**: Verify `allow_origins` in `backend/app/main.py` matches your production frontend URL.
- [ ] **Vector Store Backup**: Regularly back up `vision/vector_store/face_vectors.json` and `attendance.db`.
