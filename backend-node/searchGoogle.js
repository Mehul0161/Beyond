import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const SERPAPI_KEY = process.env.SERPAPI_KEY;

/**
 * Searches Google for the article title and returns top 2 blog/article URLs
 * @param {string} title - Article title to search
 * @returns {Promise<string[]>} Array of 2 URLs
 */
export async function searchArticleTitle(title) {
    if (!SERPAPI_KEY) {
        throw new Error('SERPAPI_KEY is not set in environment variables');
    }

    try {
        // Use SerpAPI REST API directly
        const response = await axios.get('https://serpapi.com/search', {
            params: {
                engine: 'google',
                q: title,
                api_key: SERPAPI_KEY,
                num: 10, // Get more results to filter
            },
        });

        const organicResults = response.data.organic_results || [];
        const blogUrls = [];

        // Filter for blog/article URLs (exclude social media, PDFs, etc.)
        for (const result of organicResults) {
            const url = result.link || '';
            const resultTitle = (result.title || '').toLowerCase();

            // Skip social media, PDFs, and non-blog sites
            if (
                url.includes('facebook.com') ||
                url.includes('twitter.com') ||
                url.includes('linkedin.com') ||
                url.includes('instagram.com') ||
                url.includes('youtube.com') ||
                url.includes('.pdf') ||
                url.includes('beyondchats.com') // Skip original site
            ) {
                continue;
            }

            // Check if it looks like a blog/article
            if (
                url.includes('/blog/') ||
                url.includes('/article/') ||
                url.includes('/post/') ||
                url.includes('/news/') ||
                resultTitle.includes('blog') ||
                resultTitle.includes('article')
            ) {
                blogUrls.push(url);
                if (blogUrls.length >= 2) {
                    break;
                }
            }
        }

        // If we don't have 2 blog URLs, take any valid URLs
        if (blogUrls.length < 2) {
            for (const result of organicResults) {
                const url = result.link || '';
                
                if (
                    !url.includes('facebook.com') &&
                    !url.includes('twitter.com') &&
                    !url.includes('linkedin.com') &&
                    !url.includes('instagram.com') &&
                    !url.includes('youtube.com') &&
                    !url.includes('.pdf') &&
                    !url.includes('beyondchats.com') &&
                    !blogUrls.includes(url)
                ) {
                    blogUrls.push(url);
                    if (blogUrls.length >= 2) {
                        break;
                    }
                }
            }
        }

        if (blogUrls.length === 0) {
            throw new Error('No valid blog/article URLs found in search results');
        }

        return blogUrls.slice(0, 2);
    } catch (error) {
        throw new Error(`Google search failed: ${error.message}`);
    }
}

