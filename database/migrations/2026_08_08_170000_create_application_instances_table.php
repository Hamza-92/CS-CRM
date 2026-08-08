<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('application_instances', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('customer_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_id')->constrained()->restrictOnDelete();
            $table->foreignId('owner_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('name', 120);
            $table->string('environment', 24)->default('production');
            $table->string('status', 24)->default('planned');
            $table->string('deployment_url')->nullable();
            $table->string('server_name')->nullable();
            $table->string('version', 64)->nullable();
            $table->date('deployed_at')->nullable();
            $table->timestamp('last_checked_at')->nullable();
            $table->text('notes')->nullable();
            $table->softDeletes();
            $table->timestamps();

            $table->index(['customer_id', 'status']);
            $table->index(['product_id', 'environment']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('application_instances');
    }
};
