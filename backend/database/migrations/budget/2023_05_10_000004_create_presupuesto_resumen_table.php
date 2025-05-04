<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * The database connection that should be used by the migration.
     *
     * @var string
     */
    protected $connection = 'mysql_budget';

    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::connection($this->connection)->create('presupuesto_resumen', function (Blueprint $table) {
            $table->id('id_pr');
            $table->unsignedBigInteger('id_ae');
            $table->unsignedBigInteger('id_clasificador');
            $table->timestamp('fecha')->default(DB::raw('CURRENT_TIMESTAMP'));
            $table->integer('anio');
            $table->float('mto_pia');
            $table->float('mto_modificaciones');
            $table->float('mto_pim');
            $table->float('mto_certificado');
            $table->float('mto_compro_anual');
            $table->timestamps();
            $table->softDeletes();
            
            $table->foreign('id_ae')
                  ->references('id_ae')
                  ->on('areas_ejecutoras')
                  ->onDelete('cascade');
                  
            $table->foreign('id_clasificador')
                  ->references('id_clasificador')
                  ->on('clasificadores')
                  ->onDelete('cascade');
                  
            $table->unique(['id_ae', 'id_clasificador', 'anio'], 'presupuesto_unico');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::connection($this->connection)->dropIfExists('presupuesto_resumen');
    }
}; 