# 🔧 Troubleshooting Guide

Common issues and solutions for deploying the Customer Management application.

## Table of Contents
1. [Backend Issues](#backend-issues)
2. [Frontend Issues](#frontend-issues)
3. [Database Issues](#database-issues)
4. [CORS Issues](#cors-issues)
5. [Deployment Issues](#deployment-issues)

---

## Backend Issues

### Problem: API Not Connecting to Database

**Symptoms:**
- API starts but can't connect to Supabase
- Error: "Connection refused" or "Timeout"
- Seed endpoint fails

**Solutions:**

1. **Verify Connection String Format**
   ```
   Host=db.xxxxx.supabase.co;Port=5432;Database=postgres;Username=postgres;Password=YOUR_PASSWORD;SSL Mode=Require;
   ```
   - Ensure `SSL Mode=Require;` is included
   - Check password doesn't have special characters that need escaping
   - Verify host URL is correct (from Supabase dashboard)

2. **Check Supabase Project Status**
   - Go to Supabase dashboard
   - Verify project is active (not paused)
   - Check if you've exceeded free tier limits

3. **Test Connection Manually**
   - Use Supabase SQL Editor to verify database is accessible
   - Check connection pool status in Supabase dashboard

4. **Verify Environment Variables in Render**
   - Go to Render dashboard → Your Service → Environment
   - Ensure `ConnectionStrings__DefaultConnection` is set correctly
   - Check for typos or missing values
   - Restart service after updating variables

---

### Problem: Build Fails on Render

**Symptoms:**
- Deployment fails during build
- Docker build errors

**Solutions:**

1. **Check Dockerfile Path**
   - Verify path: `customer.management.api/Dockerfile`
   - Ensure Dockerfile exists in repository
   - Check Docker context is set to repository root

2. **Verify .NET SDK Version**
   - Check `customer.management.api.csproj` targets .NET 8.0
   - Ensure Dockerfile uses correct base image

3. **Check Build Logs**
   - Review full build logs in Render dashboard
   - Look for specific error messages
   - Common issues: missing dependencies, path errors

4. **Test Docker Build Locally**
   ```bash
   docker build -f customer.management.api/Dockerfile -t test-api .
   ```

---

### Problem: API Returns 500 Errors

**Symptoms:**
- API responds but returns internal server errors
- Swagger UI shows errors

**Solutions:**

1. **Check Application Logs**
   - View logs in Render dashboard
   - Look for exception details
   - Check database connection errors

2. **Verify Database Schema**
   - Ensure all tables are created
   - Run `database_schema.sql` if needed
   - Check for missing migrations

3. **Check Environment Variables**
   - Verify all required variables are set
   - Ensure connection string is correct

---

## Frontend Issues

### Problem: API Calls Failing

**Symptoms:**
- Frontend loads but can't fetch data
- Network errors in browser console
- 404 or CORS errors

**Solutions:**

1. **Verify API URL**
   - Check `VITE_API_BASE_URL` in Vercel environment variables
   - Format: `https://your-api.onrender.com/api`
   - Ensure URL includes `/api` path
   - Test API URL directly in browser

2. **Check CORS Configuration**
   - Verify Vercel URL is in backend CORS allowed origins
   - Or set `Cors:AllowAllOrigins=true` in Render
   - Check browser console for specific CORS error

3. **Verify Backend is Running**
   - Check Render dashboard - service should be "Live"
   - Test backend URL directly: `https://your-api.onrender.com/api/seed/test`
   - Note: Render free tier spins down after 15 min inactivity

4. **Check Network Tab**
   - Open browser DevTools → Network tab
   - See actual request URL and response
   - Check for CORS preflight failures

---

### Problem: Build Fails on Vercel

**Symptoms:**
- Vercel deployment fails
- Build errors in Vercel logs

**Solutions:**

1. **Verify Build Settings**
   - Framework: Vite
   - Root Directory: `customer.management.front.end`
   - Build Command: `npm run build`
   - Output Directory: `dist`

2. **Check package.json**
   - Ensure build script exists: `"build": "tsc && vite build"`
   - Verify all dependencies are listed
   - Check for TypeScript errors

3. **Review Build Logs**
   - Check Vercel build logs for specific errors
   - Common issues: missing dependencies, TypeScript errors

4. **Test Build Locally**
   ```bash
   cd customer.management.front.end
   npm install
   npm run build
   ```

---

### Problem: Blank Page or White Screen

**Symptoms:**
- Frontend loads but shows blank page
- No errors in console

**Solutions:**

1. **Check Browser Console**
   - Open DevTools → Console
   - Look for JavaScript errors
   - Check for missing environment variables

2. **Verify Environment Variables**
   - Ensure `VITE_API_BASE_URL` is set in Vercel
   - Rebuild after adding variables
   - Check variable name (must start with `VITE_`)

3. **Check Routing**
   - Verify `vercel.json` has proper rewrites
   - Check if React Router is configured correctly

---

## Database Issues

### Problem: Connection Pool Exhausted

**Symptoms:**
- Intermittent connection errors
- "Too many connections" errors

**Solutions:**

1. **Check Supabase Connection Pool**
   - Go to Supabase dashboard → Settings → Database
   - Check connection pool usage
   - Free tier has connection limits

2. **Optimize Connection String**
   - Use connection pooling if available
   - Consider upgrading Supabase plan if needed

3. **Review Connection Management**
   - Ensure Entity Framework properly disposes connections
   - Check for connection leaks in code

---

### Problem: Tables Not Found

**Symptoms:**
- API errors about missing tables
- "relation does not exist" errors

**Solutions:**

1. **Run Database Schema**
   - Go to Supabase SQL Editor
   - Run `database_schema.sql` completely
   - Verify all tables are created

2. **Check Table Names**
   - Ensure table names match Entity Framework models
   - Check for case sensitivity issues (PostgreSQL is case-sensitive)

3. **Verify Database**
   - Check you're connected to correct database
   - Verify schema is in `public` schema

---

## CORS Issues

### Problem: CORS Errors in Browser

**Symptoms:**
- Browser console shows CORS errors
- "Access-Control-Allow-Origin" errors
- Preflight requests failing

**Solutions:**

1. **Update CORS Configuration**
   - Add Vercel URL to `Program.cs` CORS origins
   - Or set `Cors:AllowAllOrigins=true` in Render environment variables
   - Restart backend service

2. **Verify CORS Policy**
   - Check `Program.cs` CORS configuration
   - Ensure `AllowCredentials()` is set if needed
   - Verify `AllowAnyMethod()` and `AllowAnyHeader()` are included

3. **Check Request Headers**
   - Verify frontend isn't sending blocked headers
   - Check if credentials are being sent

4. **Quick Fix for Development**
   - Temporarily set `Cors:AllowAllOrigins=true` in Render
   - This allows all origins (less secure but works for testing)

---

## Deployment Issues

### Problem: Render Service Spins Down

**Symptoms:**
- First request after inactivity is slow (30-60 seconds)
- Service appears offline

**Solutions:**

1. **This is Normal for Free Tier**
   - Render free tier spins down after 15 min inactivity
   - First request wakes it up (takes 30-60 seconds)
   - Subsequent requests are fast

2. **Keep Service Alive (Optional)**
   - Use UptimeRobot to ping service every 5 minutes
   - Or upgrade to paid plan
   - Or accept the spin-down behavior

---

### Problem: GitHub Actions Fails

**Symptoms:**
- CI/CD pipeline fails
- Tests don't run

**Solutions:**

1. **Check Workflow File**
   - Verify `.github/workflows/deploy.yml` syntax
   - Check YAML indentation
   - Ensure paths are correct

2. **Review Action Logs**
   - Go to GitHub → Actions tab
   - Check specific error messages
   - Verify .NET and Node.js versions

3. **Test Locally**
   - Run build commands locally
   - Ensure all dependencies install correctly

---

### Problem: Environment Variables Not Working

**Symptoms:**
- Variables set but not accessible
- Application uses default values

**Solutions:**

1. **Verify Variable Names**
   - Check exact spelling and case
   - For .NET: Use `__` for nested config (e.g., `ConnectionStrings__DefaultConnection`)
   - For Vite: Must start with `VITE_`

2. **Restart Services**
   - After adding variables, restart/redeploy
   - Render: Manual deploy
   - Vercel: Automatic on push

3. **Check Variable Scope**
   - Ensure variables are set for correct environment
   - Production vs Preview vs Development

---

## General Tips

### Debugging Checklist

1. ✅ Check service logs (Render, Vercel dashboards)
2. ✅ Verify environment variables are set correctly
3. ✅ Test API endpoints directly (Postman, curl, browser)
4. ✅ Check browser console for frontend errors
5. ✅ Verify database connection in Supabase dashboard
6. ✅ Review build logs for deployment errors
7. ✅ Test locally before deploying
8. ✅ Check service status (not paused/spun down)

### Getting Help

1. **Check Service Dashboards**
   - Render: Service logs and metrics
   - Vercel: Build logs and function logs
   - Supabase: Database logs and metrics

2. **Review Documentation**
   - [Render Docs](https://render.com/docs)
   - [Vercel Docs](https://vercel.com/docs)
   - [Supabase Docs](https://supabase.com/docs)

3. **Common Mistakes**
   - Forgetting to add `/api` to API URL
   - Missing `SSL Mode=Require` in connection string
   - CORS not configured for production URLs
   - Environment variables not set or misspelled

---

**Still having issues?** Review the deployment guide step-by-step and verify each configuration.


