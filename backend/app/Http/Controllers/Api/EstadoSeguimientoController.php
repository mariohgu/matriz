<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\EstadoSeguimiento;
use App\Models\Evento;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class EstadoSeguimientoController extends Controller
{
    public function index()
    {
        $estados = EstadoSeguimiento::with(['evento', 'contacto', 'tipoReunion', 'creadoPor:id,name', 'actualizadoPor:id,name'])
            ->orderBy('fecha', 'desc')
            ->get();
        return response()->json($estados);
    }

    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'id_evento' => 'required|exists:eventos,id_evento',
                'id_contacto' => 'required|exists:contactos,id_contacto',
                'id_tipo_reunion' => 'required|exists:tipos_reunion,id_tipo_reunion',
                'fecha' => 'required|date',
                'estado' => 'required',
                'compromiso' => 'nullable',
            ]);

            // Agregar usuario actual como creador y actualizador
            $validated['creado_por'] = 1;//Auth::id();
            $validated['actualizado_por'] = 1;//Auth::id();

            $estado = EstadoSeguimiento::create($validated);
            
            return response()->json(
                $estado->load(['evento', 'contacto', 'tipoReunion', 'creadoPor:id,name', 'actualizadoPor:id,name']), 
                201
            );
        } catch (\Exception $e) {
            Log::error('Error al crear estado de seguimiento: ' . $e->getMessage());
            return response()->json(['message' => 'Error al crear el estado de seguimiento', 'error' => $e->getMessage()], 500);
        }
    }

    public function show($id)
    {
        try {
            $estado = EstadoSeguimiento::with(['evento', 'contacto', 'tipoReunion', 'creadoPor:id,name', 'actualizadoPor:id,name'])
                ->find($id);

            if (!$estado) {
                return response()->json(['message' => 'Estado de seguimiento no encontrado'], 404);
            }

            return response()->json($estado);
        } catch (\Exception $e) {
            Log::error('Error al obtener estado de seguimiento: ' . $e->getMessage());
            return response()->json(['message' => 'Error al obtener el estado de seguimiento', 'error' => $e->getMessage()], 500);
        }
    }

    public function update(Request $request, $id)
    {
        try {
            $estado = EstadoSeguimiento::find($id);

            if (!$estado) {
                return response()->json(['message' => 'Estado de seguimiento no encontrado'], 404);
            }

            $validated = $request->validate([
                'id_evento' => 'required|exists:eventos,id_evento',
                'id_contacto' => 'required|exists:contactos,id_contacto',
                'id_tipo_reunion' => 'required|exists:tipos_reunion,id_tipo_reunion',
                'fecha' => 'required|date',
                'estado' => 'required',
                'compromiso' => 'nullable',
            ]);

            // Actualizar el usuario que modifica
            $validated['actualizado_por'] = 1;//Auth::id();

            $estado->update($validated);
            
            return response()->json(
                $estado->load(['evento', 'contacto', 'tipoReunion', 'creadoPor:id,name', 'actualizadoPor:id,name'])
            );
        } catch (\Exception $e) {
            Log::error('Error al actualizar estado de seguimiento: ' . $e->getMessage());
            return response()->json(['message' => 'Error al actualizar el estado de seguimiento', 'error' => $e->getMessage()], 500);
        }
    }

    public function destroy($id)
    {
        try {
            $estado = EstadoSeguimiento::where('id_estado_seguimiento', $id)->first();

            if (!$estado) {
                return response()->json(['message' => 'Estado de seguimiento no encontrado'], 404);
            }

            $estado->delete();
            return response()->json(null, 204);
        } catch (\Exception $e) {
            Log::error('Error al eliminar estado de seguimiento: ' . $e->getMessage());
            return response()->json(['message' => 'Error al eliminar el estado de seguimiento', 'error' => $e->getMessage()], 500);
        }
    }

    public function porEvento($id_evento)
    {
        try {
            $evento = Evento::find($id_evento);

            if (!$evento) {
                return response()->json(['message' => 'Evento no encontrado'], 404);
            }

            $estados = EstadoSeguimiento::with(['evento', 'contacto', 'tipoReunion', 'creadoPor:id,name', 'actualizadoPor:id,name'])
                ->where('id_evento', $id_evento)
                ->orderBy('fecha', 'desc')
                ->get();

            return response()->json($estados);
        } catch (\Exception $e) {
            Log::error('Error al obtener estados de seguimiento por evento: ' . $e->getMessage());
            return response()->json(['message' => 'Error al obtener los estados de seguimiento', 'error' => $e->getMessage()], 500);
        }
    }

    public function porFecha(Request $request)
    {
        try {
            $validated = $request->validate([
                'fecha_inicio' => 'required|date',
                'fecha_fin' => 'required|date|after_or_equal:fecha_inicio'
            ]);

            $estados = EstadoSeguimiento::with(['evento', 'contacto', 'tipoReunion', 'creadoPor:id,name', 'actualizadoPor:id,name'])
                ->whereBetween('fecha', [$validated['fecha_inicio'], $validated['fecha_fin']])
                ->orderBy('fecha', 'desc')
                ->get();

            return response()->json($estados);
        } catch (\Exception $e) {
            Log::error('Error al obtener estados de seguimiento por fecha: ' . $e->getMessage());
            return response()->json(['message' => 'Error al obtener los estados de seguimiento', 'error' => $e->getMessage()], 500);
        }
    }
}
