import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Get all articles
 * @returns {Promise<Array>}
 */
export async function getArticles() {
  try {
    const response = await api.get('/articles');
    return response.data;
  } catch (error) {
    throw new Error(`Failed to fetch articles: ${error.message}`);
  }
}

/**
 * Get single article by ID
 * @param {number} id - Article ID
 * @returns {Promise<Object>}
 */
export async function getArticle(id) {
  try {
    const response = await api.get(`/articles/${id}`);
    return response.data;
  } catch (error) {
    throw new Error(`Failed to fetch article: ${error.message}`);
  }
}


