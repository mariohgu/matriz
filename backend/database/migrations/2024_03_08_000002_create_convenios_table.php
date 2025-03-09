<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('convenios', function (Blueprint $table) {
            $table->id('id_convenio');
            $table->foreignId('id_municipalidad')->constrained('municipalidades', 'id_municipalidad')->onDelete('cascade');
            $table->string('tipo_convenio', 100);
            $table->decimal('monto', 20, 2);
            $table->date('fecha_firma');
            $table->string('estado', 50)->default('Pendiente');
            $table->text('descripcion')->nullable();
            $table->foreignId('creado_por')->constrained('users', 'id');
            $table->foreignId('actualizado_por')->constrained('users', 'id');
            $table->timestamps();
            $table->softDeletes();
            
            $table->index('id_municipalidad');
        });
    }

    public function down()
    {
        Schema::dropIfExists('convenios');
    }
};
