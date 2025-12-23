<?php

namespace App\Console\Commands;

use App\Models\Article;
use Illuminate\Console\Command;

class DeleteAllArticles extends Command
{
    protected $signature = 'articles:delete-all {--force : Skip confirmation prompt}';
    protected $description = 'Delete all articles from the database';

    public function handle(): int
    {
        if (!$this->option('force')) {
            if (!$this->confirm('Are you sure you want to delete ALL articles? This cannot be undone!')) {
                $this->info('Operation cancelled.');
                return Command::SUCCESS;
            }
        }

        $count = Article::count();
        
        if ($count === 0) {
            $this->info('No articles found in the database.');
            return Command::SUCCESS;
        }

        $this->info("Found {$count} articles. Deleting...");

        // Delete all articles (CASCADE will handle foreign keys)
        Article::query()->delete();

        $this->info("Successfully deleted all articles from the database.");
        
        return Command::SUCCESS;
    }
}

