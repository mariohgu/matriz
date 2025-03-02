<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('bitacora', function (Blueprint $table) {
            $table->id('id_bitacora');
            $table->foreignId('id_usuario')->constrained('users', 'id');
            $table->string('accion', 50);
            $table->string('tabla_afectada', 50);
            $table->unsignedBigInteger('id_registro_afectado');
            $table->text('detalle')->nullable();
            $table->timestamp('fecha')->useCurrent();
        });
    }

    public function down()
    {
        Schema::dropIfExists('bitacora');
    }
};
