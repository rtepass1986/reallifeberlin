# Docker Setup Guide

## Quick Start with Docker

### Prerequisites
- Docker installed on your system
- Docker Compose installed (usually comes with Docker Desktop)

### Starting the Database

1. Start PostgreSQL container:
```bash
docker-compose up -d
```

This will:
- Pull the PostgreSQL 15 Alpine image (if not already present)
- Create a container named `reallife_db`
- Start PostgreSQL on port 5432
- Create a persistent volume for data storage

### Database Credentials

The Docker setup uses these default credentials:
- **Database**: `reallife_db`
- **User**: `reallife_user`
- **Password**: `reallife_password`
- **Port**: `5432`

### Configure Backend

Update your `backend/.env` file:
```env
DATABASE_URL="postgresql://reallife_user:reallife_password@localhost:5432/reallife_db?schema=public"
```

### Verify Database is Running

```bash
# Check container status
docker-compose ps

# View logs
docker-compose logs postgres

# Connect to database
docker-compose exec postgres psql -U reallife_user -d reallife_db
```

### Stop the Database

```bash
# Stop container (keeps data)
docker-compose stop

# Stop and remove container (keeps data volume)
docker-compose down

# Stop and remove container + data volume (⚠️ deletes all data)
docker-compose down -v
```

### Useful Commands

```bash
# View database logs
docker-compose logs -f postgres

# Restart database
docker-compose restart postgres

# Access PostgreSQL CLI
docker-compose exec postgres psql -U reallife_user -d reallife_db

# Backup database
docker-compose exec postgres pg_dump -U reallife_user reallife_db > backup.sql

# Restore database
docker-compose exec -T postgres psql -U reallife_user reallife_db < backup.sql
```

### Data Persistence

Data is stored in a Docker volume named `postgres_data`. This means:
- Data persists even if you stop/remove the container
- Data is removed only if you use `docker-compose down -v`
- To completely reset: `docker-compose down -v` then `docker-compose up -d`

### Changing Database Credentials

If you want to change the database credentials:

1. Edit `docker-compose.yml`:
```yaml
environment:
  POSTGRES_USER: your_new_user
  POSTGRES_PASSWORD: your_new_password
  POSTGRES_DB: your_new_db_name
```

2. Update `backend/.env` with new credentials

3. Recreate the container:
```bash
docker-compose down -v
docker-compose up -d
```

⚠️ **Warning**: This will delete all existing data!

### Troubleshooting

**Port 5432 already in use:**
- Change the port mapping in `docker-compose.yml`:
```yaml
ports:
  - "5433:5432"  # Use 5433 on host instead
```
- Update `DATABASE_URL` to use the new port

**Container won't start:**
- Check logs: `docker-compose logs postgres`
- Ensure port 5432 is not in use by another PostgreSQL instance
- Try removing and recreating: `docker-compose down -v && docker-compose up -d`

**Connection refused:**
- Wait a few seconds after starting - PostgreSQL needs time to initialize
- Check container is running: `docker-compose ps`
- Verify health check: `docker-compose exec postgres pg_isready -U reallife_user`

**Permission issues:**
- On Linux, you may need to run with `sudo` or add your user to the docker group

### Production Considerations

For production, consider:
- Using environment variables for sensitive credentials
- Setting up proper backups
- Using a managed database service (AWS RDS, Google Cloud SQL, etc.)
- Configuring SSL/TLS connections
- Setting up connection pooling
- Using secrets management instead of hardcoded passwords
