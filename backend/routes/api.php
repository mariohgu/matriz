<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\HelloController;
use App\Http\Controllers\Api\MunicipalidadController;
use App\Http\Controllers\Api\ContactoController;

// Ruta del controlador Hello
Route::get('/hello', [HelloController::class, 'index']);

// Rutas para el CRUD de Municipalidades
Route::apiResource('municipalidades', MunicipalidadController::class);

// Rutas para el CRUD de Contactos
Route::apiResource('contactos', ContactoController::class);

// Ruta adicional para obtener contactos por municipalidad
Route::get('municipalidades/{id}/contactos', [ContactoController::class, 'porMunicipalidad']);
