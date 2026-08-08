<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('plans', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('code', 32);
            $table->string('billing_cycle', 24)->index();
            $table->unsignedSmallInteger('duration_days')->nullable();
            $table->decimal('price', 12, 2)->default(0);
            $table->char('currency', 3);
            $table->unsignedSmallInteger('grace_days')->default(0);
            $table->boolean('is_active')->default(true)->index();
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['product_id', 'code']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('plans');
    }
};
