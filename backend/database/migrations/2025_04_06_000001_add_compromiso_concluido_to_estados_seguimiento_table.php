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
            $table->boolean('compromiso_concluido')->nullable()->after('fecha_compromiso');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('estados_seguimiento', function (Blueprint $table) {
            $table->dropColumn('compromiso_concluido');
        });
    }
};
