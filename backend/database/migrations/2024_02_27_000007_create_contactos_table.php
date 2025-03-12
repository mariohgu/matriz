<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('contactos', function (Blueprint $table) {
            $table->id('id_contacto');
            $table->foreignId('id_municipalidad')->constrained('municipalidades', 'id_municipalidad')->onDelete('cascade');
            $table->text('nombre_completo');
            $table->text('cargo');
            $table->string('telefono', 100)->nullable();
            $table->string('email', 100)->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down()
    {
        Schema::dropIfExists('contactos');
    }
};
