<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('municipalidades', function (Blueprint $table) {
            $table->string('nivel', 30)->nullable()->after('region');
        });
    }

    public function down()
    {
        Schema::table('municipalidades', function (Blueprint $table) {
            $table->dropColumn('nivel');
        });
    }
};
