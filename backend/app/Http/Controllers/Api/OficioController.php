<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Oficio;
use App\Models\Municipalidad;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class OficioController extends Controller
{
    public function index()
    {
        try {
            $oficios = Oficio::with(['municipalidad', 'creadoPor:id,name', 'actualizadoPor:id,name'])
                ->orderBy('fecha_envio', 'desc')
                ->get();
            return response()->json($oficios);
        } catch (\Exception $e) {
            Log::error('Error al obtener oficios: ' . $e->getMessage());
            return response()->json(['message' => 'Error al obtener los oficios', 'error' => $e->getMessage()], 500);
        }
    }

    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'id_municipalidad' => 'required|exists:municipalidades,id_municipalidad',
                'numero_oficio' => 'required|string|max:255',
                'fecha_envio' => 'required|date',
                'asunto' => 'required|string|max:255',
                'contenido' => 'required',
                'estado' => 'required|string|max:50'
            ]);

            // Verificar unicidad de número de oficio por municipalidad
            $exists = Oficio::where('numero_oficio', $validated['numero_oficio'])
                ->where('id_municipalidad', $validated['id_municipalidad'])
                ->exists();

            if ($exists) {
                return response()->json([
                    'message' => 'Ya existe un oficio con este número para esta municipalidad'
                ], 422);
            }

            // Agregar usuario actual como creador y actualizador
            $validated['creado_por'] = 1;//Auth::id();
            $validated['actualizado_por'] = 1;//Auth::id();

            $oficio = Oficio::create($validated);
            
            return response()->json(
                $oficio->load(['municipalidad', 'creadoPor:id,name', 'actualizadoPor:id,name']), 
                201
            );
        } catch (\Exception $e) {
            Log::error('Error al crear oficio: ' . $e->getMessage());
            return response()->json(['message' => 'Error al crear el oficio', 'error' => $e->getMessage()], 500);
        }
    }

    public function show($id)
    {
        try {
            $oficio = Oficio::with(['municipalidad', 'creadoPor:id,name', 'actualizadoPor:id,name'])
                ->find($id);

            if (!$oficio) {
                return response()->json(['message' => 'Oficio no encontrado'], 404);
            }

            return response()->json($oficio);
        } catch (\Exception $e) {
            Log::error('Error al obtener oficio: ' . $e->getMessage());
            return response()->json(['message' => 'Error al obtener el oficio', 'error' => $e->getMessage()], 500);
        }
    }

    public function update(Request $request, $id)
    {
        try {
            $oficio = Oficio::find($id);

            if (!$oficio) {
                return response()->json(['message' => 'Oficio no encontrado'], 404);
            }

            $validated = $request->validate([
                'id_municipalidad' => 'required|exists:municipalidades,id_municipalidad',
                'numero_oficio' => 'required|string|max:255',
                'fecha_envio' => 'required|date',
                'asunto' => 'required|string|max:255',
                'contenido' => 'required',
                'estado' => 'required|string|max:50'
            ]);

            // Verificar unicidad de número de oficio por municipalidad
            $exists = Oficio::where('numero_oficio', $validated['numero_oficio'])
                ->where('id_municipalidad', $validated['id_municipalidad'])
                ->where('id_oficio', '!=', $id)
                ->exists();

            if ($exists) {
                return response()->json([
                    'message' => 'Ya existe un oficio con este número para esta municipalidad'
                ], 422);
            }

            // Actualizar el usuario que modifica
            $validated['actualizado_por'] = 1;//Auth::id();

            $oficio->update($validated);
            
            return response()->json(
                $oficio->load(['municipalidad', 'creadoPor:id,name', 'actualizadoPor:id,name'])
            );
        } catch (\Exception $e) {
            Log::error('Error al actualizar oficio: ' . $e->getMessage());
            return response()->json(['message' => 'Error al actualizar el oficio', 'error' => $e->getMessage()], 500);
        }
    }

    public function destroy($id)
    {
        try {
            $oficio = Oficio::find($id);

            if (!$oficio) {
                return response()->json(['message' => 'Oficio no encontrado'], 404);
            }

            $oficio->delete();
            return response()->json(null, 204);
        } catch (\Exception $e) {
            Log::error('Error al eliminar oficio: ' . $e->getMessage());
            return response()->json(['message' => 'Error al eliminar el oficio', 'error' => $e->getMessage()], 500);
        }
    }

    public function porMunicipalidad($id_municipalidad)
    {
        try {
            $municipalidad = Municipalidad::find($id_municipalidad);

            if (!$municipalidad) {
                return response()->json(['message' => 'Municipalidad no encontrada'], 404);
            }

            $oficios = Oficio::with(['municipalidad', 'creadoPor:id,name', 'actualizadoPor:id,name'])
                ->where('id_municipalidad', $id_municipalidad)
                ->orderBy('fecha_envio', 'desc')
                ->get();

            return response()->json($oficios);
        } catch (\Exception $e) {
            Log::error('Error al obtener oficios por municipalidad: ' . $e->getMessage());
            return response()->json(['message' => 'Error al obtener los oficios', 'error' => $e->getMessage()], 500);
        }
    }

    public function porFecha(Request $request)
    {
        try {
            $validated = $request->validate([
                'fecha_inicio' => 'required|date',
                'fecha_fin' => 'required|date|after_or_equal:fecha_inicio'
            ]);

            $oficios = Oficio::with(['municipalidad', 'creadoPor:id,name', 'actualizadoPor:id,name'])
                ->whereBetween('fecha_envio', [$validated['fecha_inicio'], $validated['fecha_fin']])
                ->orderBy('fecha_envio', 'desc')
                ->get();

            return response()->json($oficios);
        } catch (\Exception $e) {
            Log::error('Error al obtener oficios por fecha: ' . $e->getMessage());
            return response()->json(['message' => 'Error al obtener los oficios', 'error' => $e->getMessage()], 500);
        }
    }
}
