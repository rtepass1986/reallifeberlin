# Setup Guide

## Quick Start

### 1. Install Dependencies

```bash
npm run install:all
```

### 2. Database Setup

#### Option A: Using Docker (Recommended)

1. Start PostgreSQL in Docker:
```bash
docker-compose up -d
```

This will create a PostgreSQL database with:
- Database: `reallife_db`
- User: `reallife_user`
- Password: `reallife_password`
- Port: `5432`

2. Configure environment variables:
```bash
cd backend
cp .env.example .env
```

Edit `backend/.env` and set:
```env
DATABASE_URL="postgresql://reallife_user:reallife_password@localhost:5432/reallife_db?schema=public"
JWT_SECRET="your-secret-key-change-this-in-production"
```

#### Option B: Local PostgreSQL Installation

1. Create a PostgreSQL database:
```bash
createdb reallife_db
# Or using psql:
# CREATE DATABASE reallife_db;
```

2. Configure environment variables:
```bash
cd backend
cp .env.example .env
```

Edit `backend/.env` and set:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/reallife_db?schema=public"
JWT_SECRET="your-secret-key-change-this-in-production"
```

### 3. Initialize Database

```bash
cd backend
npm run db:generate
npm run db:migrate
npm run seed
```

The seed script will create:
- Default admin user (email: `admin@reallife.church`, password: `admin123`)
- Three mission points: "Wir gehen", "Wir bringen", "Wir begleiten"

### 4. Configure API Keys (Optional)

For full functionality, add your API keys to `backend/.env`:

```env
# Planning Center API
PLANNING_CENTER_API_KEY=your_planning_center_api_key
PLANNING_CENTER_APP_ID=your_planning_center_app_id

# Peoples App API
PEOPLES_APP_API_KEY=your_peoples_app_api_key
PEOPLES_APP_API_URL=https://api.peoplesapp.com

# WhatsApp API
WHATSAPP_API_KEY=your_whatsapp_api_key
WHATSAPP_API_URL=https://api.whatsapp.com
```

**Note:** You'll need to configure your Planning Center API token in the `.env` file. The exact format depends on Planning Center's API requirements. See `PLANNING_CENTER_AUTH.md` for detailed setup instructions.

### 5. Start Development Servers

From the root directory:
```bash
npm run dev
```

This starts:
- Backend: http://localhost:3001
- Frontend: http://localhost:5173

### 6. Login

Navigate to http://localhost:5173 and login with:
- Email: `admin@reallife.church`
- Password: `admin123`

## Next Steps

1. **Create Mission Points** (if not seeded):
   - Go to KPI Management
   - Create mission points if needed

2. **Add KPIs**:
   - Navigate to KPI Management
   - Select a mission point
   - Click "Create KPI"
   - Add KPIs like "Attendees at events", "Erstbekehrungen im gottesdienst", etc.

3. **Add KPI Records**:
   - Click "Add Record" on any KPI
   - Enter the value and optional notes

4. **Test Connect Process**:
   - Go to Connect Process
   - Click "New Contact"
   - Fill in contact information
   - The system will automatically create a 4-week workflow

## Troubleshooting

### Database Connection Issues
- **Using Docker**: Ensure container is running: `docker-compose ps`
- **Local PostgreSQL**: Ensure PostgreSQL service is running
- Check DATABASE_URL in `.env` matches your database credentials
- Verify database exists: `psql -l | grep reallife_db` (or `docker-compose exec postgres psql -U reallife_user -l`)
- For Docker: Check logs with `docker-compose logs postgres`

### Port Already in Use
- Backend: Change `PORT` in `backend/.env`
- Frontend: Change port in `frontend/vite.config.ts`

### API Integration Not Working
- Check API keys are correctly set in `.env`
- Verify API endpoints are correct
- Check network connectivity
- Review console logs for error messages

## Production Deployment

1. Build frontend:
```bash
cd frontend
npm run build
```

2. Build backend:
```bash
cd backend
npm run build
```

3. Set production environment variables

4. Run migrations:
```bash
cd backend
npm run db:migrate
```

5. Start production server:
```bash
cd backend
npm start
```

## Security Notes

- **Change default admin password** immediately after first login
- Use strong `JWT_SECRET` in production
- Never commit `.env` files to version control
- Use environment variables for all sensitive data
- Enable HTTPS in production
- Regularly update dependencies
