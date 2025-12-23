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

/**
 * Fetches a specific article by ID from Laravel API
 * @param {number} articleId - Article ID
 * @returns {Promise<{id: number, title: string, content: string, is_enhanced: boolean}>}
 */
export async function fetchArticleById(articleId) {
    try {
        const response = await axios.get(`${LARAVEL_API_URL}/articles/${articleId}`);
        const article = response.data;

        return {
            id: article.id,
            title: article.title,
            content: article.content,
            is_enhanced: article.is_enhanced || false,
        };
    } catch (error) {
        throw new Error(`Failed to fetch article: ${error.message}`);
    }
}


