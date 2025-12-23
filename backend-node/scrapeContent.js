import axios from 'axios';
import * as cheerio from 'cheerio';
import { Readability } from '@mozilla/readability';
import { JSDOM, VirtualConsole } from 'jsdom';

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
        
        // Suppress CSS parsing errors from JSDOM (common with complex sites)
        // Create virtual console to suppress errors
        const virtualConsole = new VirtualConsole();
        virtualConsole.on('error', () => {}); // Suppress all errors
        virtualConsole.on('warn', () => {}); // Suppress all warnings
        
        const dom = new JSDOM(html, { 
            url,
            pretendToBeVisual: true,
            resources: 'usable',
            virtualConsole,
            runScripts: 'outside-only', // Don't run scripts
        });
        
        const document = dom.window.document;

        // Use Readability to extract main content
        let article = null;
        try {
            const reader = new Readability(document);
            article = reader.parse();
        } catch (readabilityError) {
            // Readability failed, will use fallback
        }

        // Use cheerio for HTML extraction (preserves images, SVGs, etc.)
        const $ = cheerio.load(html);
        const title = extractTitle(html) || $('h1').first().text() || $('title').text();
        
        // Try to find main content with HTML preserved
        const contentSelectors = [
            'article',
            '.entry-content',
            '.post-content',
            '.article-content',
            '.blog-content',
            'main',
            '.content',
            '[role="article"]',
        ];

        let content = '';
        let contentHtml = '';
        
        for (const selector of contentSelectors) {
            const element = $(selector).first();
            if (element.length > 0) {
                // Clone to avoid modifying original
                const contentElement = element.clone();
                
                // Remove unwanted elements but keep images, SVGs, etc.
                contentElement.find('script, style, nav, footer, header, aside, .advertisement, .ad, [class*="ad-"], [id*="ad-"]').remove();
                
                // Get HTML content (preserves images, SVGs, formatting)
                contentHtml = contentElement.html() || '';
                
                // Get text content for validation
                content = contentElement.text();
                
                if (content.length > 200 && contentHtml.length > 500) {
                    break;
                }
            }
        }

        // Fallback: get main content area with HTML
        if (!contentHtml || content.length < 200) {
            const mainContent = $('main, article, .content-area').first();
            if (mainContent.length > 0) {
                const cloned = mainContent.clone();
                cloned.find('script, style, nav, footer, header, aside, .advertisement, .ad').remove();
                contentHtml = cloned.html() || '';
                content = cloned.text();
            }
        }

        // Last resort: get paragraphs with HTML
        if (!contentHtml || content.length < 200) {
            const paragraphs = $('p, h1, h2, h3, h4, h5, h6, ul, ol, img, figure').filter((i, el) => {
                // Skip if in nav, header, footer
                const parent = $(el).closest('nav, header, footer, aside');
                return parent.length === 0;
            });
            
            contentHtml = paragraphs.map((i, el) => {
                return $.html(el);
            }).get().join('\n');
            content = paragraphs.text();
        }

        // Clean up the HTML but preserve images, SVGs, and formatting
        if (contentHtml) {
            // Remove empty elements but keep images and SVGs
            contentHtml = contentHtml
                .replace(/<div[^>]*>\s*<\/div>/gi, '')
                .replace(/<span[^>]*>\s*<\/span>/gi, '')
                .replace(/\s+/g, ' ')
                .trim();
        }

        return {
            title: title.trim(),
            content: contentHtml || content.trim(), // Return HTML if available, otherwise text
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

