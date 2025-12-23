# 🚀 BeyondChats Article Enhancement System

A **modern, modular 3-phase system** that enhances articles using AI-powered content generation, finds relevant references, and displays everything through a beautiful web interface.

**Perfect for:** Content creators, bloggers, and teams who want to automatically improve article quality with AI.

## 📋 Quick Navigation

- [What It Does](#what-it-does)
- [System Requirements](#system-requirements)
- [Quick Start (5 minutes)](#quick-start-5-minutes)
- [Detailed Setup Guide](#detailed-setup-guide)
- [How to Use](#how-to-use)
- [API Reference](#api-reference)
- [Project Structure](#project-structure)
- [Troubleshooting](#troubleshooting)
- [Deployment](#deployment)

---

## 🎯 What It Does

This system has **3 main components** that work together:

1. **Backend API (Laravel/PHP)** - Stores and manages articles in a database
2. **Enhancement Engine (Node.js)** - Uses AI to improve articles and find references
3. **Web Interface (React)** - Beautiful dashboard to view and enhance articles

### Key Features

✨ **AI-Powered Enhancement** - Automatically improves article quality using OpenRouter API
🔍 **Smart References** - Finds and adds relevant reference articles via Google search
📱 **Modern Interface** - Beautiful, responsive web UI with smooth animations
⚡ **Fast & Reliable** - Modular design with clear separation of concerns
🔌 **REST API** - Full CRUD operations for article management

---

## 💻 System Requirements

Before you start, make sure you have these installed on your computer:

### Required Software

| Software | Version | Purpose |
|----------|---------|---------|
| **Node.js** | 18+ | Run JavaScript backend and frontend |
| **PHP** | 8.1+ | Run Laravel backend |
| **PostgreSQL** | 12+ | Store article data |
| **Composer** | Latest | Manage PHP dependencies |
| **npm** or **yarn** | Latest | Manage JavaScript dependencies |

### Required Accounts & API Keys

You'll need to sign up for these free services:

1. **SerpAPI** (for Google search)
   - Sign up at: https://serpapi.com
   - Get your free API key
   - Free tier: 100 searches/month

2. **OpenRouter** (for AI enhancement)
   - Sign up at: https://openrouter.ai
   - Get your API key
   - Free tier: Available with credit

### Check Your System

Run these commands to verify everything is installed:

```bash
# Check Node.js
node --version      # Should be v18 or higher

# Check npm
npm --version       # Should be 8 or higher

# Check PHP
php --version       # Should be 8.1 or higher

# Check PostgreSQL
psql --version      # Should be 12 or higher

# Check Composer
composer --version  # Should be installed
```

---

## ⚡ Quick Start (5 minutes)

If you already have all requirements installed, follow these steps:

### 1. Clone & Navigate
```bash
cd beyond
```

### 2. Setup Backend
```bash
cd backend
composer install
cp env.template .env
php -S localhost:8000 -t public
```

### 3. Setup Enhancement Engine (New Terminal)
```bash
cd backend-node
npm install
# Create .env file with your API keys
npm run server
```

### 4. Setup Frontend (New Terminal)
```bash
cd frontend
npm install
npm run dev
```

### 5. Open in Browser
Visit: **http://localhost:3000** (or the port shown in your terminal)

---

## 📖 Detailed Setup Guide

### Step 1: Install Prerequisites

#### On Windows
```bash
# Install Node.js from: https://nodejs.org/
# Install PHP from: https://www.php.net/downloads
# Install PostgreSQL from: https://www.postgresql.org/download/windows/
# Install Composer from: https://getcomposer.org/download/
```

#### On macOS
```bash
# Using Homebrew (install from https://brew.sh if needed)
brew install node
brew install php
brew install postgresql
brew install composer
```

#### On Linux (Ubuntu/Debian)
```bash
sudo apt update
sudo apt install nodejs npm php php-pgsql postgresql postgresql-contrib composer
```

### Step 2: Setup PostgreSQL Database

```bash
# Start PostgreSQL service
# Windows: Use Services app or run: pg_ctl -D "C:\Program Files\PostgreSQL\data" start
# macOS: brew services start postgresql
# Linux: sudo systemctl start postgresql

# Connect to PostgreSQL
psql -U postgres

# Create database (in psql prompt)
CREATE DATABASE beyondchats;
CREATE USER beyondchats_user WITH PASSWORD 'your_secure_password';
ALTER ROLE beyondchats_user SET client_encoding TO 'utf8';
ALTER ROLE beyondchats_user SET default_transaction_isolation TO 'read committed';
ALTER ROLE beyondchats_user SET default_transaction_deferrable TO on;
ALTER ROLE beyondchats_user SET default_transaction_level TO 'read committed';
GRANT ALL PRIVILEGES ON DATABASE beyondchats TO beyondchats_user;
\q
```

### Step 3: Setup Backend (Laravel)

```bash
# Navigate to backend
cd backend

# Install PHP dependencies
composer install

# Create environment file
cp env.template .env

# Edit .env with your database credentials
# Open .env and update:
# DB_HOST=127.0.0.1
# DB_PORT=5432
# DB_DATABASE=beyondchats
# DB_USERNAME=beyondchats_user
# DB_PASSWORD=your_secure_password

# Generate application key
php artisan key:generate

# Run database migrations
php artisan migrate

# Start the server
php -S localhost:8000 -t public
```

**Expected Output:**
```
[timestamp] PHP Development Server started at http://localhost:8000
```

### Step 4: Setup Enhancement Engine (Node.js)

```bash
# Open a NEW terminal window
cd backend-node

# Install dependencies
npm install

# Create environment file
cp env.template .env

# Edit .env and add your API keys:
# LARAVEL_API_URL=http://localhost:8000/api
# SERPAPI_KEY=your_serpapi_key_here
# OPENROUTER_API_KEY=your_openrouter_key_here
# PORT=3001

# Start the enhancement server
npm run server
```

**Expected Output:**
```
🚀 Article Enhancement API server running on http://localhost:3001
📝 Endpoints:
   POST http://localhost:3001/api/enhance/:articleId
```

### Step 5: Setup Frontend (React)

```bash
# Open a NEW terminal window
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

**Expected Output:**
```
  VITE v4.x.x  ready in xxx ms

  ➜  Local:   http://localhost:3000/
  ➜  press h to show help
```

### Step 6: Verify Everything Works

1. Open **http://localhost:3000** in your browser
2. You should see the BeyondChats interface
3. Check that all three services are running:
   - Backend: http://localhost:8000/api/articles (should return empty array `[]`)
   - Enhancement: http://localhost:3001 (should be accessible)
   - Frontend: http://localhost:3000 (should load the UI)

---

## 🎮 How to Use

### Using the Web Interface

1. **View Articles**
   - Open http://localhost:3000
   - Articles will appear in a grid layout

2. **Enhance an Article**
   - Click the "✨ Enhance" button on any article card
   - Wait for the enhancement to complete (1-2 minutes)
   - The article will be updated with improved content

3. **View Enhanced Article**
   - Click on an enhanced article to see full details
   - View reference articles that were found
   - See the improved content

### Using the API Directly

```bash
# Get all articles
curl http://localhost:8000/api/articles

# Get single article
curl http://localhost:8000/api/articles/1

# Create article
curl -X POST http://localhost:8000/api/articles \
  -H "Content-Type: application/json" \
  -d '{
    "title": "My Article",
    "content": "Article content here",
    "original_url": "https://example.com/article"
  }'

# Enhance article
curl -X POST http://localhost:3001/api/enhance/1
```

---

## 🔌 API Reference

### Backend API (Laravel)

#### Get All Articles
```
GET /api/articles
Response: Array of articles
```

#### Get Single Article
```
GET /api/articles/{id}
Response: Article object with all details
```

#### Create Article
```
POST /api/articles
Body: {
  "title": "string",
  "content": "string",
  "original_url": "string (optional)",
  "published_date": "date (optional)"
}
Response: Created article object
```

#### Update Article
```
PUT /api/articles/{id}
Body: Same as create (any field optional)
Response: Updated article object
```

#### Delete Article
```
DELETE /api/articles/{id}
Response: Success message
```

### Enhancement API (Node.js)

#### Enhance Article
```
POST /api/enhance/{articleId}
Response: {
  "success": true,
  "message": "Article enhanced successfully",
  "article": { enhanced article object }
}
```

---

## 📁 Project Structure

```
beyond/
├── backend/                    # Laravel API Server
│   ├── app/
│   │   ├── Http/Controllers/   # API endpoints
│   │   ├── Models/             # Database models
│   │   └── Console/Commands/   # Artisan commands
│   ├── database/
│   │   └── migrations/         # Database schema
│   ├── routes/
│   │   └── api.php             # API routes
│   ├── .env                    # Configuration (create from env.template)
│   ├── composer.json           # PHP dependencies
│   └── public/
│       └── index.php           # Entry point
│
├── backend-node/               # Enhancement Engine
│   ├── server.js               # Express API server
│   ├── enhanceArticle.js       # AI enhancement logic
│   ├── searchGoogle.js         # Google search integration
│   ├── scrapeContent.js        # Web scraping
│   ├── fetchArticle.js         # Fetch from backend API
│   ├── publishArticle.js       # Publish enhanced articles
│   ├── .env                    # Configuration (create from env.template)
│   ├── package.json            # Node dependencies
│   └── index.js                # Standalone script
│
├── frontend/                   # React Web Interface
│   ├── src/
│   │   ├── App.jsx             # Main component
│   │   ├── api.js              # API client
│   │   ├── styles.css          # Global styles
│   │   └── components/
│   │       ├── ArticleList.jsx # Article listing
│   │       └── ArticleDetail.jsx # Article detail view
│   ├── index.html              # HTML entry point
│   ├── vite.config.js          # Vite configuration
│   └── package.json            # Node dependencies
│
└── README.md                   # This file
```

---

## 🐛 Troubleshooting

### Backend Issues

**Error: "Connection refused" or "Cannot connect to database"**
- Make sure PostgreSQL is running
- Check database credentials in `.env`
- Verify database exists: `psql -U postgres -l`

**Error: "Port 8000 already in use"**
```bash
# Use a different port
php -S localhost:8001 -t public
```

**Error: "Composer not found"**
- Install Composer from https://getcomposer.org/download/
- Add to PATH if on Windows

### Enhancement Engine Issues

**Error: "Cannot find module" or "npm ERR!"**
```bash
# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

**Error: "Invalid API key"**
- Check your `.env` file has correct keys
- Verify keys from SerpAPI and OpenRouter dashboards
- Make sure there are no extra spaces in `.env`

**Error: "Port 3001 already in use"**
- Change PORT in `.env` to another number (e.g., 3002)

### Frontend Issues

**Error: "Cannot GET /" or blank page**
- Make sure backend is running on port 8000
- Check browser console for errors (F12)
- Clear browser cache and reload

**Error: "Failed to fetch articles"**
- Verify backend is running: http://localhost:8000/api/articles
- Check VITE_API_URL in frontend/.env
- Check browser console for CORS errors

**Error: "npm run dev" doesn't start**
```bash
# Try clearing cache
npm cache clean --force
rm -rf node_modules
npm install
npm run dev
```

### Database Issues

**Error: "SQLSTATE[22P02]"**
- This is usually a data type mismatch
- Check that all required fields are provided
- Verify database schema is up to date

**Error: "Database beyondchats does not exist"**
```bash
# Recreate the database
psql -U postgres
CREATE DATABASE beyondchats;
\q
```

---

## 🚀 Deployment

### Deploy to Production

For deployment instructions, see the [Deployment Guide](./DEPLOYMENT.md)

Quick options:
- **Backend**: Heroku, Railway, Render
- **Frontend**: Vercel, Netlify, GitHub Pages
- **Database**: AWS RDS, Heroku Postgres, Railway

---

## 📝 Environment Variables Reference

### Backend (.env)
```env
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=beyondchats
DB_USERNAME=beyondchats_user
DB_PASSWORD=your_password
APP_KEY=base64:xxxxx (generated by php artisan key:generate)
```

### Enhancement Engine (.env)
```env
LARAVEL_API_URL=http://localhost:8000/api
SERPAPI_KEY=your_serpapi_key
OPENROUTER_API_KEY=your_openrouter_key
PORT=3001
```

### Frontend (.env - Optional)
```env
VITE_API_URL=http://localhost:8000/api
VITE_ENHANCEMENT_API_URL=http://localhost:3001
```

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

## 📄 License

This project is open source and available under the MIT License.

---

## � Deployment Guide

This section explains how to deploy the BeyondChats system to production so it's accessible online.

### Architecture Overview

The system has 3 independent components that can be deployed separately:

1. **Backend (Laravel/PHP)** - REST API server
2. **Enhancement Engine (Node.js)** - AI enhancement service
3. **Frontend (React)** - Web interface

### Deployment Options

#### Option 1: Deploy Everything to One Platform (Recommended for Beginners)

**Platforms:** Railway, Render, Fly.io, Heroku

**Steps:**
1. Push your code to GitHub (public repository)
2. Connect GitHub to your chosen platform
3. Set environment variables for each component
4. Deploy all three services

**Pros:** Simple, integrated, easy to manage
**Cons:** May be more expensive if all on same platform

#### Option 2: Deploy to Different Platforms (Recommended for Production)

**Backend:** Railway, Render, or AWS
**Frontend:** Vercel or Netlify
**Database:** AWS RDS, Railway, or Heroku Postgres

**Pros:** Optimized for each component, better scalability
**Cons:** More complex setup

### Step-by-Step Deployment Instructions

#### 1. Prepare Your Code

```bash
# Make sure your code is clean and committed
git add .
git commit -m "Ready for deployment"
git push origin main
```

#### 2. Deploy Backend (Laravel)

**Using Railway (Recommended):**

1. Go to https://railway.app
2. Click "New Project" → "Deploy from GitHub"
3. Select your repository
4. Choose the `backend/` directory as root
5. Add environment variables:
   ```
   APP_ENV=production
   APP_DEBUG=false
   APP_KEY=base64:YOUR_KEY_HERE
   DB_CONNECTION=pgsql
   DB_HOST=your-db-host
   DB_PORT=5432
   DB_DATABASE=beyondchats
   DB_USERNAME=your-db-user
   DB_PASSWORD=your-db-password
   ```
6. Add PostgreSQL database service
7. Deploy

**Result:** Your backend API will be at `https://your-app.railway.app/api`

#### 3. Deploy Frontend (React)

**Using Vercel (Recommended):**

1. Go to https://vercel.com
2. Click "New Project" → "Import Git Repository"
3. Select your repository
4. Set root directory to `frontend/`
5. Add environment variables:
   ```
   VITE_API_URL=https://your-backend-url/api
   VITE_ENHANCEMENT_API_URL=https://your-enhancement-url
   ```
6. Deploy

**Result:** Your frontend will be at `https://your-app.vercel.app`

#### 4. Deploy Enhancement Engine (Node.js)

**Using Railway:**

1. Create new service in Railway
2. Select GitHub repository
3. Set root directory to `backend-node/`
4. Add environment variables:
   ```
   LARAVEL_API_URL=https://your-backend-url/api
   SERPAPI_KEY=your-serpapi-key
   OPENROUTER_API_KEY=your-openrouter-key
   PORT=3000
   ```
5. Deploy

**Result:** Your enhancement API will be at `https://your-enhancement.railway.app`

### Environment Variables for Production

**Backend (.env):**
```env
APP_ENV=production
APP_DEBUG=false
APP_KEY=base64:YOUR_GENERATED_KEY
APP_URL=https://your-backend-url

DB_CONNECTION=pgsql
DB_HOST=your-database-host
DB_PORT=5432
DB_DATABASE=beyondchats
DB_USERNAME=your-db-user
DB_PASSWORD=your-db-password
```

**Enhancement Engine (.env):**
```env
LARAVEL_API_URL=https://your-backend-url/api
SERPAPI_KEY=your-actual-serpapi-key
OPENROUTER_API_KEY=your-actual-openrouter-key
PORT=3000
NODE_ENV=production
```

**Frontend (.env):**
```env
VITE_API_URL=https://your-backend-url/api
VITE_ENHANCEMENT_API_URL=https://your-enhancement-url
```

### Database Setup for Production

1. **Create PostgreSQL Database:**
   - Use your hosting provider's managed database service
   - Note the connection details (host, port, username, password)

2. **Run Migrations:**
   ```bash
   # From your local machine or deployment platform
   php artisan migrate --force
   ```

3. **Or Manually Create Tables:**
   - Run the SQL from `backend/create_table.sql` in your database

### Monitoring & Maintenance

**Check Logs:**
- Railway: Dashboard → Logs tab
- Vercel: Deployments → Logs
- Check error messages regularly

**Update Environment Variables:**
- If you change API keys, update them in your platform's settings
- Redeploy if needed

**Database Backups:**
- Enable automatic backups in your database service
- Test restore procedures regularly

### Troubleshooting Deployment

**Issue: "Cannot connect to database"**
- Verify database credentials in environment variables
- Check database is running and accessible
- Ensure firewall allows connections

**Issue: "API returns 500 error"**
- Check backend logs for error messages
- Verify all environment variables are set
- Check database migrations ran successfully

**Issue: "Frontend cannot reach backend"**
- Verify `VITE_API_URL` is correct
- Check CORS is enabled in backend
- Ensure backend is running and accessible

**Issue: "Enhancement API not working"**
- Verify API keys (SerpAPI, OpenRouter) are valid
- Check `LARAVEL_API_URL` points to correct backend
- Review enhancement service logs

### Cost Estimation

**Free/Low-Cost Options:**
- Railway: Free tier with $5/month credit
- Vercel: Free tier for frontend
- Render: Free tier with limitations
- Heroku: Paid (no free tier anymore)

**Estimated Monthly Cost:**
- Backend: $5-10/month
- Frontend: Free (Vercel)
- Database: $5-15/month
- **Total: $10-25/month**

### Production Checklist

Before going live:

- [ ] All environment variables set correctly
- [ ] Database backups enabled
- [ ] SSL/HTTPS enabled (automatic on most platforms)
- [ ] Error logging configured
- [ ] API rate limiting set up
- [ ] CORS properly configured
- [ ] Database migrations ran successfully
- [ ] Test all features in production
- [ ] Monitor logs for errors
- [ ] Set up alerts for critical errors

### Scaling Considerations

**If traffic increases:**
1. Upgrade database tier
2. Enable caching (Redis)
3. Use CDN for static assets
4. Add load balancing
5. Optimize database queries

---

## �💬 Support

If you encounter any issues:

1. Check the [Troubleshooting](#troubleshooting) section
2. Check that all services are running
3. Verify all API keys are correct
4. Check the browser console for errors (F12)
5. Check terminal output for error messages

---

**Last Updated:** December 23, 2025
**Version:** 1.0.0


