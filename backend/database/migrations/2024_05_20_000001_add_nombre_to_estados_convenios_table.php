<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up()
    {
        // Solo si la columna no existe, agregarla
        if (!Schema::hasColumn('estados_convenios', 'nombre')) {
            Schema::table('estados_convenios', function (Blueprint $table) {
                $table->string('nombre', 100)->nullable()->after('descripcion');
            });

            // Actualizar registros existentes para copiar descripción a nombre
            DB::statement('UPDATE estados_convenios SET nombre = descripcion WHERE nombre IS NULL');
        }
    }

    public function down()
    {
        if (Schema::hasColumn('estados_convenios', 'nombre')) {
            Schema::table('estados_convenios', function (Blueprint $table) {
                $table->dropColumn('nombre');
            });
        }
    }
}; 