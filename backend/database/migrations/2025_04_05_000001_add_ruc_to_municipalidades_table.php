<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('municipalidades', function (Blueprint $table) {
            $table->string('RUC', 11)->nullable()->after('Y')->comment('Registro Único de Contribuyentes');
        });
    }

    public function down()
    {
        Schema::table('municipalidades', function (Blueprint $table) {
            $table->dropColumn('RUC');
        });
    }
};
