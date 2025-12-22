import React from 'react';

function ArticleList({ articles, onArticleClick }) {
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
    if (!content) return '';
    // Remove HTML tags and get first 150 characters
    const text = content.replace(/<[^>]*>/g, '');
    return text.length > 150 ? text.substring(0, 150) + '...' : text;
  };

  return (
    <div className="article-list">
      <h2>All Articles</h2>
      {articles.length === 0 ? (
        <p className="no-articles">No articles found.</p>
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
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ArticleList;


