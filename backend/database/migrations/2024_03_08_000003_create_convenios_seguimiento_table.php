<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('convenios_seguimiento', function (Blueprint $table) {
            $table->id('id_convenio_seguimiento');
            $table->foreignId('id_convenio')->constrained('convenios', 'id_convenio')->onDelete('cascade');
            $table->date('fecha');
            $table->foreignId('id_estado_convenio')->constrained('estados_convenios', 'id_estado_convenio');
            $table->text('comentarios')->nullable();
            $table->text('acciones_realizadas')->nullable();
            $table->text('alertas_identificadas')->nullable();
            $table->text('acciones_desarrollar')->nullable();
            $table->date('fecha_seguimiento')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index('id_convenio');
            $table->index('id_estado_convenio');
        });
    }

    public function down()
    {
        Schema::dropIfExists('convenios_seguimiento');
    }
}; 