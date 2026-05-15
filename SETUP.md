# TravelGPT - Hướng Dẫn Cài Đặt

## Mục Lục

1. [Yêu Cầu Hệ Thống](#1-yêu-cầu-hệ-thống)
2. [Cài Đặt Nhanh với Docker](#2-cài-đặt-nhanh-với-docker)
3. [Cài Đặt Chi Tiết (Development)](#3-cài-đặt-chi-tiết-development)
4. [Cấu Hình Biến Môi Trường](#4-cấu-hình-biến-môi-trường)
5. [Thiết Lập Database](#5-thiết-lập-database)
6. [Khởi Chạy Ứng Dụng](#6-khởi-chạy-ứng-dụng)
7. [Kiểm Tra Sau Cài Đặt](#7-kiểm-tra-sau-cài-đặt)
8. [Xử Lý Sự Cố Thường Gặp](#8-xử-lý-sự-cố-thường-gặp)

---

## 1. Yêu Cầu Hệ Thống

### Bắt buộc

| Phần mềm | Phiên bản tối thiểu | Ghi chú |
|----------|---------------------|---------|
| Docker | 20.x+ | [Cài đặt Docker](https://docs.docker.com/get-docker/) |
| Docker Compose | 2.x+ | Thường đi kèm Docker Desktop |
| Git | Bất kỳ | Để clone project |

### Tùy chọn (Development)

| Phần mềm | Phiên bản tối thiểu | Ghi chú |
|----------|---------------------|---------|
| Node.js | 20.x LTS | [Cài đặt Node.js](https://nodejs.org/) |
| Python | 3.11+ | [Cài đặt Python](https://www.python.org/) |
| PostgreSQL Client | 15+ | Để quản lý DB trực tiếp |

---

## 2. Cài Đặt Nhanh với Docker

### 2.1 Clone và Di Chuyển

```bash
git clone https://github.com/Trinhvhao/TravelGPT.git
cd TravelGPT
```

### 2.2 Cấu Hình Môi Trường

```bash
# Copy file cấu hình mẫu
cp .env.example .env
```

Chỉnh sửa file `.env` và thêm các API key cần thiết:

```bash
# .env
AICLIEN2API_KEY=your-api-key-here
JWT_SECRET_KEY=your-secure-secret-key-min-32-chars
MEM0_API_KEY=your-mem0-key-optional
```

### 2.3 Khởi Chạy

```bash
# Build và chạy tất cả services
docker-compose up -d --build

# Xem logs
docker-compose logs -f
```

### 2.4 Các Service Sau Khi Khởi Chạy

| Service | URL | Mô tả |
|---------|-----|-------|
| Frontend | http://localhost:3005 | Giao diện người dùng |
| Backend API | http://localhost:3008 | API server |
| API Docs | http://localhost:3008/docs | Swagger UI |
| PostgreSQL | localhost:3006 | Database (port 5432 trong container) |
| Redis | localhost:3007 | Cache (port 6379 trong container) |
| Nginx | http://localhost | Reverse proxy |

### 2.5 Dừng Services

```bash
# Dừng và xóa containers
docker-compose down

# Xóa cả volumes (CẨN THẬN: xóa toàn bộ dữ liệu)
docker-compose down -v
```

---

## 3. Cài Đặt Chi Tiết (Development)

### 3.1 Backend (Python + FastAPI)

```bash
cd backend

# Tạo virtual environment
python -m venv venv

# Kích hoạt virtual environment
# macOS/Linux:
source venv/bin/activate
# Windows:
# .\venv\Scripts\activate

# Cài đặt dependencies
pip install -r requirements.txt

# Cài đặt Node.js dependencies cho Prisma
npm install

# Copy và chỉnh sửa .env
cp .env.example .env
```

### 3.2 Frontend (Next.js)

```bash
cd frontend

# Cài đặt dependencies
npm install

# Copy và chỉnh sửa .env
cp .env.example .env.local
```

---

## 4. Cấu Hình Biến Môi Trường

### 4.1 Backend (.env)

Tạo file `backend/.env`:

```bash
# Database
DATABASE_URL=postgresql://travelgpt:travelgpt123@localhost:5432/travelgpt

# Authentication
JWT_SECRET_KEY=supersecretkey123-change-in-production
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# AI Service
AICLIEN2API_KEY=your-api-key-here
# Hoặc sử dụng OpenAI:
# OPENAI_API_KEY=sk-your-openai-key

# Memory (Optional)
MEM0_API_KEY=your-mem0-key

# Redis
REDIS_URL=redis://localhost:6379

# App
APP_DEBUG=true
```

### 4.2 Frontend (.env.local)

Tạo file `frontend/.env.local`:

```bash
NEXT_PUBLIC_API_URL=http://localhost:3008/api/v1
NEXT_PUBLIC_APP_URL=http://localhost:3005
```

---

## 5. Thiết Lập Database

### 5.1 Tạo Database (nếu chưa có)

```sql
-- Kết nối PostgreSQL
psql -U postgres

-- Tạo database
CREATE DATABASE travelgpt;

-- Tạo user
CREATE USER travelgpt WITH PASSWORD 'travelgpt123';

-- Cấp quyền
GRANT ALL PRIVILEGES ON DATABASE travelgpt TO travelgpt;
```

### 5.2 Chạy Migration

```bash
cd backend

# Generate Prisma Client
npx prisma generate

# Tạo các bảng trong database
npx prisma db push

# (Tùy chọn) Chạy seed để tạo dữ liệu mẫu
npx prisma db seed
# Hoặc
python prisma/seed.py
```

### 5.3 Kiểm Tra Database

```bash
# Mở Prisma Studio (giao diện quản lý database)
npx prisma studio
```

---

## 6. Khởi Chạy Ứng Dụng

### 6.1 Chạy Backend

```bash
cd backend
source venv/bin/activate

# Chạy server với hot reload
uvicorn app.main:app --reload --port 3008

# Hoặc chạy ở chế độ production
uvicorn app.main:app --host 0.0.0.0 --port 3008
```

Backend sẽ chạy tại: http://localhost:3008
API Docs: http://localhost:3008/docs

### 6.2 Chạy Frontend

```bash
cd frontend

# Chế độ development với hot reload
npm run dev

# Build cho production
npm run build

# Chạy production build
npm start
```

Frontend sẽ chạy tại: http://localhost:3005

---

## 7. Kiểm Tra Sau Cài Đặt

### 7.1 Kiểm Tra Backend

```bash
# Kiểm tra health endpoint
curl http://localhost:3008/health

# Kiểm tra API docs
open http://localhost:3008/docs
```

### 7.2 Kiểm Tra Frontend

```bash
# Mở trình duyệt
open http://localhost:3005
```

### 7.3 Chạy Tests

```bash
# Backend tests
cd backend
pytest

# Frontend lint
cd frontend
npm run lint
```

---

## 8. Xử Lý Sự Cố Thường Gặp

### Lỗi: `DATABASE_URL` not found

**Nguyên nhân:** File `.env` chưa được tạo hoặc sai đường dẫn.

**Giải pháp:**

```bash
# Kiểm tra file .env tồn tại
ls -la backend/.env

# Tạo lại nếu chưa có
cp backend/.env.example backend/.env
```

### Lỗi: `AICLIEN2API_KEY` not configured

**Nguyên nhân:** Chưa thêm API key cho AI service.

**Giải pháp:**
- Đăng ký tài khoản tại [AIclien2api](https://aiclientapi.com) hoặc [OpenAI](https://platform.openai.com)
- Thêm key vào file `.env`

### Lỗi: Port đã được sử dụng

**Nguyên nhân:** Một service khác đang chạy trên port cần thiết.

**Giải pháp:**

```bash
# Tìm process đang sử dụng port
lsof -i :3005  # Frontend
lsof -i :3008  # Backend
lsof -i :5432  # PostgreSQL

# Hoặc thay đổi port trong docker-compose.yml
```

### Lỗi: Prisma Client lỗi

**Giải pháp:**

```bash
cd backend
rm -rf node_modules/.prisma
npx prisma generate
npx prisma db push
```

### Lỗi: Docker containers không khởi động được

**Giải pháp:**

```bash
# Xem logs chi tiết
docker-compose logs backend
docker-compose logs postgres

# Xóa containers và volumes cũ
docker-compose down -v
docker system prune -f

# Build lại từ đầu
docker-compose up -d --build
```

---

## Cấu Trúc Project

```
TravelGPT/
├── backend/                    # FastAPI Backend
│   ├── app/
│   │   ├── api/v1/           # API Routes (auth, chat, tours, bookings)
│   │   ├── core/             # Config, security, database
│   │   ├── schemas/          # Pydantic models
│   │   ├── services/         # Business logic
│   │   └── ai/               # AI Agent (LangGraph, Mem0)
│   ├── prisma/
│   │   └── schema.prisma     # Database schema
│   ├── tests/                # Pytest tests
│   ├── Dockerfile
│   └── requirements.txt
│
├── frontend/                   # Next.js Frontend
│   ├── app/                   # Next.js App Router pages
│   │   ├── admin/            # Admin dashboard
│   │   ├── chat/             # AI Chat interface
│   │   ├── tours/            # Tour listing & detail
│   │   └── bookings/         # Booking management
│   ├── components/           # React components (shadcn/ui)
│   ├── lib/                   # API clients
│   ├── stores/               # Zustand state management
│   ├── Dockerfile
│   └── package.json
│
├── docker-compose.yml         # Docker orchestration
├── .env.example              # Environment template
└── README.md                 # Project documentation
```

---

## Tài Khoản Mặc Định (Sau Khi Seed)

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@travelgpt.com | admin123 |
| User | user@travelgpt.com | user123 |

---

## Liên Hệ & Hỗ Trợ

- **GitHub Issues:** https://github.com/Trinhvhao/TravelGPT/issues
- **Documentation:** https://github.com/Trinhvhao/TravelGPT#readme
