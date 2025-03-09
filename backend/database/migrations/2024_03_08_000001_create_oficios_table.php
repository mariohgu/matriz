<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('oficios', function (Blueprint $table) {
            $table->id('id_oficio');
            $table->foreignId('id_municipalidad')->constrained('municipalidades', 'id_municipalidad')->onDelete('cascade');
            $table->string('numero_oficio');
            $table->date('fecha_envio');
            $table->string('asunto', 255);
            $table->text('contenido');
            $table->string('estado', 50);
            $table->foreignId('creado_por')->constrained('users', 'id');
            $table->foreignId('actualizado_por')->constrained('users', 'id');
            $table->timestamps();
            $table->softDeletes();
            
            $table->index('id_municipalidad');
            $table->unique(['numero_oficio', 'id_municipalidad']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('oficios');
    }
};
