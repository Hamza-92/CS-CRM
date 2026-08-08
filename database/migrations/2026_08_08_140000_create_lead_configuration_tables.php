<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('lead_statuses', function (Blueprint $table): void {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->string('color', 7)->default('#3B82F6');
            $table->string('status', 16)->default('active')->index();
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();
        });

        Schema::create('lead_sources', function (Blueprint $table): void {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->string('status', 16)->default('active')->index();
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();
        });

        $statuses = [
            ['New', 'new', 'Freshly captured lead', '#3B82F6'],
            ['Contacted', 'contacted', 'Initial contact has been made', '#6366F1'],
            ['Interested', 'interested', 'The lead has shown genuine interest', '#8B5CF6'],
            ['Demo Required', 'demo_required', 'A product demo needs to be arranged', '#F59E0B'],
            ['Demo Setup', 'demo_setup', 'The demo environment is being prepared', '#F97316'],
            ['Trial Running', 'trial_running', 'The lead is evaluating a running trial', '#06B6D4'],
            ['Converted', 'converted', 'Converted into a customer', '#10B981'],
            ['No Response', 'no_response', 'No response after contact attempts', '#94A3B8'],
            ['Call Later', 'call_later', 'Follow-up is scheduled for later', '#EAB308'],
            ['Not Interested', 'not_interested', 'The lead is not interested at this time', '#EF4444'],
            ['Using Other Software', 'other_software', 'The lead is using another solution', '#64748B'],
            ['Lost', 'lost', 'Opportunity has been closed as lost', '#B91C1C'],
        ];

        foreach ($statuses as $index => [$name, $slug, $description, $color]) {
            DB::table('lead_statuses')->insert([
                'name' => $name,
                'slug' => $slug,
                'description' => $description,
                'color' => $color,
                'status' => 'active',
                'sort_order' => $index,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        $sources = [
            ['Website', 'website', 'Inbound website enquiry'],
            ['Referral', 'referral', 'Referred by an existing contact'],
            ['Social', 'social', 'Social media or community channel'],
            ['Cold Call', 'cold_call', 'Outbound call or prospecting'],
            ['WhatsApp', 'whatsapp', 'WhatsApp conversation'],
            ['Exhibition', 'exhibition', 'Trade show or event'],
            ['Other', 'other', 'Any other source'],
        ];

        foreach ($sources as $index => [$name, $slug, $description]) {
            DB::table('lead_sources')->insert([
                'name' => $name,
                'slug' => $slug,
                'description' => $description,
                'status' => 'active',
                'sort_order' => $index,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('lead_sources');
        Schema::dropIfExists('lead_statuses');
    }
};
