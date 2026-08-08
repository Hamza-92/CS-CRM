<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('follow_ups', function (Blueprint $table): void {
            $table->foreignId('application_instance_id')->nullable()->after('deal_id')->constrained('application_instances')->nullOnDelete();
            $table->index('application_instance_id');
        });
    }

    public function down(): void
    {
        Schema::table('follow_ups', function (Blueprint $table): void {
            $table->dropConstrainedForeignId('application_instance_id');
        });
    }
};
