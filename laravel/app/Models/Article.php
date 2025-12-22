<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Article extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'content',
        'original_url',
        'published_date',
        'is_enhanced',
        'original_article_id',
        'reference_urls',
    ];

    protected $casts = [
        'published_date' => 'date',
        'is_enhanced' => 'boolean',
        'reference_urls' => 'array',
    ];

    public function originalArticle(): BelongsTo
    {
        return $this->belongsTo(Article::class, 'original_article_id');
    }
}


