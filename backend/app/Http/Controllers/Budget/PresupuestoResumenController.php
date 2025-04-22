<?php

namespace App\Http\Controllers\Budget;

use App\Http\Controllers\Controller;
use App\Models\Budget\PresupuestoResumen;
use App\Models\Budget\AreaEjecutora;
use App\Models\Budget\Clasificador;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;

class PresupuestoResumenController extends Controller
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
            $presupuestos = PresupuestoResumen::with(['areaEjecutora', 'clasificador.categoria'])->get();
            return response()->json([
                'status' => 'success',
                'data' => $presupuestos
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Error al obtener los presupuestos',
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
                'mto_pia' => 'required|numeric',
                'mto_modificaciones' => 'required|numeric',
                'mto_pim' => 'required|numeric',
                'mto_certificado' => 'required|numeric',
                'mto_compro_anual' => 'required|numeric',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Error de validación',
                    'errors' => $validator->errors()
                ], 422);
            }

            $presupuesto = PresupuestoResumen::create($request->all());
            
            // Cargar las relaciones para devolverlas en la respuesta
            $presupuesto->load(['areaEjecutora', 'clasificador.categoria']);
            
            return response()->json([
                'status' => 'success',
                'message' => 'Presupuesto creado exitosamente',
                'data' => $presupuesto
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Error al crear el presupuesto',
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
            $presupuesto = PresupuestoResumen::with(['areaEjecutora', 'clasificador.categoria'])->findOrFail($id);
            return response()->json([
                'status' => 'success',
                'data' => $presupuesto
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Presupuesto no encontrado',
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
            $presupuesto = PresupuestoResumen::findOrFail($id);
            
            $validator = Validator::make($request->all(), [
                'id_ae' => 'sometimes|required|exists:mysql_budget.areas_ejecutoras,id_ae',
                'id_clasificador' => 'sometimes|required|exists:mysql_budget.clasificadores,id_clasificador',
                'fecha' => 'sometimes|required|date',
                'anio' => 'sometimes|required|integer|min:1900|max:2100',
                'mto_pia' => 'sometimes|required|numeric',
                'mto_modificaciones' => 'sometimes|required|numeric',
                'mto_pim' => 'sometimes|required|numeric',
                'mto_certificado' => 'sometimes|required|numeric',
                'mto_compro_anual' => 'sometimes|required|numeric',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Error de validación',
                    'errors' => $validator->errors()
                ], 422);
            }

            $presupuesto->update($request->all());
            
            // Cargar las relaciones para devolverlas en la respuesta
            $presupuesto->load(['areaEjecutora', 'clasificador.categoria']);
            
            return response()->json([
                'status' => 'success',
                'message' => 'Presupuesto actualizado exitosamente',
                'data' => $presupuesto
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Error al actualizar el presupuesto',
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
            $presupuesto = PresupuestoResumen::findOrFail($id);
            $presupuesto->delete();
            
            return response()->json([
                'status' => 'success',
                'message' => 'Presupuesto eliminado exitosamente'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Error al eliminar el presupuesto',
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
            
            // Obtener presupuestos por área ejecutora
            $presupuestos = PresupuestoResumen::with(['clasificador.categoria'])
                ->where('id_ae', $id_ae)
                ->get();
            
            return response()->json([
                'status' => 'success',
                'data' => [
                    'area_ejecutora' => $areaEjecutora,
                    'presupuestos' => $presupuestos
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Error al obtener los presupuestos por área ejecutora',
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
            
            // Obtener presupuestos por clasificador
            $presupuestos = PresupuestoResumen::with(['areaEjecutora'])
                ->where('id_clasificador', $id_clasificador)
                ->get();
            
            return response()->json([
                'status' => 'success',
                'data' => [
                    'clasificador' => $clasificador,
                    'presupuestos' => $presupuestos
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Error al obtener los presupuestos por clasificador',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display a listing of the resource filtered by year.
     *
     * @param  int  $anio
     * @return \Illuminate\Http\Response
     */
    public function porAnio($anio)
    {
        try {
            // Validar el año
            if (!is_numeric($anio) || $anio < 1900 || $anio > 2100) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Año inválido'
                ], 422);
            }
            
            // Obtener presupuestos por año
            $presupuestos = PresupuestoResumen::with(['areaEjecutora', 'clasificador.categoria'])
                ->where('anio', $anio)
                ->get();
            
            // Calcular totales
            $totales = [
                'mto_pia' => $presupuestos->sum('mto_pia'),
                'mto_modificaciones' => $presupuestos->sum('mto_modificaciones'),
                'mto_pim' => $presupuestos->sum('mto_pim'),
                'mto_certificado' => $presupuestos->sum('mto_certificado'),
                'mto_compro_anual' => $presupuestos->sum('mto_compro_anual'),
            ];
            
            return response()->json([
                'status' => 'success',
                'data' => [
                    'anio' => $anio,
                    'presupuestos' => $presupuestos,
                    'totales' => $totales
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Error al obtener los presupuestos por año',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display a summary of budget by year and area ejecutora.
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
            
            // Obtener resumen agrupado por área ejecutora
            $resumenPorAE = DB::connection($this->connection)
                ->table('presupuesto_resumen as pr')
                ->join('areas_ejecutoras as ae', 'pr.id_ae', '=', 'ae.id_ae')
                ->where('pr.anio', $anio)
                ->groupBy('pr.id_ae', 'ae.codigo', 'ae.descripcion')
                ->select(
                    'ae.id_ae',
                    'ae.codigo',
                    'ae.descripcion',
                    DB::raw('SUM(pr.mto_pia) as total_pia'),
                    DB::raw('SUM(pr.mto_modificaciones) as total_modificaciones'),
                    DB::raw('SUM(pr.mto_pim) as total_pim'),
                    DB::raw('SUM(pr.mto_certificado) as total_certificado'),
                    DB::raw('SUM(pr.mto_compro_anual) as total_compro_anual')
                )
                ->get();
            
            // Calcular totales generales
            $totalesGenerales = [
                'total_pia' => $resumenPorAE->sum('total_pia'),
                'total_modificaciones' => $resumenPorAE->sum('total_modificaciones'),
                'total_pim' => $resumenPorAE->sum('total_pim'),
                'total_certificado' => $resumenPorAE->sum('total_certificado'),
                'total_compro_anual' => $resumenPorAE->sum('total_compro_anual'),
            ];
            
            return response()->json([
                'status' => 'success',
                'data' => [
                    'anio' => $anio,
                    'resumen_por_area' => $resumenPorAE,
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