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
        Schema::create('ai_models', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('provider')->default('anthropic');
            $table->string('model_id');
            $table->string('purpose')->default('analysis'); // 'analysis', 'parsing'
            $table->decimal('temperature', 3, 2)->default(0.20);
            $table->unsignedInteger('max_tokens')->default(4000);
            $table->boolean('is_active')->default(true);
            $table->boolean('is_default')->default(false);
            $table->unsignedInteger('fallback_priority')->nullable();
            $table->decimal('input_cost_per_mtok', 8, 4)->default(3.0000);
            $table->decimal('output_cost_per_mtok', 8, 4)->default(15.0000);
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['provider', 'is_active']);
            $table->index(['purpose', 'is_default']);
            $table->index(['purpose', 'fallback_priority']);
        });

        Schema::create('analysis_attempts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('analysis_id')->constrained()->cascadeOnDelete();
            $table->foreignId('ai_model_id')->nullable()->constrained('ai_models')->nullOnDelete();
            $table->unsignedInteger('attempt_no')->default(1);
            $table->string('status'); // 'success', 'failed'
            $table->string('failure_type')->nullable(); // RETRYABLE, MODEL_UNAVAILABLE, AUTH_OR_BILLING, BAD_REQUEST, INVALID_OUTPUT
            $table->unsignedSmallInteger('http_status')->nullable();
            $table->text('error_message')->nullable();
            $table->unsignedInteger('latency_ms')->default(0);
            $table->unsignedInteger('tokens_in')->nullable();
            $table->unsignedInteger('tokens_out')->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->index(['analysis_id', 'created_at']);
            $table->index(['ai_model_id', 'status']);
        });

        Schema::table('analyses', function (Blueprint $table) {
            $table->boolean('is_delayed')->default(false)->after('error_message');
            $table->boolean('is_basic_fallback')->default(false)->after('is_delayed');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('analyses', function (Blueprint $table) {
            $table->dropColumn(['is_delayed', 'is_basic_fallback']);
        });

        Schema::dropIfExists('analysis_attempts');
        Schema::dropIfExists('ai_models');
    }
};
