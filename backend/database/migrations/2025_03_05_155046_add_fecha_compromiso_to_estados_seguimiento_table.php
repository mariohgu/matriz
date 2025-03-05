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
        Schema::table('estados_seguimiento', function (Blueprint $table) {
            $table->date('fecha_compromiso')->nullable()->after('compromiso');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('estados_seguimiento', function (Blueprint $table) {
            $table->dropColumn('fecha_compromiso');
        });
    }
};
