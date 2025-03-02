<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('eventos', function (Blueprint $table) {
            $table->id('id_evento');
            $table->foreignId('id_municipalidad')->constrained('municipalidades', 'id_municipalidad')->onDelete('cascade');
            $table->text('tipo_acercamiento');
            $table->text('lugar');
            $table->date('fecha');
            $table->foreignId('creado_por')->constrained('users', 'id');
            $table->foreignId('actualizado_por')->constrained('users', 'id');
            $table->timestamps();
            $table->softDeletes();
            
            $table->index('id_municipalidad');
        });
    }

    public function down()
    {
        Schema::dropIfExists('eventos');
    }
};
