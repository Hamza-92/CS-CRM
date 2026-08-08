<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('subscriptions', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('application_instance_id')->constrained('application_instances')->cascadeOnDelete();
            $table->foreignId('plan_id')->constrained()->restrictOnDelete();
            $table->string('kind', 20)->default('subscription');
            $table->string('status', 24)->default('active');
            $table->date('starts_at');
            $table->date('ends_at')->nullable();
            $table->date('renewal_at')->nullable();
            $table->date('grace_ends_at')->nullable();
            $table->date('cancelled_at')->nullable();
            $table->boolean('auto_renew')->default(true);
            $table->string('external_reference', 120)->nullable();
            $table->text('notes')->nullable();
            $table->softDeletes();
            $table->timestamps();

            $table->index(['application_instance_id', 'status']);
            $table->index(['renewal_at', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('subscriptions');
    }
};
