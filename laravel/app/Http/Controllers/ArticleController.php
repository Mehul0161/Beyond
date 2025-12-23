<?php

namespace App\Http\Controllers;

use App\Models\Article;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\Artisan;

class ArticleController extends Controller
{
    public function index(): JsonResponse
    {
        $articles = Article::orderBy('published_date', 'desc')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($articles);
    }

    public function show(int $id): JsonResponse
    {
        $article = Article::find($id);

        if (!$article) {
            return response()->json(['error' => 'Article not found'], 404);
        }

        return response()->json($article);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'content' => 'required|string',
            'original_url' => 'nullable|string|url|unique:articles,original_url',
            'published_date' => 'nullable|date',
            'is_enhanced' => 'nullable|boolean',
            'original_article_id' => 'nullable|exists:articles,id',
            'reference_urls' => 'nullable|array',
            'reference_urls.*' => 'url',
        ]);

        // Use raw SQL to avoid boolean casting issues
        // Ensure is_enhanced is properly set to 'true' or 'false' string for PostgreSQL
        $isEnhanced = isset($validated['is_enhanced']) && $validated['is_enhanced'] ? 'true' : 'false';
        $referencedUrls = json_encode($validated['reference_urls'] ?? []);
        
        \DB::statement(
            "INSERT INTO articles (title, content, original_url, published_date, is_enhanced, original_article_id, reference_urls, created_at, updated_at) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
            [
                $validated['title'],
                $validated['content'],
                $validated['original_url'],
                $validated['published_date'],
                $isEnhanced, // 'true' or 'false' string for PostgreSQL
                $validated['original_article_id'],
                $referencedUrls,
                now(),
                now(),
            ]
        );

        // Fetch and return the created article
        $article = Article::where('title', $validated['title'])->latest('id')->first();
        return response()->json($article, 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $article = Article::find($id);

        if (!$article) {
            return response()->json(['error' => 'Article not found'], 404);
        }

        $validated = $request->validate([
            'title' => 'sometimes|required|string|max:255',
            'content' => 'sometimes|required|string',
            'original_url' => [
                'sometimes',
                'string',
                'url',
                Rule::unique('articles', 'original_url')->ignore($id),
            ],
            'published_date' => 'sometimes|date',
            'is_enhanced' => 'sometimes|boolean',
            'original_article_id' => 'sometimes|nullable|exists:articles,id',
            'reference_urls' => 'sometimes|nullable|array',
            'reference_urls.*' => 'url',
        ]);

        // Ensure is_enhanced is a proper boolean if provided
        if (isset($validated['is_enhanced'])) {
            $validated['is_enhanced'] = filter_var($validated['is_enhanced'], FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
            if ($validated['is_enhanced'] === null) {
                $validated['is_enhanced'] = false;
            }
        }

        $article->update($validated);

        return response()->json($article);
    }

    public function destroy(int $id): JsonResponse
    {
        $article = Article::find($id);

        if (!$article) {
            return response()->json(['error' => 'Article not found'], 404);
        }

        $article->delete();

        return response()->json(['message' => 'Article deleted successfully']);
    }

}


