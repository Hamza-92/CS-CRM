<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('code', 32)->unique();
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true)->index();
            $table->foreignId('technical_owner_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('support_role_id')->nullable()->constrained('roles')->nullOnDelete();
            $table->unsignedSmallInteger('default_trial_days')->nullable();
            $table->text('demo_notes')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
