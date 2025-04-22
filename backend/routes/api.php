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
use App\Http\Controllers\Api\OficioController;
use App\Http\Controllers\Api\ConvenioController;
use App\Http\Controllers\Api\EstadoController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\Budget\AreaEjecutoraController;
use App\Http\Controllers\Budget\CategoriaController;
use App\Http\Controllers\Budget\ClasificadorController;
use App\Http\Controllers\Budget\PresupuestoResumenController;
use App\Http\Controllers\Budget\EjecucionMensualController;

// Rutas de autenticación (públicas)
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// Rutas protegidas que requieren autenticación
Route::middleware('auth:sanctum')->group(function () {
    // Información del usuario y cerrar sesión
    Route::get('/user', [AuthController::class, 'user']);
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::post('/refresh-token', [AuthController::class, 'refreshToken']);
    
    // Rutas para la gestión del perfil del usuario
    Route::get('/profile', [UserController::class, 'getProfile']);
    Route::put('/profile', [UserController::class, 'updateProfile']);
    Route::post('/change-password', [UserController::class, 'changePassword']);
    
    // Ruta del controlador Hello
    Route::get('/hello', [HelloController::class, 'index']);
    
    // Rutas para el CRUD de Municipalidades
    Route::get('municipalidades', [MunicipalidadController::class, 'index']);
    Route::get('municipalidades/{id}', [MunicipalidadController::class, 'show']);
    Route::post('municipalidades', [MunicipalidadController::class, 'store']);
    Route::put('municipalidades/{id}', [MunicipalidadController::class, 'update']);
    Route::delete('municipalidades/{id}', [MunicipalidadController::class, 'destroy']);
    
    // Rutas para el CRUD de Contactos
    Route::apiResource('contactos', ContactoController::class);
    
    // Ruta adicional para obtener contactos por municipalidad
    Route::get('municipalidades/{id}/contactos', [ContactoController::class, 'porMunicipalidad']);
    
    // Rutas para el CRUD de Tipos de Reunión
    Route::apiResource('tipos-reunion', TipoReunionController::class);
    
    // Rutas para el CRUD de Estados
    Route::apiResource('estados', EstadoController::class);
    
    // Rutas para el CRUD de Eventos
    Route::apiResource('eventos', EventoController::class);
    Route::get('municipalidades/{id}/eventos', [EventoController::class, 'porMunicipalidad']);
    Route::post('eventos/por-fecha', [EventoController::class, 'porFecha']);
    
    // Rutas para el CRUD de Estados de Seguimiento
    Route::apiResource('estados-seguimiento', EstadoSeguimientoController::class);
    Route::get('eventos/{id}/estados-seguimiento', [EstadoSeguimientoController::class, 'porEvento']);
    Route::post('estados-seguimiento/por-fecha', [EstadoSeguimientoController::class, 'porFecha']);
    
    // Rutas para el CRUD de Oficios
    Route::apiResource('oficios', OficioController::class);
    Route::get('municipalidades/{id}/oficios', [OficioController::class, 'porMunicipalidad']);
    Route::post('oficios/por-fecha', [OficioController::class, 'porFecha']);
    
    // Rutas para el CRUD de Convenios
    Route::apiResource('convenios', ConvenioController::class);
    Route::get('municipalidades/{id}/convenios', [ConvenioController::class, 'porMunicipalidad']);
    Route::post('convenios/por-fecha', [ConvenioController::class, 'porFecha']);
    Route::post('convenios/por-monto', [ConvenioController::class, 'porMonto']);
    
    // Rutas para el módulo de Presupuesto
    Route::prefix('presupuesto')->group(function () {
        Route::apiResource('areas-ejecutoras', AreaEjecutoraController::class);
        Route::apiResource('categorias', CategoriaController::class);
        Route::apiResource('clasificadores', ClasificadorController::class);
        Route::apiResource('presupuestos', PresupuestoResumenController::class);
        Route::apiResource('ejecuciones', EjecucionMensualController::class);
        
        // Rutas adicionales para obtener clasificadores por categoría
        Route::get('categorias/{id}/clasificadores', [ClasificadorController::class, 'porCategoria']);
        
        // Rutas adicionales para presupuestos
        Route::get('areas-ejecutoras/{id}/presupuestos', [PresupuestoResumenController::class, 'porAreaEjecutora']);
        Route::get('clasificadores/{id}/presupuestos', [PresupuestoResumenController::class, 'porClasificador']);
        Route::get('presupuestos/anio/{anio}', [PresupuestoResumenController::class, 'porAnio']);
        Route::get('presupuestos/resumen/{anio}', [PresupuestoResumenController::class, 'resumenPorAnio']);
        
        // Rutas adicionales para ejecuciones mensuales
        Route::get('areas-ejecutoras/{id}/ejecuciones', [EjecucionMensualController::class, 'porAreaEjecutora']);
        Route::get('clasificadores/{id}/ejecuciones', [EjecucionMensualController::class, 'porClasificador']);
        Route::get('ejecuciones/anio/{anio}/mes/{mes}', [EjecucionMensualController::class, 'porAnioMes']);
        Route::get('ejecuciones/resumen/{anio}', [EjecucionMensualController::class, 'resumenPorAnio']);
    });
    
    // Rutas para el CRUD de Usuarios (solo accesible para administradores)
    Route::middleware('role:super-admin')->group(function () {
        Route::apiResource('users', UserController::class);
        Route::get('roles', [UserController::class, 'getRoles']);
        Route::post('users/{id}/roles', [UserController::class, 'assignRoles']);
    });
    
    // Rutas solo para administradores (ejemplo)
    Route::middleware('role:admin,super-admin')->group(function () {
        // Rutas exclusivas para administradores
        Route::get('/admin/dashboard', function () {
            return response()->json(['message' => 'Panel de administrador']);
        });
    });
});
