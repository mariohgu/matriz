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
            $table->foreignId('id_estado_convenio')->constrained('estados_convenios', 'id_estado_convenio');
            $table->text('descripcion')->nullable();
            $table->string('codigo_convenio', 20)->nullable();
            $table->integer('codigo_idea_cui')->nullable();
            $table->string('descripcion_idea_cui', 250)->nullable();
            $table->integer('beneficiarios')->nullable();
            $table->string('codigo_interno', 20);
            $table->foreignId('id_sector')->constrained('sector', 'id_sector');
            $table->foreignId('id_direccion_linea')->constrained('direccion_linea', 'id_direccion_linea');
            $table->foreignId('creado_por')->constrained('users', 'id');
            $table->foreignId('actualizado_por')->constrained('users', 'id');
            $table->timestamps();
            $table->softDeletes();
            
            $table->index('id_municipalidad');
            $table->index('id_estado_convenio');
            $table->index('id_sector');
            $table->index('id_direccion_linea');
        });
    }

    public function down()
    {
        Schema::dropIfExists('convenios');
    }
};
