import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

if (!OPENROUTER_API_KEY) {
    throw new Error('OPENROUTER_API_KEY is not set in environment variables');
}

/**
 * Enhances an article using OpenRouter API (xiaomi/mimo-v2-flash:free model) based on reference articles
 * @param {Object} originalArticle - { title: string, content: string }
 * @param {Array} referenceArticles - [{ title: string, content: string }, ...]
 * @returns {Promise<{title: string, content: string}>}
 */
export async function enhance(originalArticle, referenceArticles) {
    try {
        const referenceText = referenceArticles
            .map((ref, index) => `Reference Article ${index + 1}:\nTitle: ${ref.title}\n\nContent:\n${ref.content}`)
            .join('\n\n---\n\n');

        const prompt = `You are an expert content writer. Update the following article to match the style, formatting, and content quality of the two reference articles.

Original Article:
Title: ${originalArticle.title}

Content:
${originalArticle.content}

${referenceText}

Requirements:
- Maintain the core message and facts from the original article
- Match the formatting style of the reference articles (headings, lists, paragraphs, structure)
- Improve content quality and readability to match the reference articles
- Keep similar length to the original article
- Use professional, engaging writing style
- Ensure proper grammar and flow

Return the enhanced article with the same title (unless it needs significant improvement) and improved content. Format the response as:
TITLE: [enhanced title]
CONTENT: [enhanced content]`;

        // Use OpenRouter API with xiaomi/mimo-v2-flash:free model
        const fullPrompt = `You are an expert content writer who improves articles while maintaining their core message.\n\n${prompt}`;

        const response = await axios.post(
            'https://openrouter.ai/api/v1/chat/completions',
            {
                model: 'xiaomi/mimo-v2-flash:free',
                messages: [
                    {
                        role: 'user',
                        content: fullPrompt,
                    },
                ],
                temperature: 0.7,
                max_tokens: 4000,
            },
            {
                headers: {
                    'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': 'https://github.com/your-repo', // Optional: for OpenRouter tracking
                },
            }
        );

        const responseText = response.data.choices[0].message.content;
        
        // Parse response
        const titleMatch = responseText.match(/TITLE:\s*(.+?)(?:\n|CONTENT:)/i);
        const contentMatch = responseText.match(/CONTENT:\s*(.+)/is);

        let enhancedTitle = originalArticle.title;
        let enhancedContent = responseText;

        if (titleMatch) {
            enhancedTitle = titleMatch[1].trim();
        }

        if (contentMatch) {
            enhancedContent = contentMatch[1].trim();
        } else {
            // If no CONTENT marker, assume everything after TITLE is content
            if (titleMatch) {
                enhancedContent = responseText.split(/TITLE:\s*.+?\n/i)[1]?.trim() || responseText;
            }
        }

        return {
            title: enhancedTitle,
            content: enhancedContent,
        };
    } catch (error) {
        if (error.response?.status === 401 || error.message.includes('401') || error.message.includes('API_KEY_INVALID') || error.message.includes('API key') || error.message.includes('Unauthorized')) {
            throw new Error(`OpenRouter API key is invalid or expired. Please check your OPENROUTER_API_KEY in .env file. Get a new key at https://openrouter.ai/keys`);
        }
        if (error.response?.status === 429 || error.message.includes('429') || error.message.includes('quota') || error.message.includes('Quota exceeded') || error.message.includes('rate limit')) {
            throw new Error(`OpenRouter API quota exceeded. Please check your usage at https://openrouter.ai/activity or wait before retrying.`);
        }
        throw new Error(`Failed to enhance article: ${error.response?.data?.error?.message || error.message}`);
    }
}


