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
            if (!Schema::hasColumn('estados_seguimiento', 'fecha_compromiso')) {
                $table->date('fecha_compromiso')->nullable()->after('compromiso');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('estados_seguimiento', function (Blueprint $table) {
            // No eliminamos la columna en down ya que podría existir desde la migración original
            // y no queremos eliminarla si no la creamos en este archivo
        });
    }
};
