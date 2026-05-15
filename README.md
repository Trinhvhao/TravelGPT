# TravelGPT - AI Travel Agent

Hệ thống AI Travel Agent - Chatbot tư vấn và đặt tour du lịch tự động.

## Tính năng

- **AI Chatbot thông minh**: Trò chuyện với AI để tìm tour phù hợp
- **Tìm kiếm tour**: Lọc theo điểm đến, giá, thời gian
- **Đặt tour trực tuyến**: Quy trình đặt tour đơn giản
- **Dashboard Admin**: Quản lý tours, bookings, users
- **JWT Authentication**: Hệ thống đăng nhập/đăng ký bảo mật

## Tech Stack

| Component | Technology |
|-----------|------------|
| Backend | FastAPI (Python) |
| Frontend | Next.js 16 |
| Database | PostgreSQL |
| ORM | Prisma |
| AI | AIclien2api |
| UI | TailwindCSS + shadcn/ui |
| Container | Docker |

## Cấu trúc Project

```
TravelGPT/
├── backend/           # FastAPI Backend
│   ├── app/
│   │   ├── api/      # API Routes
│   │   ├── core/     # Core config
│   │   ├── schemas/  # Pydantic schemas
│   │   ├── services/ # Business logic
│   │   └── ai/       # AI Agent
│   └── prisma/       # Prisma schema
├── frontend/          # Next.js Frontend
│   ├── app/
│   │   ├── admin/    # Admin pages
│   │   ├── chat/     # Chat interface
│   │   ├── tours/    # Tour pages
│   │   └── ...
│   └── components/   # UI components
└── docker-compose.yml
```

## Quick Start

### 1. Prerequisites

- Docker & Docker Compose
- Node.js 20+
- Python 3.11+
- AIclien2api key (hoặc OpenAI key)

### 2. Setup với Docker

```bash
# Clone repository
git clone <repo>
cd TravelGPT

# Copy environment file
cp .env.example .env
# Edit .env with your keys

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f
```

Services sẽ chạy:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs
- PostgreSQL: localhost:5432

### 3. Setup Development (Manual)

#### Backend

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Setup environment
cp .env.example .env
# Edit .env

# Install Prisma & generate client
npm install
npx prisma generate
npx prisma db push

# Start server
uvicorn app.main:app --reload
```

#### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Setup environment
cp .env.example .env.local
# Edit .env.local

# Start dev server
npm run dev
```

### 4. Seed Database (Optional)

Tạo admin user và sample tours:

```bash
cd backend
npx prisma studio
# Hoặc tạo script seed riêng
```

## API Endpoints

### Authentication
```
POST /api/v1/auth/register    - Đăng ký
POST /api/v1/auth/login      - Đăng nhập
POST /api/v1/auth/refresh    - Refresh token
GET  /api/v1/auth/me         - Lấy thông tin user
```

### Tours
```
GET  /api/v1/tours           - Danh sách tours (có filter, pagination)
GET  /api/v1/tours/:id       - Chi tiết tour
GET  /api/v1/tours/featured  - Tours nổi bật
POST /api/v1/tours           - Tạo tour (admin)
PUT  /api/v1/tours/:id       - Cập nhật tour (admin)
```

### Bookings
```
GET  /api/v1/bookings        - Danh sách bookings của user
POST /api/v1/bookings        - Tạo booking mới
PUT  /api/v1/bookings/:id/cancel - Hủy booking
```

### Chat
```
POST /api/v1/chat/message    - Gửi message cho AI
GET  /api/v1/chat/history    - Lấy lịch sử chat
```

## Môi trường (Environment Variables)

### Backend (.env)
```bash
DATABASE_URL=postgresql://travelgpt:travelgpt123@localhost:5432/travelgpt
AICLIEN2API_KEY=your-api-key
JWT_SECRET_KEY=your-secret-key
```

### Frontend (.env.local)
```bash
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

## AI Agent Flow

```
User Message → Intent Detection → [Search | Recommend | Booking | Cancel]
                ↓
        Tour Matching
                ↓
        Response + Suggestions
                ↓
        Update Memory
```

## Deployment

### Free Tiers

| Platform | Usage |
|----------|-------|
| Railway | Backend API |
| Vercel | Frontend Next.js |
| Neon | PostgreSQL |

### Production Checklist

- [ ] Đổi JWT_SECRET_KEY
- [ ] Setup HTTPS
- [ ] Cấu hình CORS cho domain production
- [ ] Setup rate limiting
- [ ] Backup database

## Development

```bash
# Backend tests
cd backend
pytest

# Frontend build
cd frontend
npm run build

# Lint
cd frontend
npm run lint
```

## Contributing

1. Fork repository
2. Tạo feature branch
3. Commit changes
4. Push và tạo PR

## License

MIT License

## Authors

- Student Project - AI Travel Agent System
