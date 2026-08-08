<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('leads', function (Blueprint $table): void {
            $table->id();
            $table->string('name');
            $table->string('business')->nullable()->index();
            $table->string('phone', 32)->nullable()->index();
            $table->string('whatsapp', 32)->nullable();
            $table->string('email')->nullable()->index();
            $table->string('city')->nullable();
            $table->string('source')->nullable()->index();
            $table->string('status', 32)->default('new')->index();
            $table->foreignId('owner_id')->nullable()->constrained('users')->nullOnDelete();
            $table->json('interested_products')->nullable();
            $table->timestamp('next_follow_up_at')->nullable()->index();
            $table->text('notes')->nullable();
            $table->unsignedBigInteger('customer_id')->nullable()->index();
            $table->timestamp('converted_at')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('leads');
    }
};
