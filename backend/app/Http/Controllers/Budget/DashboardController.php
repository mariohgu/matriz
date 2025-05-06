<?php

namespace App\Http\Controllers\Budget;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Exception;
use App\Models\Budget\PresupuestoResumen;
use App\Models\Budget\EjecucionMensual;
use App\Models\Budget\AreaEjecutora;

class DashboardController extends Controller
{
    /**
     * Obtiene un resumen consolidado de ejecución por áreas
     * 
     * @param int $year
     * @return \Illuminate\Http\JsonResponse
     */
    public function getAreasResumen($year)
    {
        try {
            // Validar que el año sea válido
            if (!is_numeric($year) || $year < 2000 || $year > 2100) {
                return response()->json([
                    'error' => 'Año inválido',
                    'message' => 'El año debe ser un número entre 2000 y 2100'
                ], 400);
            }
            
            // Verificar si existen datos para este año
            $existenDatos = PresupuestoResumen::where('anio', $year)->exists();
                
            if (!$existenDatos) {
                return response()->json([
                    'anio' => (int)$year,
                    'areas' => [],
                    'message' => 'No hay datos disponibles para el año ' . $year,
                    'timestamp' => now()->toIso8601String()
                ]);
            }
            
            // Obtener todas las áreas ejecutoras
            $areas = AreaEjecutora::select('id_ae', 'codigo', 'descripcion')
                ->orderBy('descripcion')
                ->get();
                
            // Preparar el array para los resultados
            $resultados = [];
            
            foreach ($areas as $area) {
                // Obtener el PIM total para esta área
                $presupuesto = PresupuestoResumen::selectRaw('
                    SUM(mto_pim) as total_pim,
                    SUM(mto_pia) as total_pia,
                    SUM(mto_certificado) as total_certificado,
                    SUM(mto_compro_anual) as total_compro_anual
                ')
                ->where('id_ae', $area->id_ae)
                ->where('anio', $year)
                ->first();
                    
                // Obtener el devengado total para esta área
                $ejecucion = EjecucionMensual::selectRaw('
                    SUM(mto_devengado) as total_devengado,
                    SUM(mto_girado) as total_girado,
                    SUM(mto_pagado) as total_pagado
                ')
                ->where('id_ae', $area->id_ae)
                ->where('anio', $year)
                ->first();
                    
                // Calcular el porcentaje de ejecución
                $totalPIM = $presupuesto->total_pim ?? 0;
                $totalDevengado = $ejecucion->total_devengado ?? 0;
                $porcentajeEjecucion = $totalPIM > 0 ? ($totalDevengado / $totalPIM) * 100 : 0;
                
                // Añadir los datos del área al resultado
                $resultados[] = [
                    'id_ae' => $area->id_ae,
                    'codigo' => $area->codigo,
                    'descripcion' => $area->descripcion,
                    'presupuesto' => [
                        'total_pim' => (float)$totalPIM,
                        'total_pia' => (float)($presupuesto->total_pia ?? 0),
                        'total_certificado' => (float)($presupuesto->total_certificado ?? 0),
                        'total_compro_anual' => (float)($presupuesto->total_compro_anual ?? 0)
                    ],
                    'ejecucion' => [
                        'total_devengado' => (float)$totalDevengado,
                        'total_girado' => (float)($ejecucion->total_girado ?? 0),
                        'total_pagado' => (float)($ejecucion->total_pagado ?? 0)
                    ],
                    'por_ejecutar' => (float)max(0, $totalPIM - $totalDevengado),
                    'porcentaje_ejecucion' => (float)$porcentajeEjecucion
                ];
            }
            
            // Ordenar por porcentaje de ejecución (descendente)
            usort($resultados, function($a, $b) {
                return $b['porcentaje_ejecucion'] <=> $a['porcentaje_ejecucion'];
            });
            
            return response()->json([
                'anio' => (int)$year,
                'areas' => $resultados,
                'timestamp' => now()->toIso8601String()
            ]);
        } catch (Exception $e) {
            // Registrar el error para depuración
            \Log::error('Error en getAreasResumen: ' . $e->getMessage());
            \Log::error($e->getTraceAsString());
            
            return response()->json([
                'error' => 'Error interno del servidor',
                'message' => 'Ocurrió un error al procesar la solicitud. Por favor, inténtelo de nuevo más tarde.'
            ], 500);
        }
    }
    
    /**
     * Obtiene un resumen global consolidado
     * 
     * @param int $year
     * @return \Illuminate\Http\JsonResponse
     */
    public function getResumenGlobal($year)
    {
        try {
            // Validar que el año sea válido
            if (!is_numeric($year) || $year < 2000 || $year > 2100) {
                return response()->json([
                    'error' => 'Año inválido',
                    'message' => 'El año debe ser un número entre 2000 y 2100'
                ], 400);
            }
            
            // Verificar si existen datos para este año
            $existenDatos = PresupuestoResumen::where('anio', $year)->exists();
                
            if (!$existenDatos) {
                return response()->json([
                    'anio' => (int)$year,
                    'totales_generales' => [
                        'total_pim' => 0,
                        'total_pia' => 0, 
                        'total_certificado' => 0,
                        'total_compro_anual' => 0,
                        'total_devengado' => 0,
                        'total_girado' => 0,
                        'total_pagado' => 0,
                        'por_ejecutar' => 0,
                        'porcentaje_ejecucion' => 0
                    ],
                    'resumen_por_mes' => [],
                    'message' => 'No hay datos disponibles para el año ' . $year,
                    'timestamp' => now()->toIso8601String()
                ]);
            }
            
            // Obtener el PIM total
            $presupuesto = PresupuestoResumen::selectRaw('
                SUM(mto_pim) as total_pim,
                SUM(mto_pia) as total_pia,
                SUM(mto_certificado) as total_certificado,
                SUM(mto_compro_anual) as total_compro_anual
            ')
            ->where('anio', $year)
            ->first();
                
            // Obtener el devengado total
            $ejecucion = EjecucionMensual::selectRaw('
                SUM(mto_devengado) as total_devengado,
                SUM(mto_girado) as total_girado,
                SUM(mto_pagado) as total_pagado
            ')
            ->where('anio', $year)
            ->first();
                
            // Obtener resumen por mes
            $resumenPorMes = EjecucionMensual::selectRaw('
                mes,
                SUM(mto_devengado) as total_devengado,
                SUM(mto_girado) as total_girado,
                SUM(mto_pagado) as total_pagado
            ')
            ->where('anio', $year)
            ->groupBy('mes')
            ->orderBy('mes')
            ->get();
                
            // Calcular totales y porcentajes
            $totalPIM = (float)($presupuesto->total_pim ?? 0);
            $totalDevengado = (float)($ejecucion->total_devengado ?? 0);
            $porEjecutar = (float)max(0, $totalPIM - $totalDevengado);
            $porcentajeEjecucion = $totalPIM > 0 ? ($totalDevengado / $totalPIM) * 100 : 0;
                
            return response()->json([
                'anio' => (int)$year,
                'totales_generales' => [
                    'total_pim' => $totalPIM,
                    'total_pia' => (float)($presupuesto->total_pia ?? 0),
                    'total_certificado' => (float)($presupuesto->total_certificado ?? 0),
                    'total_compro_anual' => (float)($presupuesto->total_compro_anual ?? 0),
                    'total_devengado' => $totalDevengado,
                    'total_girado' => (float)($ejecucion->total_girado ?? 0),
                    'total_pagado' => (float)($ejecucion->total_pagado ?? 0),
                    'por_ejecutar' => $porEjecutar,
                    'porcentaje_ejecucion' => (float)$porcentajeEjecucion
                ],
                'resumen_por_mes' => $resumenPorMes,
                'timestamp' => now()->toIso8601String()
            ]);
        } catch (Exception $e) {
            // Registrar el error para depuración
            \Log::error('Error en getResumenGlobal: ' . $e->getMessage());
            \Log::error($e->getTraceAsString());
            
            return response()->json([
                'error' => 'Error interno del servidor',
                'message' => 'Ocurrió un error al procesar la solicitud. Por favor, inténtelo de nuevo más tarde.'
            ], 500);
        }
    }
} 