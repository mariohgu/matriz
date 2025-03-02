<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Evento;
use App\Models\Municipalidad;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class EventoController extends Controller
{
    public function index()
    {
        $eventos = Evento::with(['municipalidad', 'creadoPor:id,name', 'actualizadoPor:id,name'])
            ->orderBy('fecha', 'desc')
            ->get();
        return response()->json($eventos);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'id_municipalidad' => 'required|exists:municipalidades,id_municipalidad',
            'tipo_acercamiento' => 'required|string',
            'lugar' => 'required|string',
            'fecha' => 'required|date',
        ]);

        // Agregar usuario actual como creador y actualizador
        $validated['creado_por'] = Auth::id();
        $validated['actualizado_por'] = Auth::id();

        $evento = Evento::create($validated);
        
        return response()->json(
            $evento->load(['municipalidad', 'creadoPor:id,name', 'actualizadoPor:id,name']), 
            201
        );
    }

    public function show($id)
    {
        $evento = Evento::with(['municipalidad', 'creadoPor:id,name', 'actualizadoPor:id,name'])
            ->find($id);

        if (!$evento) {
            return response()->json(['message' => 'Evento no encontrado'], 404);
        }

        return response()->json($evento);
    }

    public function update(Request $request, $id)
    {
        $evento = Evento::find($id);

        if (!$evento) {
            return response()->json(['message' => 'Evento no encontrado'], 404);
        }

        $validated = $request->validate([
            'id_municipalidad' => 'required|exists:municipalidades,id_municipalidad',
            'tipo_acercamiento' => 'required|string',
            'lugar' => 'required|string',
            'fecha' => 'required|date',
        ]);

        // Actualizar el usuario que modifica
        $validated['actualizado_por'] = Auth::id();

        $evento->update($validated);
        
        return response()->json(
            $evento->load(['municipalidad', 'creadoPor:id,name', 'actualizadoPor:id,name'])
        );
    }

    public function destroy($id)
    {
        $evento = Evento::find($id);

        if (!$evento) {
            return response()->json(['message' => 'Evento no encontrado'], 404);
        }

        $evento->delete();
        return response()->json(null, 204);
    }

    public function porMunicipalidad($id_municipalidad)
    {
        $municipalidad = Municipalidad::find($id_municipalidad);

        if (!$municipalidad) {
            return response()->json(['message' => 'Municipalidad no encontrada'], 404);
        }

        $eventos = Evento::with(['municipalidad', 'creadoPor:id,name', 'actualizadoPor:id,name'])
            ->where('id_municipalidad', $id_municipalidad)
            ->orderBy('fecha', 'desc')
            ->get();

        return response()->json($eventos);
    }

    public function porFecha(Request $request)
    {
        $validated = $request->validate([
            'fecha_inicio' => 'required|date',
            'fecha_fin' => 'required|date|after_or_equal:fecha_inicio'
        ]);

        $eventos = Evento::with(['municipalidad', 'creadoPor:id,name', 'actualizadoPor:id,name'])
            ->whereBetween('fecha', [$validated['fecha_inicio'], $validated['fecha_fin']])
            ->orderBy('fecha', 'desc')
            ->get();

        return response()->json($eventos);
    }
}
