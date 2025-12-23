import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import axios from 'axios';
import { fetchArticleById } from './fetchArticle.js';
import { searchArticleTitle } from './searchGoogle.js';
import { scrapeArticle } from './scrapeContent.js';
import { enhance } from './enhanceArticle.js';
import { publish } from './publishArticle.js';

dotenv.config();

const LARAVEL_API_URL = process.env.LARAVEL_API_URL || 'http://localhost:8000/api';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

/**
 * Enhance a specific article by ID
 * POST /api/enhance/:articleId
 */
app.post('/api/enhance/:articleId', async (req, res) => {
    try {
        const articleId = parseInt(req.params.articleId);
        
        console.log(`\n=== Starting enhancement for article ID: ${articleId} ===\n`);

        // Step 1: Fetch the article
        console.log('Step 1: Fetching article...');
        const originalArticle = await fetchArticleById(articleId);
        console.log(`Found article: "${originalArticle.title}" (ID: ${originalArticle.id})\n`);

        // Check if already enhanced
        if (originalArticle.is_enhanced) {
            return res.status(400).json({
                success: false,
                error: 'Article is already enhanced'
            });
        }

        // Step 2: Search Google for article title
        console.log('Step 2: Searching Google for reference articles...');
        const searchUrls = await searchArticleTitle(originalArticle.title);
        console.log(`Found ${searchUrls.length} reference URLs:\n${searchUrls.map((url, i) => `  ${i + 1}. ${url}`).join('\n')}\n`);

        if (searchUrls.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'No reference articles found'
            });
        }

        // Step 3: Scrape reference articles
        console.log('Step 3: Scraping reference articles...');
        const referenceArticles = [];
        for (let i = 0; i < Math.min(searchUrls.length, 2); i++) {
            try {
                console.log(`  Scraping article ${i + 1}...`);
                const scraped = await scrapeArticle(searchUrls[i]);
                referenceArticles.push(scraped);
                console.log(`  ✓ Scraped: "${scraped.title}"`);
            } catch (error) {
                console.error(`  ✗ Failed to scrape ${searchUrls[i]}: ${error.message}`);
            }
        }

        if (referenceArticles.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Failed to scrape any reference articles'
            });
        }

        console.log(`\nSuccessfully scraped ${referenceArticles.length} reference articles\n`);

        // Step 4: Enhance article with LLM
        console.log('Step 4: Enhancing article with LLM...');
        const enhancedArticle = await enhance(originalArticle, referenceArticles);
        console.log(`✓ Article enhanced: "${enhancedArticle.title}"\n`);

        // Step 5: Publish enhanced article
        console.log('Step 5: Publishing enhanced article...');
        const published = await publish(enhancedArticle, originalArticle.id, searchUrls);
        console.log(`✓ Article published successfully! (ID: ${published.id})\n`);

        console.log('=== Enhancement completed successfully! ===\n');

        res.json({
            success: true,
            message: 'Article enhanced successfully',
            data: {
                originalArticleId: originalArticle.id,
                enhancedArticleId: published.id,
                enhancedArticle: published
            }
        });
    } catch (error) {
        console.error('\n❌ Enhancement Error:', error.message);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to enhance article'
        });
    }
});

/**
 * Scrape articles from BeyondChats
 * POST /api/scrape-articles
 * This endpoint calls Laravel's scraping command via HTTP
 */
app.post('/api/scrape-articles', async (req, res) => {
    try {
        console.log('\n=== Starting article scraping ===\n');
        console.log(`Calling Laravel API: ${LARAVEL_API_URL}/articles/scrape`);

        // Call Laravel's scrape endpoint
        const response = await axios.post(`${LARAVEL_API_URL}/articles/scrape`, {}, {
            timeout: 300000, // 5 minutes timeout for scraping
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
        });

        console.log('✓ Articles scraped successfully\n');
        console.log('Response:', JSON.stringify(response.data, null, 2));

        res.json({
            success: true,
            message: response.data.message || 'Articles scraped successfully',
            output: response.data.output || '',
        });
    } catch (error) {
        console.error('\n❌ Scraping Error Details:');
        console.error('Error Message:', error.message);
        console.error('Status Code:', error.response?.status);
        console.error('Response Data:', JSON.stringify(error.response?.data, null, 2));
        console.error('Full Error:', error);
        
        // Extract detailed error message from Laravel response
        let errorMessage = 'Failed to scrape articles';
        let errorOutput = '';
        
        if (error.response) {
            // Laravel returned an error response
            errorMessage = error.response.data?.error || error.response.data?.message || error.message;
            errorOutput = error.response.data?.output || '';
            
            // If Laravel returned HTML error page, try to extract useful info
            if (typeof error.response.data === 'string' && error.response.data.includes('<!DOCTYPE')) {
                errorMessage = 'Laravel returned an HTML error page. Check Laravel logs for details.';
            }
        } else if (error.request) {
            // Request was made but no response received
            errorMessage = 'No response from Laravel server. Is it running?';
        } else {
            // Error setting up the request
            errorMessage = error.message;
        }
        
        res.status(error.response?.status || 500).json({
            success: false,
            error: errorMessage,
            output: errorOutput,
            details: error.response?.data || null,
        });
    }
});

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'article-enhancement-api' });
});

app.listen(PORT, () => {
    console.log(`🚀 Article Enhancement API server running on http://localhost:${PORT}`);
    console.log(`📝 Endpoints:`);
    console.log(`   POST http://localhost:${PORT}/api/enhance/:articleId`);
    console.log(`   POST http://localhost:${PORT}/api/scrape-articles`);
});


