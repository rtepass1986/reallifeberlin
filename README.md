# Reallife Church App

A comprehensive application for managing church KPIs and the Connect Process workflow.

## Features

### 1. KPI Reporting Dashboard
- Track KPIs for mission points (Wir gehen, Wir bringen, Wir begleiten)
- Create and manage KPIs individually for each mission point
- Visualize KPI data in modular dashboards
- Track trends over time

### 2. Connect Process Management
- Contact form/data collection
- Automated 4-week follow-up workflow
- Task management with notifications
- Status tracking (Completed, Already in small group, Contact ended, Reschedule)
- WhatsApp integration for small group leaders
- API integrations (Planning Center, Peoples App, WhatsApp)

## Tech Stack

- **Backend**: Node.js, Express, TypeScript, Prisma
- **Frontend**: React, TypeScript, Vite, Tailwind CSS, Recharts
- **Database**: PostgreSQL
- **Authentication**: JWT

## Setup

### Prerequisites
- Node.js 18+
- PostgreSQL database (or Docker for easy setup)
- npm or yarn
- Docker & Docker Compose (optional, for database)

### Installation

1. Install dependencies:
```bash
npm run install:all
```

2. Set up the database:

**Option A: Using Docker (Recommended)**
```bash
# Start PostgreSQL in Docker
docker-compose up -d

# Configure environment
cd backend
cp .env.example .env
# Edit .env and set:
# DATABASE_URL="postgresql://reallife_user:reallife_password@localhost:5432/reallife_db?schema=public"
```

**Option B: Local PostgreSQL**
```bash
# Create database locally, then:
cd backend
cp .env.example .env
# Edit .env with your database URL
```

3. Initialize the database:
```bash
cd backend
npm run db:generate
npm run db:migrate
npm run seed
```

4. Start development servers:
```bash
# From root directory
npm run dev
```

This will start:
- Backend server on http://localhost:3001
- Frontend dev server on http://localhost:5173

## Environment Variables

### Backend (.env)
- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: Secret key for JWT tokens
- `JWT_EXPIRES_IN`: Token expiration (default: 7d)
- `PLANNING_CENTER_API_KEY`: Planning Center API key
- `PLANNING_CENTER_APP_ID`: Planning Center App ID
- `PEOPLES_APP_API_KEY`: Peoples App API key
- `PEOPLES_APP_API_URL`: Peoples App API URL
- `WHATSAPP_API_KEY`: WhatsApp API key
- `WHATSAPP_API_URL`: WhatsApp API URL
- `PORT`: Backend server port (default: 3001)
- `FRONTEND_URL`: Frontend URL for CORS (default: http://localhost:5173)

### Frontend (.env)
- `VITE_API_URL`: Backend API URL (default: http://localhost:3001)

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

### Mission Points
- `GET /api/mission-points` - Get all mission points
- `GET /api/mission-points/:id` - Get single mission point
- `POST /api/mission-points` - Create mission point (Admin only)
- `PUT /api/mission-points/:id` - Update mission point (Admin only)
- `DELETE /api/mission-points/:id` - Delete mission point (Admin only)

### KPIs
- `GET /api/kpis` - Get all KPIs
- `GET /api/kpis/:id` - Get single KPI with records
- `POST /api/kpis` - Create KPI (Admin only)
- `PUT /api/kpis/:id` - Update KPI (Admin only)
- `DELETE /api/kpis/:id` - Delete KPI (Admin only)
- `POST /api/kpis/:id/records` - Add KPI record
- `GET /api/kpis/:id/records` - Get KPI records

### Contacts
- `GET /api/contacts` - Get all contacts
- `GET /api/contacts/:id` - Get single contact
- `POST /api/contacts` - Create contact
- `PUT /api/contacts/:id` - Update contact
- `DELETE /api/contacts/:id` - Delete contact

### Tasks
- `GET /api/tasks` - Get all tasks
- `GET /api/tasks/:id` - Get single task
- `PATCH /api/tasks/:id/status` - Update task status

### Workflows
- `GET /api/workflows` - Get all workflows
- `GET /api/workflows/:id` - Get single workflow

### Dashboard
- `GET /api/dashboard` - Get dashboard data
- `GET /api/dashboard/kpi-trends/:kpiId` - Get KPI trends

## Workflow System

The Connect Process uses an automated 4-week workflow:

**Week 1:**
- Monday: Send "Thanks for coming" message
- Thursday: Remind to invite to service

**Weeks 2-4:**
- Thursday: Remind to invite to service

**Week 4:**
- Friday: Status check - confirm if person joined small group

Tasks are automatically created when a new contact is added (unless they're already registered for a small group).

## Cron Jobs

- Daily at 8 AM: Check for due tasks and send notifications
- Weekly on Monday at 9 AM: Advance workflows to next week if all tasks are completed

## User Roles

- `ADMIN`: Full access to all features
- `CONNECTOR`: Can create contacts, manage assigned tasks
- `SMALL_GROUP_LEADER`: Receives notifications when contacts join
- `VIEWER`: Read-only access

## Development

### Backend
```bash
cd backend
npm run dev  # Start with hot reload
npm run build  # Build for production
npm start  # Start production server
npm run db:studio  # Open Prisma Studio
```

### Frontend
```bash
cd frontend
npm run dev  # Start dev server
npm run build  # Build for production
npm run preview  # Preview production build
```

## License

MIT
