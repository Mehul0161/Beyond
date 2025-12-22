<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require __DIR__.'/../vendor/autoload.php';

$dotenv = Dotenv\Dotenv::createImmutable(__DIR__.'/..');
$dotenv->load();

$method = $_SERVER['REQUEST_METHOD'];
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$pathParts = array_filter(explode('/', trim($path, '/')));
$pathParts = array_values($pathParts);

try {
    $pdo = new PDO(
        "pgsql:host={$_ENV['DB_HOST']};port={$_ENV['DB_PORT']};dbname={$_ENV['DB_DATABASE']}",
        $_ENV['DB_USERNAME'],
        $_ENV['DB_PASSWORD']
    );
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Handle /api/articles routes
    if (isset($pathParts[0]) && $pathParts[0] === 'api' && isset($pathParts[1]) && $pathParts[1] === 'articles') {
        if ($method === 'GET' && !isset($pathParts[2])) {
            // GET /api/articles - List all
            $stmt = $pdo->query("SELECT * FROM articles ORDER BY published_date DESC, id DESC");
            $articles = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Convert JSON fields
            foreach ($articles as &$article) {
                if ($article['reference_urls']) {
                    $article['reference_urls'] = json_decode($article['reference_urls'], true);
                }
                $article['is_enhanced'] = $article['is_enhanced'] === 't' || $article['is_enhanced'] === true;
            }
            
            echo json_encode($articles);
        } elseif ($method === 'GET' && isset($pathParts[2])) {
            // GET /api/articles/{id} - Get one
            $id = (int)$pathParts[2];
            $stmt = $pdo->prepare("SELECT * FROM articles WHERE id = ?");
            $stmt->execute([$id]);
            $article = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($article) {
                if ($article['reference_urls']) {
                    $article['reference_urls'] = json_decode($article['reference_urls'], true);
                }
                $article['is_enhanced'] = $article['is_enhanced'] === 't' || $article['is_enhanced'] === true;
                echo json_encode($article);
            } else {
                http_response_code(404);
                echo json_encode(['error' => 'Article not found']);
            }
        } elseif ($method === 'POST') {
            // POST /api/articles - Create
            $data = json_decode(file_get_contents('php://input'), true);
            
            $stmt = $pdo->prepare("INSERT INTO articles (title, content, original_url, published_date, is_enhanced, original_article_id, reference_urls) VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING *");
            $stmt->execute([
                $data['title'] ?? '',
                $data['content'] ?? '',
                $data['original_url'] ?? null,
                $data['published_date'] ?? date('Y-m-d'),
                $data['is_enhanced'] ?? false,
                $data['original_article_id'] ?? null,
                isset($data['reference_urls']) ? json_encode($data['reference_urls']) : null
            ]);
            $article = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($article['reference_urls']) {
                $article['reference_urls'] = json_decode($article['reference_urls'], true);
            }
            $article['is_enhanced'] = $article['is_enhanced'] === 't' || $article['is_enhanced'] === true;
            
            http_response_code(201);
            echo json_encode($article);
        } elseif ($method === 'PUT' && isset($pathParts[2])) {
            // PUT /api/articles/{id} - Update
            $id = (int)$pathParts[2];
            $data = json_decode(file_get_contents('php://input'), true);
            
            $fields = [];
            $values = [];
            
            if (isset($data['title'])) {
                $fields[] = 'title = ?';
                $values[] = $data['title'];
            }
            if (isset($data['content'])) {
                $fields[] = 'content = ?';
                $values[] = $data['content'];
            }
            if (isset($data['original_url'])) {
                $fields[] = 'original_url = ?';
                $values[] = $data['original_url'];
            }
            if (isset($data['published_date'])) {
                $fields[] = 'published_date = ?';
                $values[] = $data['published_date'];
            }
            if (isset($data['is_enhanced'])) {
                $fields[] = 'is_enhanced = ?';
                $values[] = $data['is_enhanced'];
            }
            if (isset($data['original_article_id'])) {
                $fields[] = 'original_article_id = ?';
                $values[] = $data['original_article_id'];
            }
            if (isset($data['reference_urls'])) {
                $fields[] = 'reference_urls = ?';
                $values[] = json_encode($data['reference_urls']);
            }
            
            $fields[] = 'updated_at = CURRENT_TIMESTAMP';
            $values[] = $id;
            
            $sql = "UPDATE articles SET " . implode(', ', $fields) . " WHERE id = ? RETURNING *";
            $stmt = $pdo->prepare($sql);
            $stmt->execute($values);
            $article = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($article) {
                if ($article['reference_urls']) {
                    $article['reference_urls'] = json_decode($article['reference_urls'], true);
                }
                $article['is_enhanced'] = $article['is_enhanced'] === 't' || $article['is_enhanced'] === true;
                echo json_encode($article);
            } else {
                http_response_code(404);
                echo json_encode(['error' => 'Article not found']);
            }
        } elseif ($method === 'DELETE' && isset($pathParts[2])) {
            // DELETE /api/articles/{id} - Delete
            $id = (int)$pathParts[2];
            $stmt = $pdo->prepare("DELETE FROM articles WHERE id = ?");
            $stmt->execute([$id]);
            
            if ($stmt->rowCount() > 0) {
                echo json_encode(['message' => 'Article deleted successfully']);
            } else {
                http_response_code(404);
                echo json_encode(['error' => 'Article not found']);
            }
        } else {
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
        }
    } else {
        http_response_code(404);
        echo json_encode(['error' => 'Not found']);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
