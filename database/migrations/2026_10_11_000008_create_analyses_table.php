<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('analyses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('resume_original_name');
            $table->string('resume_path')->nullable();
            $table->longText('resume_text')->nullable();
            $table->string('job_title')->nullable();
            $table->string('job_company')->nullable();
            $table->longText('jd_text')->nullable();
            $table->string('status')->default('queued'); // 'queued', 'processing', 'completed', 'failed'
            $table->unsignedTinyInteger('score')->nullable();
            $table->json('result')->nullable();
            $table->string('ai_model_id')->nullable();
            $table->unsignedInteger('tokens_in')->nullable();
            $table->unsignedInteger('tokens_out')->nullable();
            $table->text('error_message')->nullable();
            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['user_id', 'created_at']);
            $table->index(['user_id', 'status']);
            $table->index('status');
            $table->index('created_at');
            $table->index('score');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('analyses');
    }
};
