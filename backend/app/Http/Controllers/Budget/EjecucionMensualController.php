<?php

namespace App\Http\Controllers\Budget;

use App\Http\Controllers\Controller;
use App\Models\Budget\EjecucionMensual;
use App\Models\Budget\AreaEjecutora;
use App\Models\Budget\Clasificador;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;

class EjecucionMensualController extends Controller
{
    /**
     * The database connection that should be used by the controller.
     *
     * @var string
     */
    protected $connection = 'mysql_budget';
    
    /**
     * Display a listing of the resource.
     *
     * @return \Illuminate\Http\Response
     */
    public function index()
    {
        try {
            $ejecuciones = EjecucionMensual::with(['areaEjecutora', 'clasificador.categoria'])->get();
            return response()->json([
                'status' => 'success',
                'data' => $ejecuciones
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Error al obtener las ejecuciones mensuales',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Store a newly created resource in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function store(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'id_ae' => 'required|exists:mysql_budget.areas_ejecutoras,id_ae',
                'id_clasificador' => 'required|exists:mysql_budget.clasificadores,id_clasificador',
                'fecha' => 'required|date',
                'anio' => 'required|integer|min:1900|max:2100',
                'mes' => 'required|integer|min:1|max:12',
                'mto_at_comp' => 'required|numeric',
                'mto_devengado' => 'required|numeric',
                'mto_girado' => 'required|numeric',
                'mto_pagado' => 'required|numeric',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Error de validación',
                    'errors' => $validator->errors()
                ], 422);
            }

            $ejecucion = EjecucionMensual::create($request->all());
            
            // Cargar las relaciones para devolverlas en la respuesta
            $ejecucion->load(['areaEjecutora', 'clasificador.categoria']);
            
            return response()->json([
                'status' => 'success',
                'message' => 'Ejecución mensual creada exitosamente',
                'data' => $ejecucion
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Error al crear la ejecución mensual',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified resource.
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function show($id)
    {
        try {
            $ejecucion = EjecucionMensual::with(['areaEjecutora', 'clasificador.categoria'])->findOrFail($id);
            return response()->json([
                'status' => 'success',
                'data' => $ejecucion
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Ejecución mensual no encontrada',
                'error' => $e->getMessage()
            ], 404);
        }
    }

    /**
     * Update the specified resource in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function update(Request $request, $id)
    {
        try {
            $ejecucion = EjecucionMensual::findOrFail($id);
            
            $validator = Validator::make($request->all(), [
                'id_ae' => 'sometimes|required|exists:mysql_budget.areas_ejecutoras,id_ae',
                'id_clasificador' => 'sometimes|required|exists:mysql_budget.clasificadores,id_clasificador',
                'fecha' => 'sometimes|required|date',
                'anio' => 'sometimes|required|integer|min:1900|max:2100',
                'mes' => 'sometimes|required|integer|min:1|max:12',
                'mto_at_comp' => 'sometimes|required|numeric',
                'mto_devengado' => 'sometimes|required|numeric',
                'mto_girado' => 'sometimes|required|numeric',
                'mto_pagado' => 'sometimes|required|numeric',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Error de validación',
                    'errors' => $validator->errors()
                ], 422);
            }

            $ejecucion->update($request->all());
            
            // Cargar las relaciones para devolverlas en la respuesta
            $ejecucion->load(['areaEjecutora', 'clasificador.categoria']);
            
            return response()->json([
                'status' => 'success',
                'message' => 'Ejecución mensual actualizada exitosamente',
                'data' => $ejecucion
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Error al actualizar la ejecución mensual',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified resource from storage.
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function destroy($id)
    {
        try {
            $ejecucion = EjecucionMensual::findOrFail($id);
            $ejecucion->delete();
            
            return response()->json([
                'status' => 'success',
                'message' => 'Ejecución mensual eliminada exitosamente'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Error al eliminar la ejecución mensual',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display a listing of the resource filtered by area ejecutora.
     *
     * @param  int  $id_ae
     * @return \Illuminate\Http\Response
     */
    public function porAreaEjecutora($id_ae)
    {
        try {
            // Verificar que el área ejecutora existe
            $areaEjecutora = AreaEjecutora::findOrFail($id_ae);
            
            // Obtener ejecuciones por área ejecutora
            $ejecuciones = EjecucionMensual::with(['clasificador.categoria'])
                ->where('id_ae', $id_ae)
                ->orderBy('anio', 'desc')
                ->orderBy('mes', 'desc')
                ->get();
            
            return response()->json([
                'status' => 'success',
                'data' => [
                    'area_ejecutora' => $areaEjecutora,
                    'ejecuciones' => $ejecuciones
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Error al obtener las ejecuciones mensuales por área ejecutora',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display a listing of the resource filtered by clasificador.
     *
     * @param  int  $id_clasificador
     * @return \Illuminate\Http\Response
     */
    public function porClasificador($id_clasificador)
    {
        try {
            // Verificar que el clasificador existe
            $clasificador = Clasificador::with('categoria')->findOrFail($id_clasificador);
            
            // Obtener ejecuciones por clasificador
            $ejecuciones = EjecucionMensual::with(['areaEjecutora'])
                ->where('id_clasificador', $id_clasificador)
                ->orderBy('anio', 'desc')
                ->orderBy('mes', 'desc')
                ->get();
            
            return response()->json([
                'status' => 'success',
                'data' => [
                    'clasificador' => $clasificador,
                    'ejecuciones' => $ejecuciones
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Error al obtener las ejecuciones mensuales por clasificador',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display a listing of the resource filtered by year and month.
     *
     * @param  int  $anio
     * @param  int  $mes
     * @return \Illuminate\Http\Response
     */
    public function porAnioMes($anio, $mes)
    {
        try {
            // Validar el año y mes
            if (!is_numeric($anio) || $anio < 1900 || $anio > 2100) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Año inválido'
                ], 422);
            }
            
            if (!is_numeric($mes) || $mes < 1 || $mes > 12) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Mes inválido'
                ], 422);
            }
            
            // Obtener ejecuciones por año y mes
            $ejecuciones = EjecucionMensual::with(['areaEjecutora', 'clasificador.categoria'])
                ->where('anio', $anio)
                ->where('mes', $mes)
                ->get();
            
            // Calcular totales
            $totales = [
                'mto_at_comp' => $ejecuciones->sum('mto_at_comp'),
                'mto_devengado' => $ejecuciones->sum('mto_devengado'),
                'mto_girado' => $ejecuciones->sum('mto_girado'),
                'mto_pagado' => $ejecuciones->sum('mto_pagado'),
            ];
            
            return response()->json([
                'status' => 'success',
                'data' => [
                    'anio' => $anio,
                    'mes' => $mes,
                    'ejecuciones' => $ejecuciones,
                    'totales' => $totales
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Error al obtener las ejecuciones mensuales por año y mes',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display a summary of monthly execution by year and area ejecutora.
     *
     * @param  int  $anio
     * @return \Illuminate\Http\Response
     */
    public function resumenPorAnio($anio)
    {
        try {
            // Validar el año
            if (!is_numeric($anio) || $anio < 1900 || $anio > 2100) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Año inválido'
                ], 422);
            }
            
            // Obtener resumen agrupado por área ejecutora y mes
            $resumenPorAE = DB::connection($this->connection)
                ->table('ejecucion_mensual as em')
                ->join('areas_ejecutoras as ae', 'em.id_ae', '=', 'ae.id_ae')
                ->where('em.anio', $anio)
                ->groupBy('em.id_ae', 'ae.codigo', 'ae.descripcion', 'em.mes')
                ->select(
                    'ae.id_ae',
                    'ae.codigo',
                    'ae.descripcion',
                    'em.mes',
                    DB::raw('SUM(em.mto_at_comp) as total_at_comp'),
                    DB::raw('SUM(em.mto_devengado) as total_devengado'),
                    DB::raw('SUM(em.mto_girado) as total_girado'),
                    DB::raw('SUM(em.mto_pagado) as total_pagado')
                )
                ->orderBy('ae.id_ae')
                ->orderBy('em.mes')
                ->get();
            
            // Agrupar resultados por área ejecutora
            $resumenAgrupado = collect($resumenPorAE)->groupBy('id_ae')->map(function ($item) {
                $areaData = [
                    'id_ae' => $item[0]->id_ae,
                    'codigo' => $item[0]->codigo,
                    'descripcion' => $item[0]->descripcion,
                    'ejecucion_mensual' => $item->mapWithKeys(function ($mes) {
                        return [
                            $mes->mes => [
                                'total_at_comp' => $mes->total_at_comp,
                                'total_devengado' => $mes->total_devengado,
                                'total_girado' => $mes->total_girado,
                                'total_pagado' => $mes->total_pagado,
                            ]
                        ];
                    })
                ];
                
                // Agregar totales por área
                $areaData['totales'] = [
                    'total_at_comp' => $item->sum('total_at_comp'),
                    'total_devengado' => $item->sum('total_devengado'),
                    'total_girado' => $item->sum('total_girado'),
                    'total_pagado' => $item->sum('total_pagado'),
                ];
                
                return $areaData;
            });
            
            // Calcular totales generales
            $totalesPorMes = collect($resumenPorAE)->groupBy('mes')->map(function ($item, $mes) {
                return [
                    'mes' => $mes,
                    'total_at_comp' => $item->sum('total_at_comp'),
                    'total_devengado' => $item->sum('total_devengado'),
                    'total_girado' => $item->sum('total_girado'),
                    'total_pagado' => $item->sum('total_pagado'),
                ];
            })->values();
            
            $totalesGenerales = [
                'total_at_comp' => $totalesPorMes->sum('total_at_comp'),
                'total_devengado' => $totalesPorMes->sum('total_devengado'),
                'total_girado' => $totalesPorMes->sum('total_girado'),
                'total_pagado' => $totalesPorMes->sum('total_pagado'),
            ];
            
            return response()->json([
                'status' => 'success',
                'data' => [
                    'anio' => $anio,
                    'resumen_por_area' => $resumenAgrupado->values(),
                    'resumen_por_mes' => $totalesPorMes,
                    'totales_generales' => $totalesGenerales
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Error al obtener el resumen por año',
                'error' => $e->getMessage()
            ], 500);
        }
    }
} 