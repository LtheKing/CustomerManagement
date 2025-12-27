# 🚀 Deployment Quick Checklist

Use this checklist to track your deployment progress.

## Pre-Deployment

- [ ] Code is pushed to GitHub repository
- [ ] All local changes are committed
- [ ] Application runs successfully locally
- [ ] Database schema is ready (`database_schema.sql`)

## Step 1: Database Setup (Supabase)

- [ ] Created Supabase account
- [ ] Created new project in Supabase
- [ ] Saved database connection details securely
- [ ] Ran `database_schema.sql` in Supabase SQL Editor
- [ ] Verified tables are created (Users, Products, Customers, Sales, etc.)
- [ ] Tested database connection

**Connection String Format:**
```
Host=db.xxxxx.supabase.co;Port=5432;Database=postgres;Username=postgres;Password=YOUR_PASSWORD;SSL Mode=Require;
```

## Step 2: Backend Deployment (Render)

- [ ] Created Render account
- [ ] Connected GitHub repository
- [ ] Created new Web Service
- [ ] Configured service settings:
  - [ ] Name: `customer-management-api`
  - [ ] Runtime: Docker
  - [ ] Dockerfile Path: `customer.management.api/Dockerfile`
- [ ] Added environment variables:
  - [ ] `ASPNETCORE_ENVIRONMENT=Production`
  - [ ] `ASPNETCORE_URLS=http://+:8080`
  - [ ] `ConnectionStrings__DefaultConnection` (with Supabase details)
- [ ] Service deployed successfully
- [ ] Noted backend URL: `https://your-api.onrender.com`
- [ ] Tested API endpoint: `/api/seed/test`

## Step 3: Frontend Deployment (Vercel)

- [ ] Created Vercel account
- [ ] Connected GitHub repository
- [ ] Imported project
- [ ] Configured project settings:
  - [ ] Framework: Vite
  - [ ] Root Directory: `customer.management.front.end`
  - [ ] Build Command: `npm run build`
  - [ ] Output Directory: `dist`
- [ ] Added environment variable:
  - [ ] `VITE_API_BASE_URL=https://your-api.onrender.com/api`
- [ ] Frontend deployed successfully
- [ ] Noted frontend URL: `https://your-app.vercel.app`
- [ ] Tested frontend in browser

## Step 4: CORS Configuration

- [ ] Updated `Program.cs` CORS configuration
- [ ] Added Vercel URL to allowed origins (or set `Cors:AllowAllOrigins=true`)
- [ ] Committed and pushed changes
- [ ] Verified Render auto-deployed changes
- [ ] Tested frontend can communicate with backend

## Step 5: CI/CD Setup (GitHub Actions)

- [ ] Created `.github/workflows/deploy.yml`
- [ ] Committed workflow file
- [ ] Pushed to GitHub
- [ ] Verified workflow runs successfully in GitHub Actions tab
- [ ] Build tests pass

## Step 6: Custom Domain (Optional)

- [ ] Decided on domain strategy (Vercel free domain or custom)
- [ ] If custom: Registered domain (Freenom or other)
- [ ] Configured DNS records in Vercel
- [ ] Domain verified and active
- [ ] Updated CORS with new domain

## Step 7: Monitoring (UptimeRobot)

- [ ] Created UptimeRobot account
- [ ] Added monitor for backend API
- [ ] Added monitor for frontend
- [ ] Configured alert contacts (email)
- [ ] Tested alerts

## Step 8: Final Testing

- [ ] Backend API responds correctly
- [ ] Frontend loads without errors
- [ ] Database connection works
- [ ] API calls from frontend succeed
- [ ] CORS errors resolved
- [ ] Sample data can be seeded
- [ ] All features work end-to-end

## Post-Deployment

- [ ] Documented all URLs and credentials securely
- [ ] Shared application URL with team/users
- [ ] Set up regular backups (if needed)
- [ ] Monitored initial usage
- [ ] Reviewed free tier limits and usage

## Troubleshooting Notes

**If backend won't connect to database:**
- Verify connection string format
- Check SSL Mode is set to `Require`
- Verify Supabase project is active
- Check firewall/network settings

**If CORS errors occur:**
- Verify Vercel URL is in CORS allowed origins
- Or set `Cors:AllowAllOrigins=true` in Render environment variables
- Check browser console for specific error

**If frontend can't reach backend:**
- Verify `VITE_API_BASE_URL` is set correctly in Vercel
- Check backend URL is accessible
- Verify API path includes `/api`

---

## Quick Reference: Environment Variables

### Render (Backend)
```
ASPNETCORE_ENVIRONMENT=Production
ASPNETCORE_URLS=http://+:8080
ConnectionStrings__DefaultConnection=Host=db.xxxxx.supabase.co;Port=5432;Database=postgres;Username=postgres;Password=YOUR_PASSWORD;SSL Mode=Require;
Cors:AllowAllOrigins=true  (optional, for Vercel preview deployments)
```

### Vercel (Frontend)
```
VITE_API_BASE_URL=https://your-api.onrender.com/api
```

---

**Deployment Date:** _______________
**Backend URL:** _______________
**Frontend URL:** _______________
**Database:** Supabase (Project: _______________)


