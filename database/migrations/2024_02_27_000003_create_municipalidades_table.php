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
            $table->string('departamento', 50);
            $table->string('provincia', 50);
            $table->string('distrito', 50);
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
