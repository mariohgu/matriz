<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('estados_seguimiento', function (Blueprint $table) {
            $table->id('id_estado');
            $table->foreignId('id_evento')->constrained('eventos', 'id_evento')->onDelete('cascade');
            $table->foreignId('id_tipo_reunion')->constrained('tipos_reunion', 'id_tipo_reunion');
            $table->date('fecha');
            $table->text('estado');
            $table->text('compromiso')->nullable();
            $table->foreignId('creado_por')->constrained('users', 'id');
            $table->foreignId('actualizado_por')->constrained('users', 'id');
            $table->timestamps();
            $table->softDeletes();
            
            $table->index('id_evento');
        });
    }

    public function down()
    {
        Schema::dropIfExists('estados_seguimiento');
    }
};
