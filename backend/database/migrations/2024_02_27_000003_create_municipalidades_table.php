<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('municipalidades', function (Blueprint $table) {
            $table->id('id_municipalidad');
            $table->string('ubigeo', 10)->unique();
            $table->text('nombre');
            $table->string('departamento', 80);
            $table->string('provincia', 80);
            $table->string('distrito', 80);
            $table->string('region_natural', 50);
            $table->decimal('X', 10, 6)->nullable(); // Coordenada X (longitud)
            $table->decimal('Y', 10, 6)->nullable(); // Coordenada Y (latitud)
            $table->string('RUC', 11)->nullable(); // Registro Único de Contribuyentes
            $table->timestamps();
            $table->softDeletes();
            
            $table->index('ubigeo');
        });
    }

    public function down()
    {
        Schema::dropIfExists('municipalidades');
    }
};
