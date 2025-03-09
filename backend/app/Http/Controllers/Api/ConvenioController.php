<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Convenio;
use App\Models\Municipalidad;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class ConvenioController extends Controller
{
    public function index()
    {
        try {
            $convenios = Convenio::with(['municipalidad', 'creadoPor:id,name', 'actualizadoPor:id,name'])
                ->orderBy('fecha_firma', 'desc')
                ->get();
            return response()->json($convenios);
        } catch (\Exception $e) {
            Log::error('Error al obtener convenios: ' . $e->getMessage());
            return response()->json(['message' => 'Error al obtener los convenios', 'error' => $e->getMessage()], 500);
        }
    }

    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'id_municipalidad' => 'required|exists:municipalidades,id_municipalidad',
                'tipo_convenio' => 'required|string|max:100',
                'monto' => 'required|numeric|min:0',
                'fecha_firma' => 'required|date',
                'estado' => 'sometimes|string|max:50',
                'descripcion' => 'nullable|string'
            ]);

            // Agregar usuario actual como creador y actualizador
            $validated['creado_por'] = 1;//Auth::id();
            $validated['actualizado_por'] = 1;//Auth::id();

            $convenio = Convenio::create($validated);
            
            return response()->json(
                $convenio->load(['municipalidad', 'creadoPor:id,name', 'actualizadoPor:id,name']), 
                201
            );
        } catch (\Exception $e) {
            Log::error('Error al crear convenio: ' . $e->getMessage());
            return response()->json(['message' => 'Error al crear el convenio', 'error' => $e->getMessage()], 500);
        }
    }

    public function show($id)
    {
        try {
            $convenio = Convenio::with(['municipalidad', 'creadoPor:id,name', 'actualizadoPor:id,name'])
                ->find($id);

            if (!$convenio) {
                return response()->json(['message' => 'Convenio no encontrado'], 404);
            }

            return response()->json($convenio);
        } catch (\Exception $e) {
            Log::error('Error al obtener convenio: ' . $e->getMessage());
            return response()->json(['message' => 'Error al obtener el convenio', 'error' => $e->getMessage()], 500);
        }
    }

    public function update(Request $request, $id)
    {
        try {
            $convenio = Convenio::find($id);

            if (!$convenio) {
                return response()->json(['message' => 'Convenio no encontrado'], 404);
            }

            $validated = $request->validate([
                'id_municipalidad' => 'required|exists:municipalidades,id_municipalidad',
                'tipo_convenio' => 'required|string|max:100',
                'monto' => 'required|numeric|min:0',
                'fecha_firma' => 'required|date',
                'estado' => 'sometimes|string|max:50',
                'descripcion' => 'nullable|string'
            ]);

            // Actualizar el usuario que modifica
            $validated['actualizado_por'] = 1;//Auth::id();

            $convenio->update($validated);
            
            return response()->json(
                $convenio->load(['municipalidad', 'creadoPor:id,name', 'actualizadoPor:id,name'])
            );
        } catch (\Exception $e) {
            Log::error('Error al actualizar convenio: ' . $e->getMessage());
            return response()->json(['message' => 'Error al actualizar el convenio', 'error' => $e->getMessage()], 500);
        }
    }

    public function destroy($id)
    {
        try {
            $convenio = Convenio::find($id);

            if (!$convenio) {
                return response()->json(['message' => 'Convenio no encontrado'], 404);
            }

            $convenio->delete();
            return response()->json(null, 204);
        } catch (\Exception $e) {
            Log::error('Error al eliminar convenio: ' . $e->getMessage());
            return response()->json(['message' => 'Error al eliminar el convenio', 'error' => $e->getMessage()], 500);
        }
    }

    public function porMunicipalidad($id_municipalidad)
    {
        try {
            $municipalidad = Municipalidad::find($id_municipalidad);

            if (!$municipalidad) {
                return response()->json(['message' => 'Municipalidad no encontrada'], 404);
            }

            $convenios = Convenio::with(['municipalidad', 'creadoPor:id,name', 'actualizadoPor:id,name'])
                ->where('id_municipalidad', $id_municipalidad)
                ->orderBy('fecha_firma', 'desc')
                ->get();

            return response()->json($convenios);
        } catch (\Exception $e) {
            Log::error('Error al obtener convenios por municipalidad: ' . $e->getMessage());
            return response()->json(['message' => 'Error al obtener los convenios', 'error' => $e->getMessage()], 500);
        }
    }

    public function porFecha(Request $request)
    {
        try {
            $validated = $request->validate([
                'fecha_inicio' => 'required|date',
                'fecha_fin' => 'required|date|after_or_equal:fecha_inicio'
            ]);

            $convenios = Convenio::with(['municipalidad', 'creadoPor:id,name', 'actualizadoPor:id,name'])
                ->whereBetween('fecha_firma', [$validated['fecha_inicio'], $validated['fecha_fin']])
                ->orderBy('fecha_firma', 'desc')
                ->get();

            return response()->json($convenios);
        } catch (\Exception $e) {
            Log::error('Error al obtener convenios por fecha: ' . $e->getMessage());
            return response()->json(['message' => 'Error al obtener los convenios', 'error' => $e->getMessage()], 500);
        }
    }

    public function porMonto(Request $request)
    {
        try {
            $validated = $request->validate([
                'monto_minimo' => 'required|numeric|min:0',
                'monto_maximo' => 'required|numeric|gte:monto_minimo'
            ]);

            $convenios = Convenio::with(['municipalidad', 'creadoPor:id,name', 'actualizadoPor:id,name'])
                ->whereBetween('monto', [$validated['monto_minimo'], $validated['monto_maximo']])
                ->orderBy('monto', 'desc')
                ->get();

            return response()->json($convenios);
        } catch (\Exception $e) {
            Log::error('Error al obtener convenios por monto: ' . $e->getMessage());
            return response()->json(['message' => 'Error al obtener los convenios', 'error' => $e->getMessage()], 500);
        }
    }
}
