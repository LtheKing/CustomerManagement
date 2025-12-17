# 🚀 Customer Management Application - Free Deployment Guide

This guide provides step-by-step instructions to deploy your Customer Management application using free hosting services.

## 📋 Deployment Stack Overview

- **Frontend Hosting:** Vercel (React/Vite)
- **Backend Hosting:** Render (Free Tier)
- **Database:** Supabase (Free PostgreSQL)
- **CI/CD:** GitHub Actions
- **Domain:** Vercel Free Domain
- **Monitoring:** UptimeRobot (Optional)

---

## 📦 Prerequisites

Before starting, ensure you have:
- ✅ GitHub account
- ✅ Git installed on your machine
- ✅ Code pushed to a GitHub repository
- ✅ Basic understanding of environment variables

---

## 🗄️ Step 1: Set Up Database (Supabase)

### 1.1 Create Supabase Account
1. Go to [https://supabase.com](https://supabase.com)
2. Click **"Start your project"** or **"Sign Up"**
3. Sign up with GitHub (recommended) or email
4. Verify your email if required

### 1.2 Create a New Project
1. Click **"New Project"** in your dashboard
2. Fill in the details:
   - **Name:** `customer-management-db`
   - **Database Password:** Create a strong password (save it securely!)
   - **Region:** Choose closest to your users
   - **Pricing Plan:** Free
3. Click **"Create new project"**
4. Wait 2-3 minutes for project provisioning

### 1.3 Get Database Connection Details
1. Once project is ready, go to **Settings** → **Database**
2. Scroll to **"Connection string"** section
3. Copy the **"URI"** connection string (it looks like: `postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres`)
4. Also note:
   - **Host:** `db.xxxxx.supabase.co`
   - **Port:** `5432`
   - **Database:** `postgres`
   - **User:** `postgres`
   - **Password:** (the one you created)

### 1.4 Run Database Schema
1. Go to **SQL Editor** in Supabase dashboard
2. Click **"New query"**
3. Copy the entire contents of `database_schema.sql` from your project
4. Paste into the SQL editor
5. Click **"Run"** (or press Ctrl+Enter)
6. Verify tables are created by checking **Table Editor** → you should see:
   - Users
   - Products
   - Customers
   - Sales
   - CustomerTraffic
   - SalesTransactionItems

### 1.5 (Optional) Seed Sample Data
1. If you have `sample_data.sql`, run it in the SQL Editor
2. Or use the seed endpoint after deploying the API

---

## 🔧 Step 2: Prepare Your Code for Deployment

### 2.1 Update CORS Configuration
We need to update the backend to allow requests from your Vercel frontend.

**File:** `customer.management.api/Program.cs`

Update the CORS policy to include your Vercel domain:

```csharp
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp", policy =>
    {
        policy.WithOrigins(
            "http://localhost:5173", 
            "http://localhost:3000", 
            "https://localhost:4372",
            "http://localhost:80",
            "http://frontend:5173", 
            "http://frontend:80",
            "https://your-app-name.vercel.app",  // Add your Vercel URL here
            "https://*.vercel.app"  // Allow all Vercel preview deployments
        )
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});
```

### 2.2 Create Production Dockerfile for Backend
Create a production-optimized Dockerfile if needed. The existing one should work, but ensure it's configured for production.

### 2.3 Create Production Build Configuration for Frontend
Check if you have a production Dockerfile. We'll use Vercel's build system instead.

### 2.4 Update Frontend API Configuration
The frontend already uses environment variables (`VITE_API_BASE_URL`), which is perfect for Vercel.

---

## 🎯 Step 3: Deploy Backend API (Render)

### 3.1 Create Render Account
1. Go to [https://render.com](https://render.com)
2. Click **"Get Started for Free"**
3. Sign up with GitHub (recommended)
4. Verify your email

### 3.2 Create Web Service
1. In Render dashboard, click **"New +"** → **"Web Service"**
2. Connect your GitHub repository
3. Select the repository containing your Customer Management app
4. Configure the service:
   - **Name:** `customer-management-api`
   - **Region:** Choose closest to your users
   - **Branch:** `main` (or your default branch)
   - **Root Directory:** `customer.management.api` (if your API is in a subfolder)
   - **Runtime:** `Docker`
   - **Dockerfile Path:** `customer.management.api/Dockerfile`
   - **Docker Context:** `.` (root of repository)

### 3.3 Configure Environment Variables
Click **"Environment"** tab and add:

```
ASPNETCORE_ENVIRONMENT=Production
ASPNETCORE_URLS=http://+:8080
ConnectionStrings__DefaultConnection=Host=db.xxxxx.supabase.co;Port=5432;Database=postgres;Username=postgres;Password=YOUR_SUPABASE_PASSWORD;SSL Mode=Require;
```

**Important:** Replace `db.xxxxx.supabase.co` and `YOUR_SUPABASE_PASSWORD` with your actual Supabase credentials.

### 3.4 Configure Build Settings
- **Build Command:** (Leave empty, Docker handles this)
- **Start Command:** (Leave empty, Docker handles this)

### 3.5 Deploy
1. Click **"Create Web Service"**
2. Render will start building your Docker image
3. Wait 5-10 minutes for the first deployment
4. Once deployed, note your service URL: `https://customer-management-api.onrender.com`

### 3.6 Update CORS with Render URL
1. Go back to your code repository
2. Update `Program.cs` CORS to include your Render URL:
   ```csharp
   policy.WithOrigins(
       // ... existing origins ...
       "https://customer-management-api.onrender.com"
   )
   ```
3. Commit and push changes
4. Render will auto-deploy the update

---

## 🎨 Step 4: Deploy Frontend (Vercel)

### 4.1 Create Vercel Account
1. Go to [https://vercel.com](https://vercel.com)
2. Click **"Sign Up"**
3. Sign up with GitHub (recommended)
4. Authorize Vercel to access your repositories

### 4.2 Import Project
1. Click **"Add New..."** → **"Project"**
2. Import your GitHub repository
3. Select the repository containing your Customer Management app

### 4.3 Configure Project Settings
- **Framework Preset:** Vite
- **Root Directory:** `customer.management.front.end`
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Install Command:** `npm install`

### 4.4 Add Environment Variables
Click **"Environment Variables"** and add:

```
VITE_API_BASE_URL=https://customer-management-api.onrender.com/api
```

**Important:** Replace with your actual Render API URL.

### 4.5 Deploy
1. Click **"Deploy"**
2. Wait 2-3 minutes for build and deployment
3. Once deployed, you'll get a URL like: `https://customer-management-frontend.vercel.app`

### 4.6 Update Backend CORS
1. Go back to your code
2. Update `Program.cs` CORS to include your Vercel URL
3. Commit and push
4. Both Vercel and Render will auto-deploy

---

## 🔄 Step 5: Set Up CI/CD (GitHub Actions)

### 5.1 Create GitHub Actions Workflow
Create the directory structure:
```
.github/
  workflows/
    deploy.yml
```

### 5.2 Create Workflow File
Create `.github/workflows/deploy.yml` with:

```yaml
name: Deploy Application

on:
  push:
    branches: [ main, master ]
  pull_request:
    branches: [ main, master ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup .NET
      uses: actions/setup-dotnet@v3
      with:
        dotnet-version: '8.0.x'
    
    - name: Restore dependencies
      run: dotnet restore
      working-directory: ./customer.management.api
    
    - name: Build
      run: dotnet build --no-restore
      working-directory: ./customer.management.api
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
    
    - name: Install frontend dependencies
      run: npm ci
      working-directory: ./customer.management.front.end
    
    - name: Build frontend
      run: npm run build
      working-directory: ./customer.management.front.end

  # Note: Actual deployment is handled by Vercel and Render
  # This workflow is for testing builds
```

### 5.3 Commit and Push
1. Commit the workflow file
2. Push to GitHub
3. Check **Actions** tab in GitHub to see the workflow run

---

## 🌐 Step 6: Configure Custom Domain (Optional)

### 6.1 Using Vercel Free Domain
1. In Vercel dashboard, go to your project
2. Click **"Settings"** → **"Domains"**
3. Vercel provides a free `.vercel.app` domain automatically
4. You can add a custom domain if you have one

### 6.2 Using Freenom (Free Domain)
1. Go to [https://www.freenom.com](https://www.freenom.com)
2. Search for available free domains (.tk, .ml, .ga, .cf, .gq)
3. Register a domain
4. In Vercel, add the domain in **Settings** → **Domains**
5. Update DNS records as instructed by Vercel

---

## 📊 Step 7: Set Up Monitoring (UptimeRobot)

### 7.1 Create UptimeRobot Account
1. Go to [https://uptimerobot.com](https://uptimerobot.com)
2. Sign up for free account
3. Verify your email

### 7.2 Add Monitors
1. Click **"Add New Monitor"**
2. Configure:
   - **Monitor Type:** HTTP(s)
   - **Friendly Name:** Customer Management API
   - **URL:** `https://customer-management-api.onrender.com/api/seed/test`
   - **Monitoring Interval:** 5 minutes (free tier)
3. Add another monitor for frontend:
   - **Friendly Name:** Customer Management Frontend
   - **URL:** `https://customer-management-frontend.vercel.app`
4. Click **"Create Monitor"**

### 7.3 Set Up Alerts
1. Go to **"My Settings"** → **"Alert Contacts"**
2. Add your email for notifications
3. Monitors will alert you if services go down

---

## ✅ Step 8: Final Verification

### 8.1 Test Backend API
1. Visit: `https://customer-management-api.onrender.com/swagger` (if Swagger is enabled in production)
2. Or test: `https://customer-management-api.onrender.com/api/seed/test`
3. Should return connection status

### 8.2 Test Frontend
1. Visit your Vercel URL
2. Check browser console for errors
3. Test API calls from the frontend

### 8.3 Test Database Connection
1. Use the seed endpoint: `POST https://customer-management-api.onrender.com/api/seed`
2. Check Supabase dashboard to verify data was created

---

## 🔧 Troubleshooting

### Backend Issues

**Problem:** API not connecting to database
- **Solution:** Verify connection string in Render environment variables
- Ensure SSL mode is set: `SSL Mode=Require;`
- Check Supabase database is running

**Problem:** CORS errors
- **Solution:** Update CORS in `Program.cs` to include your Vercel URL
- Ensure credentials are allowed if needed

**Problem:** Build fails on Render
- **Solution:** Check Dockerfile path is correct
- Verify Docker context includes all necessary files

### Frontend Issues

**Problem:** API calls failing
- **Solution:** Verify `VITE_API_BASE_URL` environment variable in Vercel
- Check CORS configuration in backend
- Ensure API URL includes `/api` path

**Problem:** Build fails on Vercel
- **Solution:** Check `package.json` has correct build script
- Verify `vite.config.ts` is properly configured
- Check build logs in Vercel dashboard

### Database Issues

**Problem:** Connection timeout
- **Solution:** Supabase free tier has connection limits
- Check Supabase dashboard for connection pool status
- Consider upgrading if needed

---

## 📝 Important Notes

### Free Tier Limitations

1. **Render:**
   - Free tier services spin down after 15 minutes of inactivity
   - First request after spin-down takes 30-60 seconds
   - 750 hours/month free

2. **Supabase:**
   - 500MB database storage
   - 2GB bandwidth/month
   - Connection pool limits

3. **Vercel:**
   - 100GB bandwidth/month
   - Unlimited requests
   - Automatic HTTPS

4. **UptimeRobot:**
   - 50 monitors
   - 5-minute check interval
   - Email alerts only

### Cost Optimization Tips

- Use Supabase connection pooling for better performance
- Consider upgrading Render to prevent spin-downs (if needed)
- Monitor usage in all platforms
- Set up alerts before hitting limits

---

## 🎉 Success Checklist

- [ ] Database created and schema applied in Supabase
- [ ] Backend deployed on Render with correct environment variables
- [ ] Frontend deployed on Vercel with API URL configured
- [ ] CORS updated to allow frontend-backend communication
- [ ] GitHub Actions workflow created and tested
- [ ] Custom domain configured (optional)
- [ ] UptimeRobot monitors set up
- [ ] Application tested end-to-end
- [ ] All environment variables secured

---

## 📚 Additional Resources

- [Render Documentation](https://render.com/docs)
- [Vercel Documentation](https://vercel.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)

---

## 🆘 Need Help?

If you encounter issues:
1. Check service logs (Render, Vercel dashboards)
2. Verify environment variables are set correctly
3. Test API endpoints directly
4. Check browser console for frontend errors
5. Review Supabase connection logs

---

**Happy Deploying! 🚀**


