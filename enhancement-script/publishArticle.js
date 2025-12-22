import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const LARAVEL_API_URL = process.env.LARAVEL_API_URL || 'http://localhost:8000/api';

/**
 * Publishes enhanced article to Laravel API
 * @param {Object} articleData - { title: string, content: string }
 * @param {number} originalId - ID of the original article
 * @param {string[]} referenceUrls - Array of reference URLs
 * @returns {Promise<Object>} Created article
 */
export async function publish(articleData, originalId, referenceUrls) {
    try {
        // Add citations to content
        let contentWithCitations = articleData.content;
        
        if (referenceUrls && referenceUrls.length > 0) {
            const citations = '\n\n---\n\n**References:**\n' + 
                referenceUrls.map((url, index) => `${index + 1}. ${url}`).join('\n');
            contentWithCitations += citations;
        }

        const payload = {
            title: articleData.title,
            content: contentWithCitations,
            is_enhanced: true,
            original_article_id: originalId,
            reference_urls: referenceUrls,
            published_date: new Date().toISOString().split('T')[0],
        };

        const response = await axios.post(`${LARAVEL_API_URL}/articles`, payload);

        return response.data;
    } catch (error) {
        const status = error.response?.status;
        const data = error.response?.data;
        // Surface Laravel validation / server errors to the console for easier debugging
        console.error('Publish error details from backend:', {
            status,
            data,
        });
        if (status === 422 && data?.errors) {
            // Laravel validation error
            throw new Error(
                `Failed to publish article: validation error from backend: ${JSON.stringify(
                    data.errors,
                )}`,
            );
        }
        throw new Error(
            `Failed to publish article: ${data?.message || error.message} (status ${status ?? 'unknown'})`,
        );
    }
}


