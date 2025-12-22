import axios from 'axios';
import * as cheerio from 'cheerio';
import { Readability } from '@mozilla/readability';
import { JSDOM } from 'jsdom';

/**
 * Scrapes main content from an article URL
 * @param {string} url - URL to scrape
 * @returns {Promise<{title: string, content: string}>}
 */
export async function scrapeArticle(url) {
    try {
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            },
            timeout: 10000,
        });

        const html = response.data;
        
        // Suppress CSS parsing errors from JSDOM (common with complex sites like Amazon)
        const dom = new JSDOM(html, { 
            url,
            pretendToBeVisual: true,
            resources: 'usable',
        });
        
        // Suppress console errors from JSDOM
        const originalError = console.error;
        console.error = () => {}; // Suppress CSS parsing errors
        
        const document = dom.window.document;

        // Use Readability to extract main content
        let article = null;
        try {
            const reader = new Readability(document);
            article = reader.parse();
        } catch (readabilityError) {
            // Readability failed, will use fallback
        }
        
        // Restore console.error
        console.error = originalError;

        if (article) {
            return {
                title: article.title || extractTitle(html),
                content: article.textContent || article.content || '',
            };
        }

        // Fallback: use cheerio for basic extraction
        const $ = cheerio.load(html);
        const title = extractTitle(html) || $('h1').first().text() || $('title').text();
        
        // Try to find main content
        const contentSelectors = [
            'article',
            '.entry-content',
            '.post-content',
            '.article-content',
            'main',
            '.content',
        ];

        let content = '';
        for (const selector of contentSelectors) {
            const element = $(selector).first();
            if (element.length > 0) {
                // Remove script and style tags
                element.find('script, style, nav, footer, header, aside').remove();
                content = element.text();
                if (content.length > 200) {
                    break;
                }
            }
        }

        // If still no content, get all paragraphs
        if (!content || content.length < 200) {
            content = $('p').map((i, el) => $(el).text()).get().join('\n\n');
        }

        return {
            title: title.trim(),
            content: content.trim(),
        };
    } catch (error) {
        throw new Error(`Failed to scrape ${url}: ${error.message}`);
    }
}

/**
 * Extracts title from HTML
 */
function extractTitle(html) {
    const $ = cheerio.load(html);
    return $('title').text() || $('h1').first().text() || '';
}

