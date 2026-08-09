<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('work_tasks', function (Blueprint $table): void {
            $table->foreignId('lead_id')->nullable()->after('customer_id')->constrained('leads')->nullOnDelete();
            $table->foreignId('product_id')->nullable()->after('lead_id')->constrained('products')->nullOnDelete();
            $table->string('automation_key', 160)->nullable()->after('completed_at');
            $table->unique('automation_key');
            $table->index(['lead_id', 'product_id']);
        });
    }

    public function down(): void
    {
        Schema::table('work_tasks', function (Blueprint $table): void {
            $table->dropUnique(['automation_key']);
            $table->dropIndex(['lead_id', 'product_id']);
            $table->dropConstrainedForeignId('product_id');
            $table->dropConstrainedForeignId('lead_id');
            $table->dropColumn('automation_key');
        });
    }
};
