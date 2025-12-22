<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('articles', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('content');
            $table->string('original_url')->unique();
            $table->date('published_date');
            $table->boolean('is_enhanced')->default(false);
            $table->unsignedBigInteger('original_article_id')->nullable();
            $table->json('reference_urls')->nullable();
            $table->timestamps();

            $table->foreign('original_article_id')->references('id')->on('articles')->onDelete('cascade');
            $table->index('published_date');
            $table->index('is_enhanced');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('articles');
    }
};


