<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\EstadoSeguimiento;
use App\Models\Evento;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class EstadoSeguimientoController extends Controller
{
    public function index()
    {
        $estados = EstadoSeguimiento::with([
                'evento', 
                'tipoReunion',
                'creadoPor:id,name', 
                'actualizadoPor:id,name'
            ])
            ->orderBy('fecha', 'desc')
            ->get();
        return response()->json($estados);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'id_evento' => 'required|exists:eventos,id_evento',
            'id_tipo_reunion' => 'required|exists:tipos_reunion,id_tipo_reunion',
            'fecha' => 'required|date',
            'estado' => 'required|string',
            'compromiso' => 'nullable|string'
        ]);

        // Agregar usuario actual como creador y actualizador
        $validated['creado_por'] = Auth::id();
        $validated['actualizado_por'] = Auth::id();

        $estado = EstadoSeguimiento::create($validated);
        
        return response()->json(
            $estado->load([
                'evento', 
                'tipoReunion',
                'creadoPor:id,name', 
                'actualizadoPor:id,name'
            ]), 
            201
        );
    }

    public function show($id)
    {
        $estado = EstadoSeguimiento::with([
                'evento', 
                'tipoReunion',
                'creadoPor:id,name', 
                'actualizadoPor:id,name'
            ])
            ->find($id);

        if (!$estado) {
            return response()->json(['message' => 'Estado de seguimiento no encontrado'], 404);
        }

        return response()->json($estado);
    }

    public function update(Request $request, $id)
    {
        $estado = EstadoSeguimiento::find($id);

        if (!$estado) {
            return response()->json(['message' => 'Estado de seguimiento no encontrado'], 404);
        }

        $validated = $request->validate([
            'id_evento' => 'required|exists:eventos,id_evento',
            'id_tipo_reunion' => 'required|exists:tipos_reunion,id_tipo_reunion',
            'fecha' => 'required|date',
            'estado' => 'required|string',
            'compromiso' => 'nullable|string'
        ]);

        // Actualizar el usuario que modifica
        $validated['actualizado_por'] = Auth::id();

        $estado->update($validated);
        
        return response()->json(
            $estado->load([
                'evento', 
                'tipoReunion',
                'creadoPor:id,name', 
                'actualizadoPor:id,name'
            ])
        );
    }

    public function destroy($id)
    {
        $estado = EstadoSeguimiento::find($id);

        if (!$estado) {
            return response()->json(['message' => 'Estado de seguimiento no encontrado'], 404);
        }

        $estado->delete();
        return response()->json(null, 204);
    }

    public function porEvento($id_evento)
    {
        $evento = Evento::find($id_evento);

        if (!$evento) {
            return response()->json(['message' => 'Evento no encontrado'], 404);
        }

        $estados = EstadoSeguimiento::with([
                'evento', 
                'tipoReunion',
                'creadoPor:id,name', 
                'actualizadoPor:id,name'
            ])
            ->where('id_evento', $id_evento)
            ->orderBy('fecha', 'desc')
            ->get();

        return response()->json($estados);
    }

    public function porFecha(Request $request)
    {
        $validated = $request->validate([
            'fecha_inicio' => 'required|date',
            'fecha_fin' => 'required|date|after_or_equal:fecha_inicio'
        ]);

        $estados = EstadoSeguimiento::with([
                'evento', 
                'tipoReunion',
                'creadoPor:id,name', 
                'actualizadoPor:id,name'
            ])
            ->whereBetween('fecha', [$validated['fecha_inicio'], $validated['fecha_fin']])
            ->orderBy('fecha', 'desc')
            ->get();

        return response()->json($estados);
    }
}
