import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Converts markdown-like text to HTML
 * Handles headings, lists, bold text, links, and paragraphs
 */
function convertToHtml(text) {
    const lines = text.split('\n');
    const result = [];
    let inList = false;
    let listItems = [];
    let listType = 'ul'; // 'ul' or 'ol'
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();
        
        // Skip empty lines (but close lists)
        if (!trimmed) {
            if (inList && listItems.length > 0) {
                result.push(`<${listType}>${listItems.join('')}</${listType}>`);
                listItems = [];
                inList = false;
            }
            continue;
        }
        
        // Check for markdown headings (# Heading)
        if (trimmed.match(/^#{1,6}\s+(.+)$/)) {
            const match = trimmed.match(/^(#{1,6})\s+(.+)$/);
            const level = match[1].length;
            const headingText = match[2];
            if (inList) {
                result.push(`<${listType}>${listItems.join('')}</${listType}>`);
                listItems = [];
                inList = false;
            }
            result.push(`<h${level}>${headingText}</h${level}>`);
            continue;
        }
        
        // Check if line looks like a heading (short, capitalized, no period, not a list item)
        if (trimmed.length < 100 && 
            trimmed.match(/^[A-Z][^.!?]*$/) && 
            !trimmed.match(/^[\*\-\•\d]/) &&
            !trimmed.includes('*') &&
            !trimmed.includes('-') &&
            i < lines.length - 1 && 
            lines[i + 1] && 
            lines[i + 1].trim().length > 0) {
            if (inList) {
                result.push(`<${listType}>${listItems.join('')}</${listType}>`);
                listItems = [];
                inList = false;
            }
            result.push(`<h2>${trimmed}</h2>`);
            continue;
        }
        
        // Check for bullet lists (* item or - item)
        if (trimmed.match(/^[\*\-\•]\s+(.+)$/)) {
            const match = trimmed.match(/^[\*\-\•]\s+(.+)$/);
            const itemText = processInlineFormatting(match[1]);
            if (!inList) {
                inList = true;
                listType = 'ul';
            } else if (listType !== 'ul') {
                // Switching list types
                result.push(`<${listType}>${listItems.join('')}</${listType}>`);
                listItems = [];
                listType = 'ul';
            }
            listItems.push(`<li>${itemText}</li>`);
            continue;
        }
        
        // Check for numbered lists (1. item)
        if (trimmed.match(/^\d+\.\s+(.+)$/)) {
            const match = trimmed.match(/^\d+\.\s+(.+)$/);
            const itemText = processInlineFormatting(match[1]);
            if (!inList) {
                inList = true;
                listType = 'ol';
            } else if (listType !== 'ol') {
                // Switching list types
                result.push(`<${listType}>${listItems.join('')}</${listType}>`);
                listItems = [];
                listType = 'ol';
            }
            listItems.push(`<li>${itemText}</li>`);
            continue;
        }
        
        // Close list if we hit a non-list item
        if (inList && listItems.length > 0) {
            result.push(`<${listType}>${listItems.join('')}</${listType}>`);
            listItems = [];
            inList = false;
        }
        
        // Process regular paragraph line
        const processedLine = processInlineFormatting(trimmed);
        result.push(`<p>${processedLine}</p>`);
    }
    
    // Close any remaining list
    if (inList && listItems.length > 0) {
        result.push(`<${listType}>${listItems.join('')}</${listType}>`);
    }
    
    let html = result.join('\n');
    
    // Clean up any double-wrapped paragraphs
    html = html.replace(/<p><p>/g, '<p>');
    html = html.replace(/<\/p><\/p>/g, '</p>');
    
    // Clean up empty paragraphs
    html = html.replace(/<p>\s*<\/p>/g, '');
    
    return html;
}

/**
 * Processes inline formatting (bold, italic, links) within a line
 */
function processInlineFormatting(text) {
    let processed = text;
    
    // Convert bold (**text**)
    processed = processed.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    
    // Convert italic (*text* but not **text**)
    processed = processed.replace(/(?<!\*)\*([^*\s][^*]*[^*\s])\*(?!\*)/g, '<em>$1</em>');
    
    // Convert markdown links [text](url)
    processed = processed.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
    
    // Convert plain URLs to links (but not if already in <a> tag)
    processed = processed.replace(/(?<!href=["'])(https?:\/\/[^\s<>"']+)(?!["']>)/g, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>');
    
    return processed;
}

/**
 * Cleans and validates HTML
 */
function cleanHtml(html) {
    // Remove script and style tags
    html = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    html = html.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
    
    // Ensure images have proper attributes
    html = html.replace(/<img([^>]*)>/gi, (match, attrs) => {
        if (!attrs.includes('alt=')) {
            attrs += ' alt="Article image"';
        }
        if (!attrs.includes('loading=')) {
            attrs += ' loading="lazy"';
        }
        return `<img${attrs}>`;
    });
    
    // Ensure links open in new tab
    html = html.replace(/<a\s+([^>]*href=["']([^"']+)["'][^>]*)>/gi, (match, attrs, href) => {
        if (!attrs.includes('target=') && !href.startsWith('#')) {
            attrs += ' target="_blank" rel="noopener noreferrer"';
        }
        return `<a ${attrs}>`;
    });
    
    return html;
}

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

        // Check if content contains HTML
        const hasHtml = /<[^>]+>/.test(originalArticle.content);
        const isHtmlContent = hasHtml || originalArticle.content.includes('<img') || originalArticle.content.includes('<svg') || originalArticle.content.includes('<figure');
        
        const prompt = `You are an expert content writer. Update the following article to match the style, formatting, and content quality of the two reference articles.

Original Article:
Title: ${originalArticle.title}

Content:
${originalArticle.content}

${referenceText}

CRITICAL REQUIREMENTS - YOU MUST RETURN HTML FORMAT:

1. Content Format: Return ALL content as properly formatted HTML, NOT plain text or markdown.

2. HTML Structure Requirements:
   - Use <h2> for main section headings (e.g., "The Unique Challenges of Running a Small Business")
   - Use <h3> for subsections if needed
   - Wrap every paragraph in <p> tags
   - Use <ul><li> for bullet point lists (convert * item or - item to proper HTML)
   - Use <ol><li> for numbered lists (convert 1. item to proper HTML)
   - Use <strong> for bold text (convert **text** to <strong>text</strong>)
   - Use <em> for italic text
   - Use <a href="url" target="_blank" rel="noopener noreferrer">text</a> for all links
   - Convert plain URLs to clickable links: <a href="url">url</a>

3. Content Quality:
   - Maintain the core message and facts from the original article
   - Match the formatting style of the reference articles
   - Improve content quality and readability
   - Keep similar length to the original article
   - Use professional, engaging writing style
   - Ensure proper grammar and flow

4. Media Preservation:
${isHtmlContent ? '   - Preserve ALL HTML elements including images (<img src="..." alt="...">), SVGs (<svg>...</svg>), figures (<figure><img>...</img><figcaption>...</figcaption></figure>)' : ''}
${isHtmlContent ? '   - Keep image sources (src attributes) intact from original content' : ''}
${isHtmlContent ? '   - Maintain proper HTML structure with all formatting tags' : ''}

5. List Formatting Examples:
   - Convert "* **Time Constraints:** text" to: <ul><li><strong>Time Constraints:</strong> text</li></ul>
   - Convert "1. First item" to: <ol><li>First item</li></ol>
   - Each list item should be wrapped in <li> tags

6. Link Formatting:
   - Convert "[text](url)" to: <a href="url" target="_blank" rel="noopener noreferrer">text</a>
   - Convert plain URLs to: <a href="url" target="_blank" rel="noopener noreferrer">url</a>

IMPORTANT: Do NOT use markdown syntax (**bold**, *italic*, [links](url)). Use HTML tags only (<strong>, <em>, <a>).

Return the enhanced article. Format the response EXACTLY as:
TITLE: [enhanced title]
CONTENT: [enhanced content in HTML format - use proper HTML tags for everything]`;

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
                },
            }
        );

        // Validate response structure
        if (!response.data || !response.data.choices || !Array.isArray(response.data.choices) || response.data.choices.length === 0) {
            throw new Error(`Invalid API response structure: ${JSON.stringify(response.data)}`);
        }

        const choice = response.data.choices[0];
        if (!choice || !choice.message || !choice.message.content) {
            throw new Error(`Invalid API response: missing content in choices[0].message. Response: ${JSON.stringify(response.data)}`);
        }

        const responseText = choice.message.content;
        
        // Parse response - handle both HTML and plain text
        const titleMatch = responseText.match(/TITLE:\s*(.+?)(?:\n|CONTENT:)/i);
        const contentMatch = responseText.match(/CONTENT:\s*([\s\S]+)/i);

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
                const parts = responseText.split(/TITLE:\s*.+?\n/i);
                enhancedContent = parts.length > 1 ? parts.slice(1).join('').trim() : responseText;
            }
        }

        // Check if content is already HTML
        const enhancedHasHtml = /<[^>]+>/.test(enhancedContent);
        
        if (enhancedHasHtml) {
            // Content is HTML - clean it up but preserve structure
            enhancedContent = cleanHtml(enhancedContent);
            
            // Ensure proper HTML structure
            // If content doesn't start with a tag, it might be mixed
            if (!enhancedContent.trim().match(/^<[a-z]/i)) {
                // Might have some plain text before HTML, try to fix
                enhancedContent = convertToHtml(enhancedContent);
            }
        } else {
            // LLM returned plain text - convert to HTML
            console.log('LLM returned plain text, converting to HTML...');
            enhancedContent = convertToHtml(enhancedContent);
        }
        
        // Final validation: ensure we have valid HTML
        if (!enhancedContent.includes('<p>') && !enhancedContent.includes('<h')) {
            // No HTML tags found, force conversion
            enhancedContent = convertToHtml(enhancedContent);
        }

        return {
            title: enhancedTitle,
            content: enhancedContent,
        };
    } catch (error) {
        // Log full error for debugging
        if (error.response) {
            console.error('OpenRouter API Error Response:', {
                status: error.response.status,
                statusText: error.response.statusText,
                data: error.response.data,
            });
        }
        
        if (error.response?.status === 401 || error.message.includes('401') || error.message.includes('API_KEY_INVALID') || error.message.includes('API key') || error.message.includes('Unauthorized')) {
            throw new Error(`OpenRouter API key is invalid or expired. Please check your OPENROUTER_API_KEY in .env file. Get a new key at https://openrouter.ai/keys`);
        }
        if (error.response?.status === 429 || error.message.includes('429') || error.message.includes('quota') || error.message.includes('Quota exceeded') || error.message.includes('rate limit')) {
            throw new Error(`OpenRouter API quota exceeded. Please check your usage at https://openrouter.ai/activity or wait before retrying.`);
        }
        
        // Provide more detailed error message
        const errorMessage = error.response?.data?.error?.message || 
                           error.response?.data?.message || 
                           error.message;
        throw new Error(`Failed to enhance article: ${errorMessage}`);
    }
}


