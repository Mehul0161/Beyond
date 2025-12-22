# BeyondChats Article Enhancement System

A modular 3-phase system for scraping, enhancing, and displaying articles from BeyondChats.

## Project Structure

```
beyond/
├── backend/              # Laravel API
├── enhancement-script/   # NodeJS enhancement script
└── frontend/            # React frontend
```

## Quick Start

### Phase 1: Backend Setup

1. Navigate to backend:
```bash
cd backend
```

2. Install dependencies:
```bash
composer install
```

3. Configure environment:
```bash
cp .env.example .env
# Edit .env with your PostgreSQL credentials
php artisan key:generate
```

4. Run migrations:
```bash
php artisan migrate
```

5. Scrape articles:
```bash
php artisan scrape:articles
```

6. Start server:
```bash
php artisan serve
```

### Phase 2: Enhancement Script Setup

1. Navigate to enhancement-script:
```bash
cd enhancement-script
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment:
```bash
cp .env.example .env
# Edit .env with your API keys:
# - LARAVEL_API_URL
# - SERPAPI_KEY
# - OPENAI_API_KEY
```

4. Run enhancement:
```bash
npm start
```

### Phase 3: Frontend Setup

1. Navigate to frontend:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. (Optional) Configure API URL in `.env`:
```
VITE_API_URL=http://localhost:8000/api
```

4. Start development server:
```bash
npm run dev
```

Visit `http://localhost:3000` to view the articles.

## Features

- **Scraping**: Automatically scrape 5 oldest articles from BeyondChats blog
- **Enhancement**: Enhance articles using Google search results and OpenAI
- **Display**: View original and enhanced articles in a clean, responsive UI

## API Endpoints

- `GET /api/articles` - List all articles
- `GET /api/articles/{id}` - Get single article
- `POST /api/articles` - Create article
- `PUT /api/articles/{id}` - Update article
- `DELETE /api/articles/{id}` - Delete article

## Requirements

- PHP 8.1+
- PostgreSQL
- Node.js 18+
- Composer
- API Keys:
  - SerpAPI key (for Google search)
  - OpenAI API key (for article enhancement)

## License

MIT


