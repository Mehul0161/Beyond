# BeyondChats Article Enhancement System

A **modular, production-ready 3-phase system** that automatically scrapes articles from the BeyondChats blog, enhances them using AI-powered content generation, and displays them through a modern web interface.

## 📋 Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Technology Stack](#technology-stack)
- [Prerequisites](#prerequisites)
- [Installation & Setup](#installation--setup)
- [API Documentation](#api-documentation)
- [Environment Variables](#environment-variables)
- [Project Structure](#project-structure)
- [Development Workflow](#development-workflow)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [Deployment & Live Link](#deployment--live-link)

---

## 🎯 Overview

This system consists of three independent but interconnected components:

1. **Backend (Laravel/PHP)** - RESTful API server that manages article data in PostgreSQL
2. **Enhancement Script (Node.js)** - Automated pipeline that enhances articles using Google search and AI
3. **Frontend (React)** - Modern web interface for viewing articles

### Key Features

- ✅ **Automated Scraping**: Scrapes the 5 oldest articles from BeyondChats blog
- ✅ **AI Enhancement**: Uses OpenRouter API with `xiaomi/mimo-v2-flash:free` model to improve content
- ✅ **Reference Integration**: Automatically finds and cites reference articles via Google search
- ✅ **RESTful API**: Complete CRUD operations for article management
- ✅ **Modern UI**: Responsive React frontend with article listing and detail views
- ✅ **Modular Design**: Each component has a single responsibility and minimal dependencies

---

## 🏗️ Architecture

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         BeyondChats System                       │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────┐         ┌──────────────────┐         ┌──────────────────┐
│   Backend API    │         │ Enhancement      │         │   Frontend UI    │
│   (Laravel/PHP)  │         │ Script (Node.js) │         │   (React/Vite)   │
├──────────────────┤         ├──────────────────┤         ├──────────────────┤
│                  │         │                  │         │                  │
│  PostgreSQL DB  │◄────────┤  SerpAPI         │         │  HTTP Requests   │
│  (articles)      │         │  (Google Search) │         │  to Backend API  │
│                  │         │                  │         │                  │
│  REST API        │◄────────┤  OpenRouter API   │         │  Article List    │
│  /api/articles   │         │  (LLM Enhancement)│         │  Article Detail │
│                  │         │                  │         │                  │
└──────────────────┘         └──────────────────┘         └──────────────────┘
        ▲                              │                            │
        │                              │                            │
        └──────────────────────────────┴────────────────────────────┘
                        HTTP/JSON Communication
```

### Data Flow

```
1. SCRAPING PHASE
   ┌─────────────────┐
   │ BeyondChats.com │
   │   Blog Pages    │
   └────────┬────────┘
             │
             ▼
   ┌─────────────────┐      ┌──────────────┐
   │ Laravel Scraper  │─────►│  PostgreSQL  │
   │  (Artisan Cmd)   │      │   Database   │
   └─────────────────┘      └──────────────┘

2. ENHANCEMENT PHASE
   ┌──────────────┐
   │  PostgreSQL  │
   │   Database   │
   └──────┬───────┘
          │
          ▼
   ┌─────────────────┐      ┌──────────────┐
   │ Fetch Latest     │─────►│  SerpAPI     │
   │ Non-Enhanced     │      │  (Google)    │
   │ Article          │      └──────┬───────┘
   └─────────────────┘             │
                                    ▼
                            ┌──────────────┐
                            │ Scrape Top 2 │
                            │  References  │
                            └──────┬───────┘
                                   │
                                   ▼
                            ┌──────────────┐      ┌──────────────┐
                            │  OpenRouter  │─────►│  PostgreSQL  │
                            │  (LLM API)   │      │   Database   │
                            └──────────────┘      └──────────────┘

3. DISPLAY PHASE
   ┌──────────────┐
   │  PostgreSQL  │
   │   Database   │
   └──────┬───────┘
          │
          ▼
   ┌─────────────────┐      ┌──────────────┐
   │  Backend API     │─────►│  React UI    │
   │  /api/articles   │      │  (Browser)   │
   └─────────────────┘      └──────────────┘
```

### Component Responsibilities

| Component | Responsibility | Technology |
|-----------|---------------|------------|
| **Backend** | Data persistence, API endpoints, article scraping | Laravel, PostgreSQL, Guzzle, DomCrawler |
| **Enhancement Script** | Article enhancement orchestration | Node.js, Axios, Cheerio, OpenRouter API |
| **Frontend** | User interface, article display | React, Vite, Axios |

---

## 🛠️ Technology Stack

### Backend
- **Framework**: Laravel 10.x (PHP 8.1+)
- **Database**: PostgreSQL 18+
- **HTTP Client**: Guzzle 7.x
- **Web Scraping**: Symfony DomCrawler 6.x
- **Server**: PHP Built-in Server (`php -S`)

### Enhancement Script
- **Runtime**: Node.js 18+
- **HTTP Client**: Axios 1.6+
- **Web Scraping**: Cheerio 1.0+, JSDOM 24.0+
- **Content Extraction**: Mozilla Readability 0.4+
- **AI Provider**: OpenRouter API (`xiaomi/mimo-v2-flash:free`)
- **Search Provider**: SerpAPI

### Frontend
- **Framework**: React 18+
- **Build Tool**: Vite 5.x
- **HTTP Client**: Axios 1.6+
- **Styling**: CSS (no framework dependencies)

---

## 📦 Prerequisites

Before starting, ensure you have the following installed:

### Required Software

- **PHP 8.1+** (tested with PHP 8.5)
  - Extensions: `pdo_pgsql`, `zip`, `fileinfo`, `curl`, `openssl`
- **PostgreSQL 18+** (or compatible version)
- **Node.js 18+** and npm
- **Composer** (PHP dependency manager)

### Required API Keys

1. **SerpAPI Key**
   - Sign up at: https://serpapi.com/
   - Free tier: 100 searches/month
   - Get your key from: https://serpapi.com/dashboard

2. **OpenRouter API Key**
   - Sign up at: https://openrouter.ai/
   - Get your key from: https://openrouter.ai/keys
   - Model used: `xiaomi/mimo-v2-flash:free` (free tier available)

### Database Setup

Create a PostgreSQL database:

```sql
CREATE DATABASE beyondchats;
```

Or via command line:

```bash
# Windows PowerShell
$env:PGPASSWORD="your_password"
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -c "CREATE DATABASE beyondchats;"

# Linux/Mac
createdb -U postgres beyondchats
```

---

## 🚀 Installation & Setup

### Phase 1: Backend Setup

#### Step 1: Install Dependencies

```bash
cd backend
composer install
```

This installs all PHP dependencies including Laravel framework, Guzzle, and DomCrawler.

#### Step 2: Configure Environment

Copy the environment template and create your `.env` file:

```bash
# Windows PowerShell
Copy-Item env.template .env

# Linux/Mac
cp env.template .env
```

Edit `backend/.env` and configure:

```env
APP_NAME=BeyondChats
APP_ENV=local
APP_KEY=base64:YOUR_GENERATED_KEY_HERE
APP_DEBUG=true
APP_URL=http://localhost

DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=beyondchats
DB_USERNAME=postgres
DB_PASSWORD=your_postgres_password_here
```

**Generate Application Key** (if needed):

```bash
php artisan key:generate
```

#### Step 3: Database Setup

**Option A: Using Migrations** (if Laravel migrations work):

```bash
php artisan migrate
```

**Option B: Manual SQL** (recommended if migrations fail):

Run the SQL script directly:

```bash
# Windows PowerShell
$env:PGPASSWORD="your_password"
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -d beyondchats -f create_table.sql

# Linux/Mac
psql -U postgres -d beyondchats -f create_table.sql
```

Or manually execute the SQL in `backend/create_table.sql` using pgAdmin or psql.

#### Step 4: Start Backend Server

```bash
php -S localhost:8000 -t public
```

**Verify Backend is Running:**

Open http://localhost:8000/api/articles in your browser. You should see:

```json
[]
```

(Empty array is expected if no articles are scraped yet)

#### Step 5: Scrape Initial Articles

In a **new terminal**:

```bash
cd backend
php artisan scrape:articles
```

**Expected Output:**

```
Starting to scrape BeyondChats articles...
Found last page: X
Found 5 articles to save.
Saved: Article Title 1
Saved: Article Title 2
...
Successfully saved 5 articles.
```

**Verify Articles:**

```bash
# Check via API
curl http://localhost:8000/api/articles

# Or open in browser
# http://localhost:8000/api/articles
```

---

### Phase 2: Enhancement Script Setup

#### Step 1: Install Dependencies

```bash
cd enhancement-script
npm install
```

This installs:
- `axios` - HTTP client
- `cheerio` - HTML parsing
- `jsdom` - DOM manipulation
- `@mozilla/readability` - Content extraction
- `dotenv` - Environment variable management

#### Step 2: Configure Environment

Create `enhancement-script/.env`:

```env
LARAVEL_API_URL=http://localhost:8000/api
SERPAPI_KEY=your_serpapi_key_here
OPENROUTER_API_KEY=sk-or-v1-your_openrouter_key_here
```

**Important Notes:**
- Replace `your_serpapi_key_here` with your actual SerpAPI key
- Replace `your_openrouter_key_here` with your actual OpenRouter key
- No spaces around `=` signs
- Keys should be on single lines (no line breaks)

#### Step 3: Run Enhancement Script

**Prerequisites:**
- Backend server must be running (`php -S localhost:8000 -t public`)
- At least one non-enhanced article must exist in the database

**Run the script:**

```bash
cd enhancement-script
npm start
```

**Expected Output:**

```
Starting article enhancement process...

Step 1: Fetching latest article...
Found article: "Article Title" (ID: 1)

Step 2: Searching Google for reference articles...
Found 2 reference URLs:
  1. https://example.com/article1
  2. https://example.com/article2

Step 3: Scraping reference articles...
  Scraping article 1...
  ✓ Scraped: "Reference Article Title 1"
  Scraping article 2...
  ✓ Scraped: "Reference Article Title 2"

Successfully scraped 2 reference articles

Step 4: Enhancing article with LLM...
✓ Article enhanced: "Enhanced Article Title"

Step 5: Publishing enhanced article...
✓ Article published successfully! (ID: 2)

Article enhancement process completed successfully!
```

**What Happens:**
1. Fetches the latest article where `is_enhanced = false`
2. Searches Google using SerpAPI for the article title
3. Filters results to find blog/article URLs (excludes social media, PDFs)
4. Scrapes content from top 2 reference URLs
5. Sends original + references to OpenRouter LLM for enhancement
6. Publishes enhanced article back to backend API

---

### Phase 3: Frontend Setup

#### Step 1: Install Dependencies

```bash
cd frontend
npm install
```

#### Step 2: Configure Environment (Optional)

Create `frontend/.env` if you want to customize the API URL:

```env
VITE_API_URL=http://localhost:8000/api
```

**Note:** If not set, defaults to `http://localhost:8000/api` (see `src/api.js`)

#### Step 3: Start Development Server

```bash
npm run dev
```

**Expected Output:**

```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: use --host to expose
```

**Access the Application:**

Open http://localhost:3000 in your browser.

**Features:**
- **Article List**: Shows all articles (original + enhanced)
- **Enhanced Badge**: Enhanced articles are marked with a badge
- **Article Detail**: Click any article to view full content
- **Reference URLs**: Enhanced articles show their reference URLs

---

## 📚 API Documentation

### Base URL

```
http://localhost:8000/api
```

### Endpoints

#### 1. List All Articles

**GET** `/articles`

**Response:**

```json
[
  {
    "id": 1,
    "title": "Article Title",
    "content": "<p>Article content...</p>",
    "original_url": "https://beyondchats.com/blog/article",
    "published_date": "2024-01-15",
    "is_enhanced": false,
    "original_article_id": null,
    "reference_urls": null,
    "created_at": "2024-01-15T10:00:00.000000Z",
    "updated_at": "2024-01-15T10:00:00.000000Z"
  },
  {
    "id": 2,
    "title": "Enhanced Article Title",
    "content": "<p>Enhanced content...</p>",
    "original_url": null,
    "published_date": "2024-01-15",
    "is_enhanced": true,
    "original_article_id": 1,
    "reference_urls": [
      "https://example.com/ref1",
      "https://example.com/ref2"
    ],
    "created_at": "2024-01-15T11:00:00.000000Z",
    "updated_at": "2024-01-15T11:00:00.000000Z"
  }
]
```

**Query Parameters:** None

**Status Codes:**
- `200 OK` - Success

---

#### 2. Get Single Article

**GET** `/articles/{id}`

**Response:**

```json
{
  "id": 1,
  "title": "Article Title",
  "content": "<p>Article content...</p>",
  "original_url": "https://beyondchats.com/blog/article",
  "published_date": "2024-01-15",
  "is_enhanced": false,
  "original_article_id": null,
  "reference_urls": null,
  "created_at": "2024-01-15T10:00:00.000000Z",
  "updated_at": "2024-01-15T10:00:00.000000Z"
}
```

**Status Codes:**
- `200 OK` - Success
- `404 Not Found` - Article doesn't exist

---

#### 3. Create Article

**POST** `/articles`

**Request Body:**

```json
{
  "title": "New Article Title",
  "content": "<p>Article content...</p>",
  "original_url": "https://example.com/article",
  "published_date": "2024-01-15",
  "is_enhanced": false,
  "original_article_id": null,
  "reference_urls": null
}
```

**Response:**

```json
{
  "id": 3,
  "title": "New Article Title",
  "content": "<p>Article content...</p>",
  "original_url": "https://example.com/article",
  "published_date": "2024-01-15",
  "is_enhanced": false,
  "original_article_id": null,
  "reference_urls": null,
  "created_at": "2024-01-15T12:00:00.000000Z",
  "updated_at": "2024-01-15T12:00:00.000000Z"
}
```

**Status Codes:**
- `201 Created` - Article created successfully
- `422 Unprocessable Entity` - Validation error

**Validation Rules:**
- `title`: required, string, max 255 characters
- `content`: required, string
- `original_url`: nullable, string, valid URL, unique
- `published_date`: nullable, valid date format
- `is_enhanced`: boolean
- `original_article_id`: nullable, must exist in articles table
- `reference_urls`: nullable, array of valid URLs

---

#### 4. Update Article

**PUT** `/articles/{id}`

**Request Body:**

```json
{
  "title": "Updated Article Title",
  "content": "<p>Updated content...</p>"
}
```

**Response:**

```json
{
  "id": 1,
  "title": "Updated Article Title",
  "content": "<p>Updated content...</p>",
  ...
}
```

**Status Codes:**
- `200 OK` - Success
- `404 Not Found` - Article doesn't exist
- `422 Unprocessable Entity` - Validation error

**Note:** All fields are optional (use `sometimes` validation)

---

#### 5. Delete Article

**DELETE** `/articles/{id}`

**Response:**

```json
{
  "message": "Article deleted successfully"
}
```

**Status Codes:**
- `200 OK` - Success
- `404 Not Found` - Article doesn't exist

**Note:** If an article has enhanced versions (`original_article_id` points to it), those will be deleted due to CASCADE foreign key constraint.

---

## 🔐 Environment Variables

### Backend (`backend/.env`)

| Variable | Description | Example |
|----------|-------------|---------|
| `APP_NAME` | Application name | `BeyondChats` |
| `APP_ENV` | Environment | `local`, `production` |
| `APP_KEY` | Laravel encryption key | `base64:...` |
| `APP_DEBUG` | Debug mode | `true`, `false` |
| `APP_URL` | Application URL | `http://localhost` |
| `DB_CONNECTION` | Database driver | `pgsql` |
| `DB_HOST` | Database host | `127.0.0.1` |
| `DB_PORT` | Database port | `5432` |
| `DB_DATABASE` | Database name | `beyondchats` |
| `DB_USERNAME` | Database user | `postgres` |
| `DB_PASSWORD` | Database password | `your_password` |

### Enhancement Script (`enhancement-script/.env`)

| Variable | Description | Example |
|----------|-------------|---------|
| `LARAVEL_API_URL` | Backend API base URL | `http://localhost:8000/api` |
| `SERPAPI_KEY` | SerpAPI authentication key | `your_serpapi_key` |
| `OPENROUTER_API_KEY` | OpenRouter API key | `sk-or-v1-...` |

### Frontend (`frontend/.env`)

| Variable | Description | Example | Default |
|----------|-------------|---------|---------|
| `VITE_API_URL` | Backend API base URL | `http://localhost:8000/api` | `http://localhost:8000/api` |

**Note:** Frontend uses Vite, so environment variables must be prefixed with `VITE_` to be accessible in the browser.

---

## 📁 Project Structure

```
beyond/
├── backend/                          # Laravel Backend API
│   ├── app/
│   │   ├── Console/
│   │   │   └── Commands/
│   │   │       └── ScrapeArticles.php    # Scraping command
│   │   ├── Http/
│   │   │   └── Controllers/
│   │   │       └── ArticleController.php # API controller
│   │   └── Models/
│   │       └── Article.php               # Eloquent model
│   ├── bootstrap/
│   │   └── app.php                      # Application bootstrap
│   ├── config/                          # Configuration files
│   ├── database/
│   │   └── migrations/
│   │       └── 2024_01_01_000001_create_articles_table.php
│   ├── public/
│   │   └── index.php                    # Entry point
│   ├── routes/
│   │   └── api.php                      # API routes
│   ├── create_table.sql                 # Manual DB schema
│   ├── env.template                     # Environment template
│   └── composer.json                    # PHP dependencies
│
├── enhancement-script/                 # Node.js Enhancement Script
│   ├── index.js                         # Main orchestrator
│   ├── fetchArticle.js                  # Fetch from API
│   ├── searchGoogle.js                  # SerpAPI integration
│   ├── scrapeContent.js                # Web scraping
│   ├── enhanceArticle.js               # OpenRouter LLM call
│   ├── publishArticle.js               # Publish to API
│   ├── env.template                     # Environment template
│   └── package.json                     # Node dependencies
│
├── frontend/                            # React Frontend
│   ├── src/
│   │   ├── api.js                       # API client
│   │   ├── App.jsx                      # Main component
│   │   ├── components/
│   │   │   ├── ArticleList.jsx          # Article listing
│   │   │   └── ArticleDetail.jsx       # Article detail view
│   │   └── styles.css                   # Global styles
│   ├── index.html                       # HTML entry point
│   ├── vite.config.js                   # Vite configuration
│   └── package.json                     # Node dependencies
│
├── .gitignore                           # Git ignore rules
└── README.md                            # This file
```

### Key Files Explained

**Backend:**
- `app/Console/Commands/ScrapeArticles.php` - Scrapes BeyondChats blog
- `app/Http/Controllers/ArticleController.php` - Handles all API requests
- `routes/api.php` - Defines API endpoints
- `create_table.sql` - Database schema (manual setup)

**Enhancement Script:**
- `index.js` - Main entry point, orchestrates the enhancement pipeline
- `fetchArticle.js` - Fetches latest non-enhanced article from API
- `searchGoogle.js` - Uses SerpAPI to find reference articles
- `scrapeContent.js` - Extracts content from reference URLs
- `enhanceArticle.js` - Calls OpenRouter API for content enhancement
- `publishArticle.js` - Publishes enhanced article back to backend

**Frontend:**
- `src/api.js` - Axios client for backend API
- `src/components/ArticleList.jsx` - Displays all articles
- `src/components/ArticleDetail.jsx` - Shows article details and references

---

## 🔄 Development Workflow

### Starting the Full System

**Terminal 1 - Backend:**

```bash
cd backend
php -S localhost:8000 -t public
```

**Terminal 2 - Frontend:**

```bash
cd frontend
npm run dev
```

**Terminal 3 - Scrape Articles (when needed):**

```bash
cd backend
php artisan scrape:articles
```

**Terminal 4 - Run Enhancement (when needed):**

```bash
cd enhancement-script
npm start
```

### Typical Development Cycle

1. **Scrape New Articles**
   ```bash
   cd backend
   php artisan scrape:articles
   ```

2. **Enhance Articles**
   ```bash
   cd enhancement-script
   npm start
   ```
   (Run multiple times to enhance multiple articles)

3. **View Results**
   - Open http://localhost:3000
   - Browse articles
   - Check enhanced versions

### Stopping Services

Press `Ctrl+C` in each terminal window.

**Or stop all at once (PowerShell):**

```powershell
Get-Process | Where-Object {$_.ProcessName -eq "php" -or $_.ProcessName -eq "node"} | Stop-Process -Force
```

---

## 🐛 Troubleshooting

### Backend Issues

**Problem: Backend returns 500 error**

**Solutions:**
- Check PostgreSQL is running:
  ```powershell
  # Windows
  Get-Service | Where-Object {$_.Name -like "*postgresql*"}
  Start-Service "postgresql-x64-18"
  ```
- Verify database connection in `backend/.env`
- Check database exists:
  ```sql
  SELECT datname FROM pg_database WHERE datname = 'beyondchats';
  ```

**Problem: `php artisan` commands don't work**

**Solutions:**
- Ensure you're in `backend/` directory
- Check PHP extensions are enabled (`pdo_pgsql`, `zip`, `fileinfo`)
- Verify `composer install` completed successfully

**Problem: Scraper fails with SSL errors**

**Solution:** The scraper already has `verify => false` in Guzzle config to bypass SSL certificate issues.

---

### Enhancement Script Issues

**Problem: "OPENROUTER_API_KEY is not set"**

**Solution:**
- Check `enhancement-script/.env` exists
- Verify `OPENROUTER_API_KEY=sk-or-v1-...` is set correctly
- No spaces around `=` sign
- Key should be on a single line

**Problem: "Failed to fetch articles"**

**Solutions:**
- Ensure backend server is running (`php -S localhost:8000 -t public`)
- Check `LARAVEL_API_URL` in `.env` matches backend URL
- Test API manually: `curl http://localhost:8000/api/articles`

**Problem: "No valid blog/article URLs found"**

**Solutions:**
- SerpAPI might not be returning blog URLs for that search
- Check your SerpAPI quota: https://serpapi.com/dashboard
- Verify `SERPAPI_KEY` is correct in `.env`

**Problem: Scraping fails for certain URLs**

**Solutions:**
- Some sites block scrapers (check site's robots.txt)
- The script uses Readability + Cheerio fallback, but some sites may still fail
- Check console output for specific error messages

---

### Frontend Issues

**Problem: Frontend shows "Failed to fetch articles"**

**Solutions:**
- Ensure backend server is running
- Check `VITE_API_URL` in `frontend/.env` (or default in `src/api.js`)
- Check browser console for CORS errors
- Verify API is accessible: http://localhost:8000/api/articles

**Problem: Port 3000 already in use**

**Solutions:**
- Stop other processes using port 3000
- Or change port in `vite.config.js`:
  ```js
  export default {
    server: {
      port: 3001
    }
  }
  ```

---

### Database Issues

**Problem: "could not find driver (Connection: pgsql)"**

**Solution:** Enable PostgreSQL extension in PHP:

1. Find `php.ini`:
   ```bash
   php --ini
   ```

2. Edit `php.ini` and uncomment:
   ```ini
   extension=pdo_pgsql
   ```

3. Restart PHP server

**Problem: "null value in column original_url violates not-null constraint"**

**Solution:** Make `original_url` nullable:

```sql
ALTER TABLE articles
ALTER COLUMN original_url DROP NOT NULL;
```

---

## 📝 Common Commands Reference

### Backend

```bash
# Install dependencies
cd backend && composer install

# Start server
php -S localhost:8000 -t public

# Scrape articles
php artisan scrape:articles

# Generate app key
php artisan key:generate

# Run migrations (if working)
php artisan migrate
```

### Enhancement Script

```bash
# Install dependencies
cd enhancement-script && npm install

# Run enhancement
npm start

# Or directly
node index.js
```

### Frontend

```bash
# Install dependencies
cd frontend && npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Database

```bash
# Connect to PostgreSQL (Windows)
$env:PGPASSWORD="your_password"
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -d beyondchats

# Connect (Linux/Mac)
psql -U postgres -d beyondchats

# Check articles
SELECT id, title, is_enhanced FROM articles;

# Count articles
SELECT COUNT(*) FROM articles WHERE is_enhanced = false;
```

---

## 🤝 Contributing

### Code Style

- **Backend**: Follow Laravel coding standards (PSR-12)
- **Enhancement Script**: Use ES6+ JavaScript, async/await
- **Frontend**: React functional components with hooks

### Adding Features

1. **Backend**: Add routes in `routes/api.php`, controllers in `app/Http/Controllers/`
2. **Enhancement Script**: Add new modules in `enhancement-script/`, import in `index.js`
3. **Frontend**: Add components in `src/components/`, update `App.jsx`

### Testing

- **Backend**: Test API endpoints with `curl` or Postman
- **Enhancement Script**: Run `npm start` and check console output
- **Frontend**: Test in browser, check browser console for errors

---

## 📄 License

MIT License - feel free to use this project for learning or production purposes.

---

## 🎓 Learning Resources

- **Laravel**: https://laravel.com/docs
- **React**: https://react.dev/learn
- **PostgreSQL**: https://www.postgresql.org/docs/
- **OpenRouter**: https://openrouter.ai/docs
- **SerpAPI**: https://serpapi.com/search-api

---

## 📞 Support

For issues or questions:

1. Check the [Troubleshooting](#troubleshooting) section
2. Review error messages in console/logs
3. Verify environment variables are set correctly
4. Ensure all prerequisites are installed

---

**Last Updated:** 2024

**Version:** 1.0.0

---

## 🌐 Deployment & Live Link

This section describes how to deploy the project so you can provide a **live link** for reviewers.

### 1. Monorepo on GitHub

This project is already structured as a **single monolithic repo** (`backend/`, `enhancement-script/`, `frontend/`). To publish it:

```bash
cd C:\Users\mehul\OneDrive\Desktop\beyond
git init
git add .
git commit -m "Initial BeyondChats submission"
git branch -M main
git remote add origin https://github.com/<your-username>/beyondchats-assignment.git
git push -u origin main
```

Make sure the GitHub repo is **public**.

### 2. Deploy Backend (Laravel + PostgreSQL)

Use any free host that supports PHP/Laravel + Postgres, for example **Render**, **Railway**, or **Fly.io**.

- Create a new **Web Service** from your GitHub repo, with the root set to `backend/`.
- Set the start command to something like:
  ```bash
  php artisan migrate --force || true
  php -S 0.0.0.0:8000 -t public
  ```
- Provision a **PostgreSQL database** on the same platform and set these environment variables (matching `backend/.env`):
  - `APP_ENV=production`
  - `APP_KEY` (use `php artisan key:generate --show` locally)
  - `APP_DEBUG=false`
  - `DB_CONNECTION=pgsql`
  - `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD` from the managed database
- Run the SQL in `backend/create_table.sql` once on the hosted DB (via the platform’s SQL console or `psql`).

After deployment, you should have a public API base URL like:

```text
https://your-laravel-backend.onrender.com/api
```

### 3. Populate Articles for the Live Demo

You can keep the **scraping + enhancement script** running locally but point them to the **hosted backend**:

1. In `enhancement-script/.env` (locally), set:
   ```env
   LARAVEL_API_URL=https://your-laravel-backend.onrender.com/api
   SERPAPI_KEY=your_real_serpapi_key
   OPENROUTER_API_KEY=your_real_openrouter_key
   ```
2. Run the scraper locally once to seed original articles (with the backend URL updated in `backend/.env` or using the hosted DB directly):
   ```bash
   cd backend
   php artisan scrape:articles
   ```
3. Run the enhancement script locally, which will **publish enhanced articles to the hosted API**:
   ```bash
   cd enhancement-script
   npm start
   ```

Now your hosted backend will contain **both original and enhanced articles** for the React frontend to display.

### 4. Deploy Frontend (React + Vite)

Use **Vercel** or **Netlify**; Vercel example:

1. Connect your GitHub repo to Vercel and select the `frontend/` folder as the project root.
2. Set build settings:
   - **Framework**: React
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
3. Configure environment variable in Vercel:
   ```env
   VITE_API_URL=https://your-laravel-backend.onrender.com/api
   ```
4. Deploy. Vercel will give you a URL like:

```text
https://beyondchats-frontend.vercel.app
```

This is the **live link** you should include in your submission.

### 5. Live Link to Include in Submission

Once deployed, update this section with your actual URL so reviewers can see the original and enhanced articles:

- **Live Frontend URL**: https://beyondchats-frontend.vercel.app  _(replace with your actual URL)_

The frontend will call the hosted Laravel API and display both the **original** and **updated (enhanced)** articles as required by the assignment.


