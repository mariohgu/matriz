<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\HelloController;
use App\Http\Controllers\Api\MunicipalidadController;
use App\Http\Controllers\Api\ContactoController;
use App\Http\Controllers\Api\TipoEventoController;
use App\Http\Controllers\Api\TipoReunionController;
use App\Http\Controllers\Api\EventoController;
use App\Http\Controllers\Api\EstadoSeguimientoController;

// Ruta del controlador Hello
Route::get('/hello', [HelloController::class, 'index']);

// Rutas para el CRUD de Municipalidades
Route::apiResource('municipalidades', MunicipalidadController::class);

// Rutas para el CRUD de Contactos
Route::apiResource('contactos', ContactoController::class);

// Ruta adicional para obtener contactos por municipalidad
Route::get('municipalidades/{id}/contactos', [ContactoController::class, 'porMunicipalidad']);


// Rutas para el CRUD de Tipos de Reunión
Route::apiResource('tipos-reunion', TipoReunionController::class);

// Rutas para el CRUD de Eventos
Route::apiResource('eventos', EventoController::class);
Route::get('municipalidades/{id}/eventos', [EventoController::class, 'porMunicipalidad']);
Route::post('eventos/por-fecha', [EventoController::class, 'porFecha']);

// Rutas para el CRUD de Estados de Seguimiento
Route::apiResource('estados-seguimiento', EstadoSeguimientoController::class);
Route::get('eventos/{id}/estados-seguimiento', [EstadoSeguimientoController::class, 'porEvento']);
Route::post('estados-seguimiento/por-fecha', [EstadoSeguimientoController::class, 'porFecha']);
