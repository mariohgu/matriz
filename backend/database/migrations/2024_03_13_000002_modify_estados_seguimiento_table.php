<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('estados_seguimiento', function (Blueprint $table) {
            // Primero elimino la columna existente 'estado'
            $table->dropColumn('estado');
            
            // Añado la nueva relación a la tabla estados
            $table->foreignId('id_estado_ref')->after('fecha')->constrained('estados', 'id_estado');
        });
    }

    public function down()
    {
        Schema::table('estados_seguimiento', function (Blueprint $table) {
            // Eliminar la columna de la relación
            $table->dropForeign(['id_estado_ref']);
            $table->dropColumn('id_estado_ref');
            
            // Restaurar la columna original
            $table->text('estado')->after('fecha');
        });
    }
};
