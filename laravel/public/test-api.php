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
$pathParts = explode('/', trim($path, '/'));

try {
    $pdo = new PDO(
        "pgsql:host={$_ENV['DB_HOST']};port={$_ENV['DB_PORT']};dbname={$_ENV['DB_DATABASE']}",
        $_ENV['DB_USERNAME'],
        $_ENV['DB_PASSWORD']
    );
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Handle /api/articles routes
    if ($pathParts[0] === 'api' && $pathParts[1] === 'articles') {
        if ($method === 'GET' && !isset($pathParts[2])) {
            // GET /api/articles - List all
            $stmt = $pdo->query("SELECT * FROM articles ORDER BY published_date DESC, id DESC");
            $articles = $stmt->fetchAll(PDO::FETCH_ASSOC);
            echo json_encode($articles);
        } elseif ($method === 'GET' && isset($pathParts[2])) {
            // GET /api/articles/{id} - Get one
            $id = (int)$pathParts[2];
            $stmt = $pdo->prepare("SELECT * FROM articles WHERE id = ?");
            $stmt->execute([$id]);
            $article = $stmt->fetch(PDO::FETCH_ASSOC);
            if ($article) {
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
            http_response_code(201);
            echo json_encode($article);
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

