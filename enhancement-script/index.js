import { fetchLatestArticle } from './fetchArticle.js';
import { searchArticleTitle } from './searchGoogle.js';
import { scrapeArticle } from './scrapeContent.js';
import { enhance } from './enhanceArticle.js';
import { publish } from './publishArticle.js';

/**
 * Main orchestrator for article enhancement process
 */
async function main() {
    try {
        console.log('Starting article enhancement process...\n');

        // Step 1: Fetch latest article
        console.log('Step 1: Fetching latest article...');
        const originalArticle = await fetchLatestArticle();
        console.log(`Found article: "${originalArticle.title}" (ID: ${originalArticle.id})\n`);

        // Step 2: Search Google for article title
        console.log('Step 2: Searching Google for reference articles...');
        const searchUrls = await searchArticleTitle(originalArticle.title);
        console.log(`Found ${searchUrls.length} reference URLs:\n${searchUrls.map((url, i) => `  ${i + 1}. ${url}`).join('\n')}\n`);

        // Step 3: Scrape reference articles
        console.log('Step 3: Scraping reference articles...');
        const referenceArticles = [];
        for (let i = 0; i < searchUrls.length; i++) {
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
            throw new Error('Failed to scrape any reference articles');
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

        console.log('Article enhancement process completed successfully!');
    } catch (error) {
        console.error('\n❌ Error:', error.message);
        process.exit(1);
    }
}

main();


