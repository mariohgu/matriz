<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\HelloController;
use App\Http\Controllers\Api\MunicipalidadController;

// Ruta del controlador Hello
Route::get('/hello', [HelloController::class, 'index']);

// Rutas para el CRUD de Municipalidades
Route::apiResource('municipalidades', MunicipalidadController::class);
