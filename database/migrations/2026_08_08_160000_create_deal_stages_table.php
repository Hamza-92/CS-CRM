<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('deal_stages', function (Blueprint $table): void {
            $table->id();
            $table->string('name', 80);
            $table->string('slug', 96)->unique();
            $table->string('color', 7)->default('#3B82F6');
            $table->unsignedTinyInteger('probability')->default(0);
            $table->string('status', 16)->default('active')->index();
            $table->boolean('is_won')->default(false);
            $table->boolean('is_lost')->default(false);
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();
        });

        DB::table('deal_stages')->insert([
            ['name' => 'Qualification', 'slug' => 'qualification', 'color' => '#3B82F6', 'probability' => 20, 'status' => 'active', 'is_won' => false, 'is_lost' => false, 'sort_order' => 10, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Discovery', 'slug' => 'discovery', 'color' => '#6366F1', 'probability' => 35, 'status' => 'active', 'is_won' => false, 'is_lost' => false, 'sort_order' => 20, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Proposal', 'slug' => 'proposal', 'color' => '#8B5CF6', 'probability' => 55, 'status' => 'active', 'is_won' => false, 'is_lost' => false, 'sort_order' => 30, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Negotiation', 'slug' => 'negotiation', 'color' => '#F59E0B', 'probability' => 75, 'status' => 'active', 'is_won' => false, 'is_lost' => false, 'sort_order' => 40, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Won', 'slug' => 'won', 'color' => '#10B981', 'probability' => 100, 'status' => 'active', 'is_won' => true, 'is_lost' => false, 'sort_order' => 50, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Lost', 'slug' => 'lost', 'color' => '#EF4444', 'probability' => 0, 'status' => 'active', 'is_won' => false, 'is_lost' => true, 'sort_order' => 60, 'created_at' => now(), 'updated_at' => now()],
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('deal_stages');
    }
};
