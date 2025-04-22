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
        Schema::connection($this->connection)->create('clasificadores', function (Blueprint $table) {
            $table->id('id_clasificador');
            $table->unsignedBigInteger('id_categoria');
            $table->string('codigo_clasificador', 20)->nullable(false);
            $table->string('descripcion', 200)->nullable(false);
            $table->timestamps();
            $table->softDeletes();
            
            $table->foreign('id_categoria')
                  ->references('id_categoria')
                  ->on('categorias')
                  ->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::connection($this->connection)->dropIfExists('clasificadores');
    }
}; 