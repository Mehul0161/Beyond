<?php

namespace App\Console\Commands;

use App\Models\Article;
use GuzzleHttp\Client as GuzzleClient;
use Symfony\Component\DomCrawler\Crawler;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class ScrapeArticles extends Command
{
    protected $signature = 'scrape:articles';
    protected $description = 'Scrape the 5 oldest articles from BeyondChats blog';

    public function handle(): int
    {
        $this->info('Starting to scrape BeyondChats articles...');

        $client = new GuzzleClient([
            'timeout' => 30,
            'verify' => false, // Disable SSL verification for scraping
            'http_errors' => false,
        ]);
        $baseUrl = 'https://beyondchats.com/blogs/';

        // Find the last page
        $lastPage = $this->findLastPage($client, $baseUrl);
        $this->info("Found last page: {$lastPage}");

        // Get articles from the last page
        $lastPageUrl = $baseUrl . ($lastPage > 1 ? "page/{$lastPage}/" : '');
        $lastPageArticles = $this->scrapePage($client, $lastPageUrl);
        
        if (empty($lastPageArticles)) {
            $this->error('No articles found on the last page.');
            return Command::FAILURE;
        }

        // Start with articles from the last page
        $allCandidates = $lastPageArticles;

        // If there are fewer than 5 on the last page, pull remaining from the second last page
        if (count($allCandidates) < 5 && $lastPage > 1) {
            $secondLastPage = $lastPage - 1;
            $secondLastUrl = $baseUrl . ($secondLastPage > 1 ? "page/{$secondLastPage}/" : '');

            $this->info("Last page has only " . count($allCandidates) . " articles, fetching remaining from page {$secondLastPage}...");

            $secondLastArticles = $this->scrapePage($client, $secondLastUrl);

            if (!empty($secondLastArticles)) {
                // Merge: second-last page first, then last page
                $allCandidates = array_merge($secondLastArticles, $allCandidates);
            }
        }

        // Get the 5 oldest articles from the combined list (tail of the array)
        $oldestArticles = array_slice($allCandidates, -5);

        $this->info('Found ' . count($oldestArticles) . ' articles to save.');

        $saved = 0;
        foreach ($oldestArticles as $articleData) {
            try {
                // Check if article already exists
                $existing = Article::where('original_url', $articleData['url'])->first();
                
                if ($existing) {
                    $this->warn("Article already exists: {$articleData['title']}");
                    continue;
                }

                Article::create([
                    'title' => $articleData['title'],
                    'content' => $articleData['content'],
                    'original_url' => $articleData['url'],
                    'published_date' => $articleData['published_date'],
                    'is_enhanced' => false,
                ]);

                $saved++;
                $this->info("Saved: {$articleData['title']}");
            } catch (\Exception $e) {
                $this->error("Error saving article: {$e->getMessage()}");
                Log::error("Scraping error: {$e->getMessage()}");
            }
        }

        $this->info("Successfully saved {$saved} articles.");
        return Command::SUCCESS;
    }

    private function findLastPage(GuzzleClient $client, string $baseUrl): int
    {
        $currentPage = 1;
        $lastPage = 1;

        while (true) {
            $url = $currentPage === 1 ? $baseUrl : $baseUrl . "page/{$currentPage}/";
            
            try {
                $response = $client->get($url);
                $html = $response->getBody()->getContents();
                $crawler = new Crawler($html);
                
                // Check for pagination links
                $nextLink = $crawler->filter('a.next, a[rel="next"]')->first();
                
                if ($nextLink->count() === 0) {
                    // Try to find page numbers
                    $pageLinks = $crawler->filter('.pagination a, .page-numbers a')->each(function ($node) {
                        $text = $node->text();
                        if (is_numeric($text)) {
                            return (int) $text;
                        }
                        return null;
                    });
                    
                    if (!empty($pageLinks)) {
                        $lastPage = max(array_filter($pageLinks));
                    } else {
                        $lastPage = $currentPage;
                    }
                    break;
                }

                $currentPage++;
                $lastPage = $currentPage;
            } catch (\Exception $e) {
                $this->warn("Error checking page {$currentPage}: {$e->getMessage()}");
                break;
            }
        }

        return $lastPage;
    }

    private function scrapePage(GuzzleClient $client, string $url): array
    {
        $articles = [];

        try {
            $response = $client->get($url);
            $html = $response->getBody()->getContents();
            $crawler = new Crawler($html);

            // Find article links - adjust selectors based on actual site structure
            $crawler->filter('article, .post, .blog-post, [class*="article"]')->each(function ($node) use (&$articles, $client) {
                try {
                    // Try to find title and link
                    $titleNode = $node->filter('h1, h2, h3, .title, .entry-title, a')->first();
                    if ($titleNode->count() === 0) {
                        return;
                    }

                    $title = $titleNode->text();
                    $link = $titleNode->filterXPath('ancestor-or-self::a')->count() > 0 
                        ? $titleNode->filterXPath('ancestor-or-self::a')->attr('href')
                        : $titleNode->closest('a')->attr('href') ?? '';

                    if (empty($link)) {
                        return;
                    }

                    // Make URL absolute if relative
                    if (strpos($link, 'http') !== 0) {
                        $link = 'https://beyondchats.com' . ltrim($link, '/');
                    }

                    // Scrape individual article page
                    $articleData = $this->scrapeArticlePage($client, $link);
                    if ($articleData) {
                        $articles[] = $articleData;
                    }
                } catch (\Exception $e) {
                    $this->warn("Error scraping article: {$e->getMessage()}");
                }
            });

            // Alternative: if articles are listed differently, try finding all links
            if (empty($articles)) {
                $crawler->filter('a')->each(function ($node) use (&$articles, $client) {
                    $href = $node->attr('href');
                    if ($href && strpos($href, '/blog/') !== false || strpos($href, '/blogs/') !== false) {
                        if (strpos($href, 'http') !== 0) {
                            $href = 'https://beyondchats.com' . ltrim($href, '/');
                        }
                        
                        $articleData = $this->scrapeArticlePage($client, $href);
                        if ($articleData && !in_array($articleData['url'], array_column($articles, 'url'))) {
                            $articles[] = $articleData;
                        }
                    }
                });
            }

        } catch (\Exception $e) {
            $this->error("Error scraping page: {$e->getMessage()}");
        }

        return $articles;
    }

    private function scrapeArticlePage(GuzzleClient $client, string $url): ?array
    {
        try {
            $response = $client->get($url);
            $html = $response->getBody()->getContents();
            $crawler = new Crawler($html);

            // Extract title
            $title = $crawler->filter('h1, .entry-title, .post-title, article h1')->first()->text() ?? '';

            // Extract content
            $content = '';
            $contentSelectors = [
                '.entry-content',
                '.post-content',
                '.article-content',
                'article .content',
                'main article',
                'article',
            ];

            foreach ($contentSelectors as $selector) {
                $contentNode = $crawler->filter($selector)->first();
                if ($contentNode->count() > 0) {
                    $content = $contentNode->html();
                    break;
                }
            }

            if (empty($content)) {
                // Fallback: get all paragraphs
                $content = $crawler->filter('p')->each(function ($node) {
                    return $node->html();
                });
                $content = implode("\n", $content);
            }

            // Extract published date
            $publishedDate = now()->toDateString();
            $dateSelectors = [
                'time[datetime]',
                '.published-date',
                '.post-date',
                '.entry-date',
                '[class*="date"]',
            ];

            foreach ($dateSelectors as $selector) {
                $dateNode = $crawler->filter($selector)->first();
                if ($dateNode->count() > 0) {
                    $dateAttr = $dateNode->attr('datetime');
                    if ($dateAttr) {
                        try {
                            $publishedDate = date('Y-m-d', strtotime($dateAttr));
                        } catch (\Exception $e) {
                            // Try parsing text
                            $dateText = $dateNode->text();
                            $parsed = strtotime($dateText);
                            if ($parsed) {
                                $publishedDate = date('Y-m-d', $parsed);
                            }
                        }
                        break;
                    }
                }
            }

            if (empty($title) || empty($content)) {
                return null;
            }

            return [
                'title' => trim($title),
                'content' => trim($content),
                'url' => $url,
                'published_date' => $publishedDate,
            ];
        } catch (\Exception $e) {
            $this->warn("Error scraping article page {$url}: {$e->getMessage()}");
            return null;
        }
    }
}


