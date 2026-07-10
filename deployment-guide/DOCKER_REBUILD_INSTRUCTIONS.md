# Docker Rebuild Instructions - PostgreSQL Migration

Since we migrated from SQL Server to PostgreSQL, you need to rebuild your Docker containers.

## Steps to Rebuild

### 1. Stop and Remove Existing Containers

```bash
# Stop all running containers
docker-compose down

# Remove containers and volumes (optional - only if you want to start fresh)
docker-compose down -v
```

### 2. Remove Old Images (Optional but Recommended)

```bash
# List images to see what needs to be removed
docker images

# Remove the old API image (if it exists)
docker rmi customer-management-api

# Or remove all unused images
docker image prune -a
```

### 3. Rebuild the Images

```bash
# Rebuild all images from scratch
docker-compose build --no-cache

# Or rebuild specific service
docker-compose build --no-cache api
```

### 4. Start the New Containers

```bash
# Start all services
docker-compose up -d

# Or start with logs visible
docker-compose up
```

### 5. Verify Everything is Running

```bash
# Check container status
docker-compose ps

# Check logs
docker-compose logs api
docker-compose logs postgres

# Check if PostgreSQL is ready
docker-compose exec postgres pg_isready -U postgres
```

## Quick One-Liner (Complete Rebuild)

```bash
docker-compose down -v && docker-compose build --no-cache && docker-compose up -d
```

## Important Notes

1. **Data Loss Warning**: Using `docker-compose down -v` will **delete all data** in the database volume. If you have important data, back it up first!

2. **Database Migration**: After containers are running, you may need to:
   - Run the `database_schema.sql` script in pgAdmin
   - Or use EF Core migrations: `dotnet ef database update`

3. **Connection String**: Make sure your connection strings in `appsettings.Docker.json` match the PostgreSQL configuration.

4. **Port Conflicts**: 
   - Old SQL Server was on port 1433
   - New PostgreSQL is on port 5432
   - Make sure port 5432 is not already in use

## Troubleshooting

### If PostgreSQL container fails to start:
```bash
# Check logs
docker-compose logs postgres

# Verify environment variables
docker-compose config
```

### If API can't connect to database:
```bash
# Check if PostgreSQL is healthy
docker-compose ps

# Test connection from API container
docker-compose exec api ping postgres
```

### If you see package errors:
```bash
# Rebuild without cache to ensure new packages are downloaded
docker-compose build --no-cache api
```

## Production Environment

For production (`docker-compose.prod.yml`):

```bash
docker-compose -f docker-compose.prod.yml down -v
docker-compose -f docker-compose.prod.yml build --no-cache
docker-compose -f docker-compose.prod.yml up -d
```

