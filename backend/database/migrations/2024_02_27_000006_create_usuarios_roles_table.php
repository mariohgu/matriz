<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('usuarios_roles', function (Blueprint $table) {
            $table->foreignId('id_usuario')->constrained('users', 'id')->onDelete('cascade');
            $table->foreignId('id_rol')->constrained('roles', 'id_rol')->onDelete('cascade');
            $table->primary(['id_usuario', 'id_rol']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('usuarios_roles');
    }
};
