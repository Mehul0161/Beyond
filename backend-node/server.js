import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fetchArticleById } from './fetchArticle.js';
import { searchArticleTitle } from './searchGoogle.js';
import { scrapeArticle } from './scrapeContent.js';
import { enhance } from './enhanceArticle.js';
import { publish } from './publishArticle.js';

dotenv.config();

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
 * Health check endpoint
 */
app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'article-enhancement-api' });
});

app.listen(PORT, () => {
    console.log(`🚀 Article Enhancement API server running on http://localhost:${PORT}`);
    console.log(`📝 Endpoint: POST http://localhost:${PORT}/api/enhance/:articleId`);
});


