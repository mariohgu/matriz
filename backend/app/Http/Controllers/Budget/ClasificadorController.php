<?php

namespace App\Http\Controllers\Budget;

use App\Http\Controllers\Controller;
use App\Models\Budget\Clasificador;
use App\Models\Budget\Categoria;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class ClasificadorController extends Controller
{
    /**
     * Display a listing of the resource.
     *
     * @return \Illuminate\Http\Response
     */
    public function index()
    {
        try {
            $clasificadores = Clasificador::with('categoria')->get();
            return response()->json([
                'status' => 'success',
                'data' => $clasificadores
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Error al obtener los clasificadores',
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
                'id_categoria' => 'required|exists:mysql_budget.categorias,id_categoria',
                'codigo_clasificador' => 'required|string|max:20|unique:mysql_budget.clasificadores,codigo_clasificador',
                'descripcion' => 'required|string|max:200',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Error de validación',
                    'errors' => $validator->errors()
                ], 422);
            }

            $clasificador = Clasificador::create($request->all());
            
            // Cargar la relación con categoría para devolverla en la respuesta
            $clasificador->load('categoria');
            
            return response()->json([
                'status' => 'success',
                'message' => 'Clasificador creado exitosamente',
                'data' => $clasificador
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Error al crear el clasificador',
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
            $clasificador = Clasificador::with('categoria')->findOrFail($id);
            return response()->json([
                'status' => 'success',
                'data' => $clasificador
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Clasificador no encontrado',
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
            $clasificador = Clasificador::findOrFail($id);
            
            $validator = Validator::make($request->all(), [
                'id_categoria' => 'sometimes|required|exists:mysql_budget.categorias,id_categoria',
                'codigo_clasificador' => 'sometimes|required|string|max:20|unique:mysql_budget.clasificadores,codigo_clasificador,' . $id . ',id_clasificador',
                'descripcion' => 'sometimes|required|string|max:200',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Error de validación',
                    'errors' => $validator->errors()
                ], 422);
            }

            $clasificador->update($request->all());
            
            // Cargar la relación con categoría para devolverla en la respuesta
            $clasificador->load('categoria');
            
            return response()->json([
                'status' => 'success',
                'message' => 'Clasificador actualizado exitosamente',
                'data' => $clasificador
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Error al actualizar el clasificador',
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
            $clasificador = Clasificador::findOrFail($id);
            $clasificador->delete();
            
            return response()->json([
                'status' => 'success',
                'message' => 'Clasificador eliminado exitosamente'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Error al eliminar el clasificador',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display a listing of the resource filtered by categoria.
     *
     * @param  int  $id_categoria
     * @return \Illuminate\Http\Response
     */
    public function porCategoria($id_categoria)
    {
        try {
            // Verificar que la categoría existe
            $categoria = Categoria::findOrFail($id_categoria);
            
            // Obtener clasificadores por categoría
            $clasificadores = Clasificador::where('id_categoria', $id_categoria)->get();
            
            return response()->json([
                'status' => 'success',
                'data' => [
                    'categoria' => $categoria,
                    'clasificadores' => $clasificadores
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Error al obtener los clasificadores por categoría',
                'error' => $e->getMessage()
            ], 500);
        }
    }
} 