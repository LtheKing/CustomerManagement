# Docker Workflow Guide

This guide explains how to keep your Docker containers updated when you make code changes.

## Quick Reference

### After Making Code Changes

**For Frontend (React) changes:**
- ✅ **No rebuild needed!** Changes are automatically reflected via hot-reload
- The frontend uses volume mounts and Vite dev server for instant updates

**For API (.NET) changes:**
- **Rebuild and restart** (required because .NET needs compilation)
  ```bash
  docker-compose up -d --build api
  ```
- Or if you just want to restart without rebuilding:
  ```bash
  docker-compose restart api
  ```

**For Database changes (migrations, schema):**
- Restart the API container (it will apply migrations on startup)
  ```bash
  docker-compose restart api
  ```

## Detailed Workflows

### Development Workflow

#### Frontend Changes (React/TypeScript)
The frontend is configured with volume mounts and Vite dev server, so:
- ✅ **Changes are instant** - Just save your file and refresh the browser
- ✅ **Hot Module Replacement (HMR)** - Most changes update without a full page refresh
- ✅ **No Docker rebuild needed**

**If you add new npm packages:**
```bash
# Rebuild the frontend container
docker-compose up -d --build frontend
```

#### API Changes (.NET)
.NET requires compilation, so code changes need a rebuild:

**For code changes (C# files):**
```bash
# Rebuild and restart (required for code changes)
docker-compose up -d --build api
```

**If you added new NuGet packages:**
```bash
# Must rebuild to install new packages
docker-compose build api
docker-compose up -d api
```

**If you changed project structure or Dockerfile:**
```bash
# Rebuild without cache
docker-compose build --no-cache api
docker-compose up -d api
```

#### Database Schema Changes
If you modified Entity Framework models or added migrations:

```bash
# Restart API (it will apply migrations on startup)
docker-compose restart api

# Or if you need to recreate the database
docker-compose down -v  # ⚠️ This deletes all data!
docker-compose up -d
```

### Production Workflow

For production deployments, always rebuild images:

```bash
# Rebuild all services
docker-compose -f docker-compose.prod.yml build

# Or rebuild specific service
docker-compose -f docker-compose.prod.yml build api

# Start/restart with new images
docker-compose -f docker-compose.prod.yml up -d
```

## Common Commands

### Rebuild Everything
```bash
docker-compose build
docker-compose up -d
```

### Rebuild Specific Service
```bash
docker-compose build api
docker-compose up -d api
```

### Rebuild Without Cache (Clean Build)
```bash
docker-compose build --no-cache api
docker-compose up -d api
```

### View Logs (to see if changes are applied)
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f api
docker-compose logs -f frontend
```

### Check Container Status
```bash
docker-compose ps
```

### Stop and Remove Everything
```bash
docker-compose down
```

### Stop and Remove Everything (including volumes - deletes database!)
```bash
docker-compose down -v
```

## Development Tips

### 1. Watch Mode for .NET (Optional - Advanced)
For faster development, you can enable `dotnet watch` to auto-rebuild on file changes:

1. Modify `customer.management.api/Dockerfile` to use SDK image in final stage:
```dockerfile
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS final
WORKDIR /app
COPY --from=publish /app/publish .
CMD ["dotnet", "watch", "run", "--urls", "http://0.0.0.0:8080", "--no-launch-profile"]
```

2. Add volume mount to `docker-compose.yml`:
```yaml
volumes:
  - ./customer.management.api:/app
  - /app/bin
  - /app/obj
```

3. Rebuild:
```bash
docker-compose up -d --build api
```

**Note:** This uses more resources but provides faster feedback during development.

### 2. Frontend Development
- Changes to `.tsx`, `.ts`, `.css` files are instantly reflected
- Changes to `vite.config.ts` or `package.json` require container restart
- Check browser console for any errors

### 3. API Development
- Check API logs: `docker-compose logs -f api`
- Test endpoints: `http://localhost:8080/swagger`
- **After code changes, rebuild:** `docker-compose up -d --build api`
- If changes don't appear, check logs: `docker-compose logs api`

### 4. Database Development
- Database persists in Docker volume `sqlserver_data`
- To reset database: `docker-compose down -v` (⚠️ deletes all data)
- Connection string is configured in `docker-compose.yml`

## Troubleshooting

### Changes Not Reflecting?

**Frontend:**
1. Check if Vite dev server is running: `docker-compose logs frontend`
2. Hard refresh browser (Ctrl+F5)
3. Restart frontend: `docker-compose restart frontend`

**API:**
1. Check API logs: `docker-compose logs api`
2. Verify container is running: `docker-compose ps`
3. Rebuild if needed: `docker-compose up -d --build api`

### Container Won't Start?
```bash
# Check logs
docker-compose logs api

# Rebuild from scratch
docker-compose build --no-cache api
docker-compose up -d api
```

### Port Already in Use?
Change the port mapping in `docker-compose.yml`:
```yaml
ports:
  - "8081:8080"  # Use 8081 on host instead of 8080
```

## Summary Table

| Change Type | Action Required | Command |
|------------|----------------|---------|
| Frontend code (.tsx, .ts, .css) | None | Auto-reload |
| Frontend dependencies (package.json) | Rebuild | `docker-compose up -d --build frontend` |
| API code (.cs) | Rebuild | `docker-compose up -d --build api` |
| API dependencies (.csproj) | Rebuild | `docker-compose up -d --build api` |
| Database schema | Restart API | `docker-compose restart api` |
| Dockerfile changes | Rebuild | `docker-compose up -d --build <service>` |
| docker-compose.yml changes | Recreate | `docker-compose up -d` |

