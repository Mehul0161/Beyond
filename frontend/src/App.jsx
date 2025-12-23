import React, { useState, useEffect } from 'react';
import ArticleList from './components/ArticleList';
import ArticleDetail from './components/ArticleDetail';

function App() {
  const [articles, setArticles] = useState([]);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadArticles();
  }, []);

  const loadArticles = async () => {
    try {
      setLoading(true);
      const { getArticles } = await import('./api');
      const data = await getArticles();
      setArticles(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleArticleClick = async (id) => {
    try {
      const { getArticle } = await import('./api');
      const article = await getArticle(id);
      setSelectedArticle(article);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleBack = () => {
    setSelectedArticle(null);
  };

  if (loading) {
    return (
      <div className="app">
        <header className="header">
          <h1>BeyondChats Articles</h1>
        </header>
        <main className="main">
          <div className="loading">Loading articles...</div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <div className="error">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="header">
        <h1>BeyondChats Articles</h1>
      </header>
      <main className="main">
        {selectedArticle ? (
          <ArticleDetail 
            article={selectedArticle} 
            onBack={handleBack}
            onArticleUpdated={loadArticles}
          />
        ) : (
          <ArticleList 
            articles={articles} 
            onArticleClick={handleArticleClick}
            onArticleUpdated={loadArticles}
          />
        )}
      </main>
    </div>
  );
}

export default App;


