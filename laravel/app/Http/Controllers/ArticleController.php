<?php

namespace App\Http\Controllers;

use App\Models\Article;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

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
            'is_enhanced' => 'boolean',
            'original_article_id' => 'nullable|exists:articles,id',
            'reference_urls' => 'nullable|array',
            'reference_urls.*' => 'url',
        ]);

        $article = Article::create($validated);

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


