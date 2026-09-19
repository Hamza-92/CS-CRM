<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('application_instances', function (Blueprint $table): void {
            $table->uuid('counterpos_tenant_id')->nullable()->unique()->after('id');
            $table->string('counterpos_status', 32)->nullable()->after('status');
            $table->unsignedInteger('counterpos_schema_version')->nullable()->after('version');
            $table->string('provisioning_template_code', 64)->nullable()->after('counterpos_schema_version');
            $table->unsignedInteger('provisioning_template_version')->nullable()->after('provisioning_template_code');
            $table->timestamp('last_synced_at')->nullable()->after('last_checked_at');
        });
    }

    public function down(): void
    {
        Schema::table('application_instances', function (Blueprint $table): void {
            $table->dropUnique(['counterpos_tenant_id']);
            $table->dropColumn([
                'counterpos_tenant_id',
                'counterpos_status',
                'counterpos_schema_version',
                'provisioning_template_code',
                'provisioning_template_version',
                'last_synced_at',
            ]);
        });
    }
};