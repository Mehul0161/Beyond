import React from 'react';

function ArticleDetail({ article, onBack }) {
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
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
          dangerouslySetInnerHTML={{ __html: article.content }}
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


