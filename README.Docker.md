# Docker Setup for Customer Management Application

This project includes Docker support for easy development and deployment.

## Prerequisites

- Docker Desktop (Windows/Mac) or Docker Engine (Linux)
- Docker Compose

## Quick Start

### Development Mode

To run the entire application stack in development mode:

```bash
docker-compose up --build
```

This will start:
- **SQL Server** on port `1433`
- **.NET API** on ports `8080` (HTTP) and `8081` (HTTPS)
- **React Frontend** on port `5173` (Vite dev server)

### Production Mode

To run in production mode with optimized builds:

```bash
docker-compose -f docker-compose.prod.yml up --build
```

This will start:
- **SQL Server** on port `1433`
- **.NET API** on ports `8080` (HTTP) and `8081` (HTTPS)
- **React Frontend** on port `80` (Nginx)

## Services

### SQL Server
- **Container**: `customer-management-db`
- **Port**: `1433`
- **Database**: `CustomerManagementDB`
- **Username**: `sa`
- **Password**: `YourStrong@Passw0rd` (⚠️ Change this in production!)

### API (.NET 8.0)
- **Container**: `customer-management-api`
- **Ports**: `8080` (HTTP), `8081` (HTTPS)
- **Swagger UI**: `http://localhost:8080/swagger`
- **Health Check**: Waits for SQL Server to be healthy before starting

### Frontend (React + Vite)
- **Container**: `customer-management-frontend`
- **Port**: `5173` (dev) or `80` (prod)
- **API URL**: Configured via `VITE_API_BASE_URL` environment variable

## Environment Variables

### API Service
- `ASPNETCORE_ENVIRONMENT`: `Development` or `Production`
- `ConnectionStrings__DefaultConnection`: Database connection string
- `ASPNETCORE_HTTP_PORTS`: HTTP port (default: `8080`)
- `ASPNETCORE_HTTPS_PORTS`: HTTPS port (default: `8081`)

### Frontend Service
- `VITE_API_BASE_URL`: Backend API URL (default: `http://localhost:8080/api`)

## Database Connection

The API automatically connects to the SQL Server container using:
- **Server**: `sqlserver` (Docker service name)
- **Database**: `CustomerManagementDB`
- **User**: `sa`
- **Password**: `YourStrong@Passw0rd`

## Volumes

- `sqlserver_data`: Persistent storage for SQL Server database
- Frontend and API source code are mounted as volumes for hot-reload in development

## Useful Commands

### Start services
```bash
docker-compose up
```

### Start in background
```bash
docker-compose up -d
```

### Stop services
```bash
docker-compose down
```

### Stop and remove volumes (⚠️ deletes database)
```bash
docker-compose down -v
```

### View logs
```bash
docker-compose logs -f
```

### View logs for specific service
```bash
docker-compose logs -f api
docker-compose logs -f frontend
docker-compose logs -f sqlserver
```

### Rebuild specific service
```bash
docker-compose build api
docker-compose up -d api
```

### Access SQL Server
```bash
docker exec -it customer-management-db /opt/mssql-tools/bin/sqlcmd -S localhost -U sa -P YourStrong@Passw0rd
```

## Troubleshooting

### Database Connection Issues
- Ensure SQL Server container is healthy: `docker-compose ps`
- Check SQL Server logs: `docker-compose logs sqlserver`
- Wait for health check to pass before API starts

### Port Conflicts
- If ports are already in use, modify the port mappings in `docker-compose.yml`
- Change `"8080:8080"` to `"8081:8080"` to use port 8081 on host

### Frontend Can't Connect to API
- Check `VITE_API_BASE_URL` environment variable
- Ensure API container is running: `docker-compose ps`
- Check CORS settings in `Program.cs`

### Rebuild Everything
```bash
docker-compose down -v
docker-compose build --no-cache
docker-compose up
```

## Security Notes

⚠️ **Important**: The default SQL Server password (`YourStrong@Passw0rd`) is for development only. For production:

1. Change the password in `docker-compose.yml`
2. Use Docker secrets or environment variables
3. Use a production-grade SQL Server license
4. Enable SSL/TLS for database connections
5. Use a reverse proxy (nginx/traefik) for production

## Development Workflow

1. Start services: `docker-compose up`
2. Make changes to code (hot-reload enabled)
3. API changes require restart: `docker-compose restart api`
4. Frontend changes auto-reload via Vite
5. Database changes persist in Docker volume

