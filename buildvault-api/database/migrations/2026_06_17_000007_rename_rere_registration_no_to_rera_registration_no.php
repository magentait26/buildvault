<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (Schema::hasTable('projects')) {
            if (Schema::hasColumn('projects', 'rere_registration_no') && !Schema::hasColumn('projects', 'rera_registration_no')) {
                Schema::table('projects', function (Blueprint $table) {
                    $table->renameColumn('rere_registration_no', 'rera_registration_no');
                });
            } elseif (!Schema::hasColumn('projects', 'rera_registration_no')) {
                Schema::table('projects', function (Blueprint $table) {
                    $table->float('rera_registration_no')->nullable();
                });
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('projects')) {
            if (Schema::hasColumn('projects', 'rera_registration_no')) {
                Schema::table('projects', function (Blueprint $table) {
                    $table->renameColumn('rera_registration_no', 'rere_registration_no');
                });
            }
        }
    }
};
