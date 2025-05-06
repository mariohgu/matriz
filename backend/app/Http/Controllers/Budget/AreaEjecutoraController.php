<?php

namespace App\Http\Controllers\Budget;

use App\Http\Controllers\Controller;
use App\Models\Budget\AreaEjecutora;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class AreaEjecutoraController extends Controller
{
    /**
     * Display a listing of the resource.
     *
     * @return \Illuminate\Http\Response
     */
    public function index()
    {
        try {
            $areasEjecutoras = AreaEjecutora::all();
            return response()->json([
                'status' => 'success',
                'data' => $areasEjecutoras
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Error al obtener las áreas ejecutoras',
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
                'codigo' => 'required|integer|unique:mysql_budget.areas_ejecutoras,codigo',
                'descripcion' => 'required|string|max:200',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Error de validación',
                    'errors' => $validator->errors()
                ], 422);
            }

            $areaEjecutora = AreaEjecutora::create($request->all());
            
            return response()->json([
                'status' => 'success',
                'message' => 'Área ejecutora creada exitosamente',
                'data' => $areaEjecutora
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Error al crear el área ejecutora',
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
            $areaEjecutora = AreaEjecutora::findOrFail($id);
            return response()->json([
                'status' => 'success',
                'data' => $areaEjecutora
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Área ejecutora no encontrada',
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
            $areaEjecutora = AreaEjecutora::findOrFail($id);
            
            $validator = Validator::make($request->all(), [
                'codigo' => 'sometimes|required|integer|unique:mysql_budget.areas_ejecutoras,codigo,' . $id . ',id_ae',
                'descripcion' => 'sometimes|required|string|max:200',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Error de validación',
                    'errors' => $validator->errors()
                ], 422);
            }

            $areaEjecutora->update($request->all());
            
            return response()->json([
                'status' => 'success',
                'message' => 'Área ejecutora actualizada exitosamente',
                'data' => $areaEjecutora
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Error al actualizar el área ejecutora',
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
            $areaEjecutora = AreaEjecutora::findOrFail($id);
            $areaEjecutora->delete();
            
            return response()->json([
                'status' => 'success',
                'message' => 'Área ejecutora eliminada exitosamente'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Error al eliminar el área ejecutora',
                'error' => $e->getMessage()
            ], 500);
        }
    }
} 