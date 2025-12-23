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

        // Step 1: Collect article URLs from the last page
        $lastPageUrl = $baseUrl . ($lastPage > 1 ? "page/{$lastPage}/" : '');
        $articleUrls = $this->collectArticleUrls($client, $lastPageUrl);
        
        if (empty($articleUrls)) {
            $this->error('No article URLs found on the last page.');
            return Command::FAILURE;
        }

        $this->info("Found " . count($articleUrls) . " article URLs on last page.");

        // Step 2: Always check second-last page to ensure we get the truly oldest articles
        // Even if last page has 5+ articles, older articles might be on previous pages
        if ($lastPage > 1) {
            $secondLastPage = $lastPage - 1;
            $secondLastUrl = $baseUrl . ($secondLastPage > 1 ? "page/{$secondLastPage}/" : '');

            $this->info("Checking page {$secondLastPage} for older articles...");

            $secondLastUrls = $this->collectArticleUrls($client, $secondLastUrl);

            if (!empty($secondLastUrls)) {
                $this->info("Found " . count($secondLastUrls) . " article URLs on page {$secondLastPage}.");
                // Merge: second-last page URLs first (they should be older), then last page URLs
                $articleUrls = array_merge($secondLastUrls, $articleUrls);
            }
        }

        // Step 3: Remove duplicates while preserving order
        $articleUrls = array_values(array_unique($articleUrls));
        $this->info("Total unique article URLs: " . count($articleUrls));

        // Step 4: Scrape articles - scrape enough to ensure we get 5 valid ones
        // Scrape up to 20 articles to have enough candidates for sorting by date
        $maxToScrape = min(count($articleUrls), 20);
        $this->info("Scraping {$maxToScrape} articles to find the 5 oldest...");

        $scrapedArticles = [];
        foreach (array_slice($articleUrls, 0, $maxToScrape) as $index => $url) {
            $this->info("Scraping article " . ($index + 1) . "/{$maxToScrape}: {$url}");
            $articleData = $this->scrapeArticlePage($client, $url);
            if ($articleData && !empty($articleData['title']) && !empty($articleData['content'])) {
                // Validate content length (should be substantial)
                $contentLength = strlen(strip_tags($articleData['content']));
                if ($contentLength > 200) { // At least 200 characters of text
                    $scrapedArticles[] = $articleData;
                    $this->info("✓ Scraped: {$articleData['title']} (Date: {$articleData['published_date']}, Content: {$contentLength} chars)");
                } else {
                    $this->warn("⚠ Skipped: {$articleData['title']} - Content too short ({$contentLength} chars)");
                }
            } else {
                $this->warn("⚠ Failed to scrape: {$url}");
            }
        }

        if (empty($scrapedArticles)) {
            $this->error('No articles could be scraped successfully.');
            return Command::FAILURE;
        }

        $this->info("Successfully scraped " . count($scrapedArticles) . " articles.");

        // Step 4: Sort by published_date to get the oldest articles
        usort($scrapedArticles, function ($a, $b) {
            $dateA = strtotime($a['published_date'] ?? '1970-01-01');
            $dateB = strtotime($b['published_date'] ?? '1970-01-01');
            return $dateA <=> $dateB; // Ascending order (oldest first)
        });

        // Step 5: Get the 5 oldest articles
        $oldestArticles = array_slice($scrapedArticles, 0, 5);
        
        $this->info("Selected 5 oldest articles:");
        foreach ($oldestArticles as $idx => $article) {
            $this->info("  " . ($idx + 1) . ". {$article['title']} ({$article['published_date']})");
        }

        $this->info('Found ' . count($oldestArticles) . ' oldest articles to save.');

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

    private function collectArticleUrls(GuzzleClient $client, string $url): array
    {
        $articleUrls = [];
        $foundUrls = [];

        try {
            $response = $client->get($url);
            $html = $response->getBody()->getContents();
            $crawler = new Crawler($html);

            $this->info("Collecting article URLs from: {$url}");

            // Find all article URLs without scraping content
            $crawler->filter('a')->each(function ($node) use (&$articleUrls, &$foundUrls) {
                try {
                    $href = $node->attr('href');
                    if (empty($href)) {
                        return;
                    }

                    // Make URL absolute if relative
                    if (strpos($href, 'http') !== 0) {
                        $href = 'https://beyondchats.com' . ltrim($href, '/');
                    }

                    // Skip if already found
                    if (in_array($href, $foundUrls)) {
                        return;
                    }

                    // Skip listing pages, pagination, tag pages, and non-blog URLs
                    if (strpos($href, '/blogs/page/') !== false || 
                        strpos($href, '/blog/page/') !== false ||
                        strpos($href, '/tag/') !== false ||
                        strpos($href, '/category/') !== false ||
                        $href === 'https://beyondchats.com/blogs/' ||
                        $href === 'https://beyondchats.com/blog/' ||
                        strpos($href, '?page=') !== false ||
                        strpos($href, '#') !== false) {
                        return;
                    }

                    // Check if this is a blog article URL
                    $parsedUrl = parse_url($href);
                    if (!isset($parsedUrl['path'])) {
                        return;
                    }

                    $path = $parsedUrl['path'];
                    
                    // Match patterns like /blog/article-name/ or /blogs/article-name/
                    $isArticleUrl = false;
                    if (preg_match('#^/(blog|blogs)/[^/]+(/|$)#', $path)) {
                        $isArticleUrl = true;
                    }

                    // Also check if URL contains beyondchats.com and has blog/article pattern
                    if (!$isArticleUrl && strpos($href, 'beyondchats.com') !== false) {
                        if ((strpos($href, '/blog/') !== false || strpos($href, '/blogs/') !== false) &&
                            !preg_match('#/(blog|blogs)/?$#', $path)) {
                            $isArticleUrl = true;
                        }
                    }

                    if ($isArticleUrl) {
                        $foundUrls[] = $href;
                        $articleUrls[] = $href;
                    }
                } catch (\Exception $e) {
                    // Skip errors when collecting URLs
                }
            });

            // If no articles found with Strategy 1, try permissive approach
            if (empty($articleUrls)) {
                $crawler->filter('a')->each(function ($node) use (&$articleUrls, &$foundUrls) {
                    try {
                        $href = $node->attr('href');
                        if (empty($href)) {
                            return;
                        }

                        if (strpos($href, 'http') !== 0) {
                            $href = 'https://beyondchats.com' . ltrim($href, '/');
                        }

                        if (in_array($href, $foundUrls) || strpos($href, 'beyondchats.com') === false) {
                            return;
                        }

                        // Skip obvious non-article pages
                        if (strpos($href, '/blogs/page/') !== false || 
                            strpos($href, '/blog/page/') !== false ||
                            strpos($href, '/tag/') !== false ||
                            strpos($href, '/category/') !== false ||
                            strpos($href, '/author/') !== false ||
                            $href === 'https://beyondchats.com/blogs/' ||
                            $href === 'https://beyondchats.com/blog/' ||
                            strpos($href, '?page=') !== false ||
                            strpos($href, '#') !== false) {
                            return;
                        }

                        $path = parse_url($href, PHP_URL_PATH);
                        if ($path === '/' || $path === '/blogs' || $path === '/blog') {
                            return;
                        }

                        $foundUrls[] = $href;
                        $articleUrls[] = $href;
                    } catch (\Exception $e) {
                        // Skip errors
                    }
                });
            }

            $this->info("Collected " . count($articleUrls) . " article URLs.");

        } catch (\Exception $e) {
            $this->error("Error collecting URLs from page: {$e->getMessage()}");
        }

        return $articleUrls;
    }

    private function scrapePage(GuzzleClient $client, string $url): array
    {
        $articles = [];
        $foundUrls = []; // Track URLs to avoid duplicates

        try {
            $response = $client->get($url);
            $html = $response->getBody()->getContents();
            $crawler = new Crawler($html);

            $this->info("Scraping page: {$url}");

            // Debug: Count all links
            $linkCount = $crawler->filter('a')->count();
            $this->info("Found {$linkCount} total links on page");

            // Strategy 1: Find all links and filter for blog articles
            $crawler->filter('a')->each(function ($node) use (&$articles, &$foundUrls, $client, $url) {
                try {
                    $href = $node->attr('href');
                    if (empty($href)) {
                        return;
                    }

                    // Make URL absolute if relative
                    if (strpos($href, 'http') !== 0) {
                        $href = 'https://beyondchats.com' . ltrim($href, '/');
                    }

                    // Skip if already found
                    if (in_array($href, $foundUrls)) {
                        return;
                    }

                    // Skip listing pages, pagination, tag pages, and non-blog URLs
                    if (strpos($href, '/blogs/page/') !== false || 
                        strpos($href, '/blog/page/') !== false ||
                        strpos($href, '/tag/') !== false ||  // Exclude tag archive pages
                        strpos($href, '/category/') !== false ||  // Exclude category pages
                        $href === 'https://beyondchats.com/blogs/' ||
                        $href === 'https://beyondchats.com/blog/' ||
                        strpos($href, '?page=') !== false ||
                        strpos($href, '#') !== false) {
                        return;
                    }

                    // Check if this is a blog article URL
                    // Articles should have a path like /blog/article-slug/ or /blogs/article-slug/
                    $parsedUrl = parse_url($href);
                    if (!isset($parsedUrl['path'])) {
                        return;
                    }

                    $path = $parsedUrl['path'];
                    
                    // Match patterns like /blog/article-name/ or /blogs/article-name/
                    // But exclude /blog/ or /blogs/ alone
                    $isArticleUrl = false;
                    if (preg_match('#^/(blog|blogs)/[^/]+(/|$)#', $path)) {
                        $isArticleUrl = true;
                    }

                    // Also check if URL contains beyondchats.com and has blog/article pattern
                    if (!$isArticleUrl && strpos($href, 'beyondchats.com') !== false) {
                        if ((strpos($href, '/blog/') !== false || strpos($href, '/blogs/') !== false) &&
                            !preg_match('#/(blog|blogs)/?$#', $path)) {
                            // Has blog path but not just /blog/ or /blogs/
                            $isArticleUrl = true;
                        }
                    }

                    if (!$isArticleUrl) {
                        return;
                    }

                    $foundUrls[] = $href;
                    $this->info("Found potential article URL: {$href}");

                    // Scrape individual article page
                    $articleData = $this->scrapeArticlePage($client, $href);
                    if ($articleData && !empty($articleData['title']) && !empty($articleData['content'])) {
                        $articles[] = $articleData;
                        $this->info("✓ Successfully scraped: {$articleData['title']}");
                    } else {
                        $this->warn("✗ Failed to scrape content from: {$href}");
                    }
                } catch (\Exception $e) {
                    $this->warn("Error processing link: {$e->getMessage()}");
                }
            });

            // Strategy 2: If no articles found, try a more permissive approach
            // Look for any beyondchats.com link that might be an article
            if (empty($articles)) {
                $this->info("Strategy 1 found no articles, trying more permissive approach...");
                
                $crawler->filter('a')->each(function ($node) use (&$articles, &$foundUrls, $client) {
                    try {
                        $href = $node->attr('href');
                        if (empty($href)) {
                            return;
                        }

                        // Make URL absolute if relative
                        if (strpos($href, 'http') !== 0) {
                            $href = 'https://beyondchats.com' . ltrim($href, '/');
                        }

                        // Only process beyondchats.com links
                        if (strpos($href, 'beyondchats.com') === false) {
                            return;
                        }

                        // Skip if already found
                        if (in_array($href, $foundUrls)) {
                            return;
                        }

                        // Skip obvious non-article pages
                        if (strpos($href, '/blogs/page/') !== false || 
                            strpos($href, '/blog/page/') !== false ||
                            strpos($href, '/tag/') !== false ||  // Exclude tag archive pages
                            strpos($href, '/category/') !== false ||
                            strpos($href, '/author/') !== false ||
                            $href === 'https://beyondchats.com/blogs/' ||
                            $href === 'https://beyondchats.com/blog/' ||
                            strpos($href, '?page=') !== false ||
                            strpos($href, '#') !== false) {
                            return;
                        }

                        // Skip homepage and main pages
                        $path = parse_url($href, PHP_URL_PATH);
                        if ($path === '/' || $path === '/blogs' || $path === '/blog') {
                            return;
                        }

                        $foundUrls[] = $href;
                        $this->info("Trying URL (permissive): {$href}");

                        // Try to scrape - if it has title and content, it's likely an article
                        $articleData = $this->scrapeArticlePage($client, $href);
                        if ($articleData && !empty($articleData['title']) && !empty($articleData['content']) && 
                            strlen($articleData['content']) > 500) { // Articles should have substantial content
                            $articles[] = $articleData;
                            $this->info("✓ Successfully scraped article: {$articleData['title']}");
                        }
                    } catch (\Exception $e) {
                        // Silently skip errors in permissive mode
                    }
                });
            }

            $this->info("Total articles found on page: " . count($articles));

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

            // Extract content - try multiple strategies to get full article
            $content = '';
            
            // Strategy 1: Try common content containers
            $contentSelectors = [
                '.entry-content',
                '.post-content',
                '.article-content',
                '.blog-content',
                'article .content',
                'main article',
                '[role="article"]',
                '.content-area article',
                'article',
            ];

            foreach ($contentSelectors as $selector) {
                $contentNode = $crawler->filter($selector)->first();
                if ($contentNode->count() > 0) {
                    // Get ALL content elements within the container
                    $content = $contentNode->filter('p, h1, h2, h3, h4, h5, h6, ul, ol, li, blockquote, pre, code, div, span, strong, em, a, img, br, hr, table, tr, td, th, thead, tbody')->each(function ($node) {
                        // Skip if it's a script, style, or navigation element
                        $tag = $node->nodeName();
                        $class = $node->attr('class') ?? '';
                        $id = $node->attr('id') ?? '';
                        
                        // Skip navigation, header, footer, sidebar elements
                        if (stripos($class, 'nav') !== false || 
                            stripos($class, 'header') !== false || 
                            stripos($class, 'footer') !== false ||
                            stripos($class, 'sidebar') !== false ||
                            stripos($class, 'menu') !== false ||
                            stripos($id, 'nav') !== false ||
                            stripos($id, 'header') !== false ||
                            stripos($id, 'footer') !== false) {
                            return null;
                        }
                        
                        return $node->outerHtml();
                    });
                    $content = array_filter($content); // Remove nulls
                    $content = implode("\n", $content);
                    
                    // If we got substantial content, use it
                    if (!empty(trim(strip_tags($content))) && strlen(strip_tags($content)) > 200) {
                        break;
                    }
                }
            }

            // Strategy 2: If still empty or too short, try getting HTML directly from the container
            if (empty($content) || strlen(strip_tags($content)) < 200) {
                foreach ($contentSelectors as $selector) {
                    $contentNode = $crawler->filter($selector)->first();
                    if ($contentNode->count() > 0) {
                        $content = $contentNode->html();
                        // Remove scripts, styles, and other non-content elements
                        $content = preg_replace('/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/mi', '', $content);
                        $content = preg_replace('/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/mi', '', $content);
                        $content = preg_replace('/<nav\b[^<]*(?:(?!<\/nav>)<[^<]*)*<\/nav>/mi', '', $content);
                        $content = preg_replace('/<header\b[^<]*(?:(?!<\/header>)<[^<]*)*<\/header>/mi', '', $content);
                        $content = preg_replace('/<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>/mi', '', $content);
                        $content = preg_replace('/<aside\b[^<]*(?:(?!<\/aside>)<[^<]*)*<\/aside>/mi', '', $content);
                        
                        // Remove elements with navigation/header/footer classes
                        $content = preg_replace('/<[^>]*(class|id)=["\'][^"\']*(nav|header|footer|sidebar|menu)[^"\']*["\'][^>]*>.*?<\/[^>]+>/is', '', $content);
                        
                        if (!empty(trim(strip_tags($content))) && strlen(strip_tags($content)) > 200) {
                            break;
                        }
                    }
                }
            }

            // Strategy 3: Fallback - get all content from main/article areas
            if (empty($content) || strlen(strip_tags($content)) < 200) {
                $content = $crawler->filter('main, article')->each(function ($node) {
                    $html = $node->html();
                    // Clean up
                    $html = preg_replace('/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/mi', '', $html);
                    $html = preg_replace('/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/mi', '', $html);
                    return $html;
                });
                $content = implode("\n", $content);
            }

            // Strategy 4: Last resort - get all paragraphs and headings from entire page
            if (empty($content) || strlen(strip_tags($content)) < 200) {
                $content = $crawler->filter('body p, body h1, body h2, body h3, body h4, body ul, body ol')->each(function ($node) {
                    // Skip if in nav, header, footer
                    $parent = $node->parents()->first();
                    $parentClass = $parent->attr('class') ?? '';
                    $parentId = $parent->attr('id') ?? '';
                    
                    if (stripos($parentClass, 'nav') !== false || 
                        stripos($parentClass, 'header') !== false || 
                        stripos($parentClass, 'footer') !== false ||
                        stripos($parentId, 'nav') !== false ||
                        stripos($parentId, 'header') !== false ||
                        stripos($parentId, 'footer') !== false) {
                        return null;
                    }
                    
                    return $node->outerHtml();
                });
                $content = array_filter($content);
                $content = implode("\n", $content);
            }
            
            // Final cleanup: remove any remaining unwanted elements
            if (!empty($content)) {
                $content = preg_replace('/<[^>]*(class|id)=["\'][^"\']*(nav|header|footer|sidebar|menu|widget|ad|advertisement)[^"\']*["\'][^>]*>.*?<\/[^>]+>/is', '', $content);
                $content = preg_replace('/<div[^>]*>\s*<\/div>/i', '', $content); // Remove empty divs
                $content = preg_replace('/\s+/', ' ', $content); // Normalize whitespace
                $content = trim($content);
            }

            // Extract published date - try multiple strategies
            $publishedDate = null;
            
            // Strategy 1: Look for time element with datetime attribute
            $timeNodes = $crawler->filter('time[datetime]');
            if ($timeNodes->count() > 0) {
                foreach ($timeNodes as $timeNode) {
                    $timeCrawler = new Crawler($timeNode);
                    $datetime = $timeCrawler->attr('datetime');
                    if ($datetime) {
                        try {
                            $parsed = strtotime($datetime);
                            if ($parsed) {
                                $publishedDate = date('Y-m-d', $parsed);
                                break;
                            }
                        } catch (\Exception $e) {
                            // Continue to next
                        }
                    }
                }
            }
            
            // Strategy 2: Look for date in meta tags
            if (!$publishedDate) {
                $metaDate = $crawler->filter('meta[property="article:published_time"], meta[name="publish-date"], meta[name="date"]')->first();
                if ($metaDate->count() > 0) {
                    $dateValue = $metaDate->attr('content');
                    if ($dateValue) {
                        try {
                            $parsed = strtotime($dateValue);
                            if ($parsed) {
                                $publishedDate = date('Y-m-d', $parsed);
                            }
                        } catch (\Exception $e) {
                            // Continue
                        }
                    }
                }
            }
            
            // Strategy 3: Look for date classes/IDs
            if (!$publishedDate) {
                $dateSelectors = [
                    '.published-date',
                    '.post-date',
                    '.entry-date',
                    '.article-date',
                    '[class*="date"]',
                    '[class*="published"]',
                    '[class*="publish"]',
                ];
                
                foreach ($dateSelectors as $selector) {
                    $dateNode = $crawler->filter($selector)->first();
                    if ($dateNode->count() > 0) {
                        // Try datetime attribute first
                        $dateAttr = $dateNode->attr('datetime');
                        if ($dateAttr) {
                            try {
                                $parsed = strtotime($dateAttr);
                                if ($parsed) {
                                    $publishedDate = date('Y-m-d', $parsed);
                                    break;
                                }
                            } catch (\Exception $e) {
                                // Continue
                            }
                        }
                        
                        // Try parsing text content
                        $dateText = trim($dateNode->text());
                        if (!empty($dateText)) {
                            // Try common date formats
                            $formats = [
                                'Y-m-d',
                                'Y/m/d',
                                'd-m-Y',
                                'd/m/Y',
                                'F j, Y',
                                'M j, Y',
                                'j F Y',
                            ];
                            
                            foreach ($formats as $format) {
                                try {
                                    $parsed = date_parse_from_format($format, $dateText);
                                    if ($parsed && !empty($parsed['year'])) {
                                        $publishedDate = sprintf('%04d-%02d-%02d', 
                                            $parsed['year'], 
                                            $parsed['month'] ?? 1, 
                                            $parsed['day'] ?? 1
                                        );
                                        break 2;
                                    }
                                } catch (\Exception $e) {
                                    // Continue
                                }
                            }
                            
                            // Try strtotime as fallback
                            $parsed = strtotime($dateText);
                            if ($parsed && $parsed > 0) {
                                $publishedDate = date('Y-m-d', $parsed);
                                break;
                            }
                        }
                    }
                }
            }
            
            // Strategy 4: Look in URL if it contains date (e.g., /2024/01/15/)
            if (!$publishedDate && preg_match('#/(\d{4})/(\d{2})/(\d{2})/#', $url, $matches)) {
                try {
                    $publishedDate = sprintf('%s-%s-%s', $matches[1], $matches[2], $matches[3]);
                } catch (\Exception $e) {
                    // Continue
                }
            }
            
            // Fallback: Use current date if nothing found (but log a warning)
            if (!$publishedDate) {
                $this->warn("Could not extract date from {$url}, using current date");
                $publishedDate = now()->toDateString();
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


