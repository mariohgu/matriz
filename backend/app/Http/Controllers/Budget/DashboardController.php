<?php

namespace App\Http\Controllers\Budget;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Exception;
use App\Models\Budget\PresupuestoResumen;
use App\Models\Budget\EjecucionMensual;
use App\Models\Budget\AreaEjecutora;
use App\Models\Budget\Clasificador;
use Illuminate\Support\Facades\DB;

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
    
    /**
     * Obtiene un reporte detallado por centro de costo (área ejecutora) con datos presupuestales
     * agrupados por clasificadores y meses
     * 
     * @param Request $request
     * @param int $year
     * @return \Illuminate\Http\JsonResponse
     */
    public function getReporteDetallado(Request $request, $year)
    {
        try {
            // Validación básica
            if (!is_numeric($year) || $year < 2000 || $year > 2100) {
                return response()->json([
                    'error' => 'Año inválido',
                    'message' => 'El año debe ser un número entre 2000 y 2100'
                ], 400);
            }
            
            // Parámetros de filtro
            $idArea = $request->input('id_area');
            $filtroClasificador = $request->input('clasificador');
            
            // Verificar si existen datos para este año
            $existenDatos = PresupuestoResumen::on('mysql_budget')->where('anio', $year)
                ->when($idArea, function($query) use ($idArea) {
                    return $query->where('id_ae', $idArea);
                })
                ->exists();
            
            // Datos de centro de costo si está seleccionado
            $areaCosto = null;
            if ($idArea) {
                $areaCosto = AreaEjecutora::on('mysql_budget')->find($idArea);
            }
            
            // Respuesta base que se completará según los datos disponibles
            $respuesta = [
                'anio' => (int)$year,
                'centro_costo' => $areaCosto ? [
                    'id' => $areaCosto->id_ae,
                    'codigo' => $areaCosto->codigo,
                    'descripcion' => $areaCosto->descripcion
                ] : null,
                'totales_generales' => [
                    'total_pim' => 0,
                    'total_certificado' => 0,
                    'total_compromiso' => 0,
                    'total_devengado' => 0,
                    'porcentaje_certificado' => 0,
                    'porcentaje_compromiso' => 0,
                    'porcentaje_devengado' => 0,
                ],
                'ejecucion_mensual' => [],
                'detalle_clasificadores' => [],
                'timestamp' => now()->toIso8601String()
            ];
            
            // Si no hay datos, devolver respuesta base
            if (!$existenDatos) {
                $respuesta['mensaje'] = 'No hay datos disponibles para el año ' . $year;
                return response()->json($respuesta);
            }
            
            try {
                // 1. Obtener los totales generales de forma simplificada
                $presupuestoQuery = PresupuestoResumen::on('mysql_budget')->selectRaw('
                    SUM(mto_pim) as total_pim,
                    SUM(mto_certificado) as total_certificado,
                    SUM(mto_compro_anual) as total_compromiso
                ')
                ->where('anio', $year);
                
                if ($idArea) {
                    $presupuestoQuery->where('id_ae', $idArea);
                }
                
                $presupuesto = $presupuestoQuery->first();
                
                // 2. Obtener el devengado total
                $ejecucionQuery = EjecucionMensual::on('mysql_budget')->selectRaw('
                    SUM(mto_devengado) as total_devengado
                ')
                ->where('anio', $year);
                
                if ($idArea) {
                    $ejecucionQuery->where('id_ae', $idArea);
                }
                
                $ejecucion = $ejecucionQuery->first();
                
                // 3. Obtener el resumen por mes
                $ejecucionMensualQuery = EjecucionMensual::on('mysql_budget')->selectRaw('
                    mes,
                    SUM(mto_devengado) as total_devengado
                ')
                ->where('anio', $year);
                
                if ($idArea) {
                    $ejecucionMensualQuery->where('id_ae', $idArea);
                }
                
                $ejecucionMensual = $ejecucionMensualQuery->groupBy('mes')
                    ->orderBy('mes')
                    ->get();
                    
                // Actualizar respuesta con los datos básicos
                $totalPIM = (float)($presupuesto->total_pim ?? 0);
                $totalCertificado = (float)($presupuesto->total_certificado ?? 0);
                $totalCompromiso = (float)($presupuesto->total_compromiso ?? 0);
                $totalDevengado = (float)($ejecucion->total_devengado ?? 0);
                
                $porcentajeCertificado = $totalPIM > 0 ? ($totalCertificado / $totalPIM) * 100 : 0;
                $porcentajeCompromiso = $totalPIM > 0 ? ($totalCompromiso / $totalPIM) * 100 : 0;
                $porcentajeDevengado = $totalPIM > 0 ? ($totalDevengado / $totalPIM) * 100 : 0;
                
                $respuesta['totales_generales'] = [
                    'total_pim' => round($totalPIM, 2),
                    'total_certificado' => round($totalCertificado, 2),
                    'total_compromiso' => round($totalCompromiso, 2),
                    'total_devengado' => round($totalDevengado, 2),
                    'porcentaje_certificado' => round($porcentajeCertificado, 2),
                    'porcentaje_compromiso' => round($porcentajeCompromiso, 2),
                    'porcentaje_devengado' => round($porcentajeDevengado, 2),
                ];
                $respuesta['ejecucion_mensual'] = $ejecucionMensual;
            } catch (Exception $e) {
                \Log::error('Error al obtener datos básicos: ' . $e->getMessage());
                // Continuar con la respuesta base sin detener la ejecución
            }
                
            // 4. Intentar obtener datos de clasificadores
            try {
                $detalleClasificadores = [];
                
                // Verificar si existen las tablas necesarias
                if (!\Schema::connection('mysql_budget')->hasTable('clasificadores')) {
                    throw new Exception("La tabla 'clasificadores' no existe en la conexión mysql_budget");
                }
                
                // Consulta para obtener clasificadores con sus montos correspondientes
                $clasificadoresQuery = DB::connection('mysql_budget')->table('presupuesto_resumen as pr')
                    ->join('clasificadores as c', 'pr.id_clasificador', '=', 'c.id_clasificador')
                    ->select(
                        'c.id_clasificador',
                        'c.codigo_clasificador as codigo',
                        'c.descripcion',
                        DB::raw('SUM(pr.mto_pim) as pim'),
                        DB::raw('SUM(pr.mto_certificado) as certificado'),
                        DB::raw('SUM(pr.mto_compro_anual) as compromiso')
                    )
                    ->where('pr.anio', $year)
                    ->groupBy('c.id_clasificador', 'c.codigo_clasificador', 'c.descripcion');
                
                if ($idArea) {
                    $clasificadoresQuery->where('pr.id_ae', $idArea);
                }
                
                if ($filtroClasificador) {
                    $clasificadoresQuery->where('c.codigo_clasificador', 'like', $filtroClasificador . '%');
                }
                
                $clasificadores = $clasificadoresQuery->get();
                
                // Para cada clasificador, obtener su ejecución mensual
                foreach ($clasificadores as $clasificador) {
                    try {
                        $ejecucionClasificadorQuery = DB::connection('mysql_budget')->table('ejecucion_mensual as em')
                            ->join('presupuesto_resumen as pr', function($join) {
                                $join->on('em.id_ae', '=', 'pr.id_ae')
                                    ->on('em.anio', '=', 'pr.anio')
                                    ->on('em.id_clasificador', '=', 'pr.id_clasificador');
                            })
                            ->select(
                                'em.mes',
                                DB::raw('SUM(em.mto_devengado) as devengado')
                            )
                            ->where('em.anio', $year)
                            ->where('em.id_clasificador', $clasificador->id_clasificador)
                            ->groupBy('em.mes');
                        
                        if ($idArea) {
                            $ejecucionClasificadorQuery->where('em.id_ae', $idArea);
                        }
                        
                        $ejecucionClasificador = $ejecucionClasificadorQuery->get()->keyBy('mes');
                        
                        // Calcular ejecución total
                        $devengadoTotal = 0;
                        $enero = 0;
                        $febrero = 0;
                        $marzo = 0;
                        
                        foreach ($ejecucionClasificador as $mes => $ejec) {
                            $devengadoTotal += $ejec->devengado;
                            
                            if ($mes == 1) $enero = $ejec->devengado;
                            if ($mes == 2) $febrero = $ejec->devengado;
                            if ($mes == 3) $marzo = $ejec->devengado;
                        }
                        
                        // Añadir al detalle de clasificadores
                        $detalleClasificadores[] = [
                            'id' => $clasificador->id_clasificador,
                            'codigo' => $clasificador->codigo,
                            'descripcion' => $clasificador->descripcion,
                            'pim' => round((float)$clasificador->pim, 2),
                            'certificado' => round((float)$clasificador->certificado, 2),
                            'compromiso' => round((float)$clasificador->compromiso, 2),
                            'devengado_total' => round($devengadoTotal, 2),
                            'devengado_enero' => round($enero, 2),
                            'devengado_febrero' => round($febrero, 2),
                            'devengado_marzo' => round($marzo, 2),
                            'saldo_devengar' => round((float)$clasificador->pim - $devengadoTotal, 2)
                        ];
                    } catch (Exception $e) {
                        \Log::error('Error al procesar ejecución del clasificador ' . $clasificador->codigo_clasificador . ': ' . $e->getMessage());
                        // Continuar con el siguiente clasificador
                    }
                }
                
                $respuesta['detalle_clasificadores'] = $detalleClasificadores;
            } catch (Exception $e) {
                \Log::error('Error al obtener clasificadores: ' . $e->getMessage());
                // Se mantiene el array vacío en la respuesta
                $respuesta['mensaje_clasificadores'] = 'No se pudieron cargar los clasificadores: ' . $e->getMessage();
            }
            
            return response()->json($respuesta);
        } catch (Exception $e) {
            // Registrar el error para depuración con más detalles
            \Log::error('Error en getReporteDetallado: ' . $e->getMessage());
            \Log::error('Archivo: ' . $e->getFile() . ', Línea: ' . $e->getLine());
            \Log::error($e->getTraceAsString());
            
            return response()->json([
                'error' => 'Error interno del servidor',
                'mensaje' => $e->getMessage(),
                'linea' => $e->getLine(),
                'archivo' => $e->getFile()
            ], 500);
        }
    }
} 