import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const LARAVEL_API_URL = process.env.LARAVEL_API_URL || 'http://localhost:8000/api';

/**
 * Fetches the latest non-enhanced article from Laravel API
 * @returns {Promise<{id: number, title: string, content: string}>}
 */
export async function fetchLatestArticle() {
    try {
        const response = await axios.get(`${LARAVEL_API_URL}/articles`);
        const articles = response.data;

        // Find the latest non-enhanced article
        const latestArticle = articles
            .filter(article => !article.is_enhanced)
            .sort((a, b) => new Date(b.published_date) - new Date(a.published_date))[0];

        if (!latestArticle) {
            throw new Error('No non-enhanced articles found');
        }

        return {
            id: latestArticle.id,
            title: latestArticle.title,
            content: latestArticle.content,
        };
    } catch (error) {
        throw new Error(`Failed to fetch article: ${error.message}`);
    }
}


