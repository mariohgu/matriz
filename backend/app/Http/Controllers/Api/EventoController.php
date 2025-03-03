<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Evento;
use App\Models\Municipalidad;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class EventoController extends Controller
{
    public function index()
    {
        $eventos = Evento::with(['municipalidad', 'contacto', 'creadoPor:id,name', 'actualizadoPor:id,name'])
            ->orderBy('fecha', 'desc')
            ->get();
        return response()->json($eventos);
    }

    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'id_municipalidad' => 'required|exists:municipalidades,id_municipalidad',
                'id_contacto' => 'required|exists:contactos,id_contacto',
                'tipo_acercamiento' => 'required',
                'lugar' => 'required',
                'fecha' => 'required|date',
            ]);

            // Agregar usuario actual como creador y actualizador
            $validated['creado_por'] = 1;//Auth::id();
            $validated['actualizado_por'] = 1;//Auth::id();

            $evento = Evento::create($validated);
            
            return response()->json(
                $evento->load(['municipalidad', 'contacto', 'creadoPor:id,name', 'actualizadoPor:id,name']), 
                201
            );
        } catch (\Exception $e) {
            Log::error('Error al crear evento: ' . $e->getMessage());
            return response()->json(['message' => 'Error al crear el evento', 'error' => $e->getMessage()], 500);
        }
    }

    public function show($id)
    {
        $evento = Evento::with(['municipalidad', 'contacto', 'creadoPor:id,name', 'actualizadoPor:id,name'])
            ->find($id);

        if (!$evento) {
            return response()->json(['message' => 'Evento no encontrado'], 404);
        }

        return response()->json($evento);
    }

    public function update(Request $request, $id)
    {
        try {
            $evento = Evento::find($id);

            if (!$evento) {
                return response()->json(['message' => 'Evento no encontrado'], 404);
            }

            $validated = $request->validate([
                'id_municipalidad' => 'required|exists:municipalidades,id_municipalidad',
                'id_contacto' => 'required|exists:contactos,id_contacto',
                'tipo_acercamiento' => 'required',
                'lugar' => 'required',
                'fecha' => 'required|date',
            ]);

            // Actualizar el usuario que modifica
            $validated['actualizado_por'] = 1;//Auth::id();

            $evento->update($validated);
            
            return response()->json(
                $evento->load(['municipalidad', 'contacto', 'creadoPor:id,name', 'actualizadoPor:id,name'])
            );
        } catch (\Exception $e) {
            Log::error('Error al actualizar evento: ' . $e->getMessage());
            return response()->json(['message' => 'Error al actualizar el evento', 'error' => $e->getMessage()], 500);
        }
    }

    public function destroy($id)
    {
        try {
            $evento = Evento::find($id);

            if (!$evento) {
                return response()->json(['message' => 'Evento no encontrado'], 404);
            }

            $evento->delete();
            return response()->json(null, 204);
        } catch (\Exception $e) {
            Log::error('Error al eliminar evento: ' . $e->getMessage());
            return response()->json(['message' => 'Error al eliminar el evento', 'error' => $e->getMessage()], 500);
        }
    }

    public function porMunicipalidad($id_municipalidad)
    {
        $municipalidad = Municipalidad::find($id_municipalidad);

        if (!$municipalidad) {
            return response()->json(['message' => 'Municipalidad no encontrada'], 404);
        }

        $eventos = Evento::with(['municipalidad', 'contacto', 'creadoPor:id,name', 'actualizadoPor:id,name'])
            ->where('id_municipalidad', $id_municipalidad)
            ->orderBy('fecha', 'desc')
            ->get();

        return response()->json($eventos);
    }

    public function porFecha(Request $request)
    {
        try {
            $validated = $request->validate([
                'fecha_inicio' => 'required|date',
                'fecha_fin' => 'required|date|after_or_equal:fecha_inicio'
            ]);

            $eventos = Evento::with(['municipalidad', 'contacto', 'creadoPor:id,name', 'actualizadoPor:id,name'])
                ->whereBetween('fecha', [$validated['fecha_inicio'], $validated['fecha_fin']])
                ->orderBy('fecha', 'desc')
                ->get();

            return response()->json($eventos);
        } catch (\Exception $e) {
            Log::error('Error al obtener eventos por fecha: ' . $e->getMessage());
            return response()->json(['message' => 'Error al obtener los eventos', 'error' => $e->getMessage()], 500);
        }
    }
}
