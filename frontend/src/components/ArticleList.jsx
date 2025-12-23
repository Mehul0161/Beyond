import React, { useState } from 'react';
import { enhanceArticle } from '../api';

function ArticleList({ articles, onArticleClick, onArticleUpdated }) {
  const [enhancingId, setEnhancingId] = useState(null);
  const [enhancementErrors, setEnhancementErrors] = useState({});

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getPreview = (content) => {
    if (!content) return 'No preview available...';
    try {
      // Remove HTML tags and get first 200 characters
      let text = content.replace(/<[^>]*>/g, '');
      // Decode common HTML entities
      text = text
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'");
      text = text.trim().replace(/\s+/g, ' ');
      return text.length > 200 ? text.substring(0, 200) + '...' : text || 'No preview available...';
    } catch (error) {
      return 'No preview available...';
    }
  };

  const handleEnhance = async (e, articleId) => {
    e.stopPropagation(); // Prevent card click
    
    if (enhancingId === articleId) return;
    
    setEnhancingId(articleId);
    setEnhancementErrors(prev => ({ ...prev, [articleId]: null }));

    try {
      const result = await enhanceArticle(articleId);
      // Refresh articles after enhancement
      if (onArticleUpdated) {
        setTimeout(() => {
          onArticleUpdated();
        }, 1000);
      }
    } catch (error) {
      setEnhancementErrors(prev => ({ ...prev, [articleId]: error.message }));
    } finally {
      setEnhancingId(null);
    }
  };


  return (
    <div className="article-list">
      <div className="article-list-header">
        <h2>All Articles</h2>
      </div>
      
      {articles.length === 0 ? (
        <p className="no-articles">No articles available.</p>
      ) : (
        <div className="articles-grid">
          {articles.map((article) => (
            <div
              key={article.id}
              className="article-card"
              onClick={() => onArticleClick(article.id)}
            >
              <div className="article-header">
                <h3>{article.title}</h3>
                {article.is_enhanced && (
                  <span className="badge enhanced">Enhanced</span>
                )}
              </div>
              <p className="article-preview">{getPreview(article.content)}</p>
              <div className="article-footer">
                <span className="article-date">
                  {formatDate(article.published_date)}
                </span>
                {article.is_enhanced && article.original_article_id && (
                  <span className="original-link">
                    Enhanced from article #{article.original_article_id}
                  </span>
                )}
              </div>
              {!article.is_enhanced && (
                <div className="article-actions" onClick={(e) => e.stopPropagation()}>
                  <button 
                    className="enhance-button-small"
                    onClick={(e) => handleEnhance(e, article.id)}
                    disabled={enhancingId === article.id}
                  >
                    {enhancingId === article.id ? 'Enhancing...' : '✨ Enhance'}
                  </button>
                  {enhancementErrors[article.id] && (
                    <div className="error-message-small">{enhancementErrors[article.id]}</div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ArticleList;


