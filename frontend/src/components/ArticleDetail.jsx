import React, { useState, useMemo } from 'react';
import { enhanceArticle } from '../api';
import { sanitizeContent } from '../utils/contentSanitizer';

function ArticleDetail({ article, onBack, onArticleUpdated }) {
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [enhancementError, setEnhancementError] = useState(null);
  const [enhancementSuccess, setEnhancementSuccess] = useState(null);

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Sanitize content on mount and when article changes
  const sanitizedContent = useMemo(() => {
    if (!article?.content) return '';
    try {
      return sanitizeContent(article.content);
    } catch (error) {
      console.error('Error sanitizing content:', error);
      return article.content; // Fallback to original if sanitization fails
    }
  }, [article?.content]);

  const handleEnhance = async () => {
    if (isEnhancing) return;
    
    setIsEnhancing(true);
    setEnhancementError(null);
    setEnhancementSuccess(null);

    try {
      const result = await enhanceArticle(article.id);
      setEnhancementSuccess(`Article enhanced successfully! New article ID: ${result.data.enhancedArticleId}`);
      
      // Refresh the article list after a short delay
      setTimeout(() => {
        if (onArticleUpdated) {
          onArticleUpdated();
        }
      }, 2000);
    } catch (error) {
      setEnhancementError(error.message);
    } finally {
      setIsEnhancing(false);
    }
  };

  return (
    <div className="article-detail">
      <button className="back-button" onClick={onBack}>
        ← Back to Articles
      </button>

      <article className="article-content">
        <header className="article-header">
          <h1>{article.title}</h1>
          <div className="article-meta">
            <span className="article-date">
              Published: {formatDate(article.published_date)}
            </span>
            {article.is_enhanced && (
              <span className="badge enhanced">Enhanced Article</span>
            )}
          </div>
          {!article.is_enhanced && (
            <div className="enhance-section">
              <button 
                className="enhance-button" 
                onClick={handleEnhance}
                disabled={isEnhancing}
              >
                {isEnhancing ? 'Enhancing...' : '✨ Enhance Article'}
              </button>
              {enhancementError && (
                <div className="error-message">{enhancementError}</div>
              )}
              {enhancementSuccess && (
                <div className="success-message">{enhancementSuccess}</div>
              )}
            </div>
          )}
          {article.is_enhanced && article.original_article_id && (
            <div className="original-link">
              <a href={`#article-${article.original_article_id}`}>
                View original article #{article.original_article_id}
              </a>
            </div>
          )}
        </header>

        <div
          className="article-body"
          dangerouslySetInnerHTML={{ __html: sanitizedContent }}
        />

        {article.reference_urls && article.reference_urls.length > 0 && (
          <footer className="article-references">
            <h3>References</h3>
            <ul>
              {article.reference_urls.map((url, index) => (
                <li key={index}>
                  <a href={url} target="_blank" rel="noopener noreferrer">
                    {url}
                  </a>
                </li>
              ))}
            </ul>
          </footer>
        )}

        {article.original_url && (
          <div className="original-url">
            <a href={article.original_url} target="_blank" rel="noopener noreferrer">
              View original source
            </a>
          </div>
        )}
      </article>
    </div>
  );
}

export default ArticleDetail;


