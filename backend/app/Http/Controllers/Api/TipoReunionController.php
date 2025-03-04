<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\TipoReunion;
use Illuminate\Http\Request;

class TipoReunionController extends Controller
{
    public function index()
    {
        $tiposReunion = TipoReunion::orderBy('descripcion')->get();
        return response()->json($tiposReunion);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'descripcion' => 'required|string|unique:tipos_reunion,descripcion'
        ]);

        $tipoReunion = TipoReunion::create($validated);
        return response()->json($tipoReunion, 201);
    }

    public function show($id)
    {
        $tipoReunion = TipoReunion::find($id);

        if (!$tipoReunion) {
            return response()->json(['message' => 'Tipo de reunión no encontrado'], 404);
        }

        return response()->json($tipoReunion);
    }

    public function update(Request $request, $id)
    {
        $tipoReunion = TipoReunion::find($id);

        if (!$tipoReunion) {
            return response()->json(['message' => 'Tipo de reunión no encontrado'], 404);
        }

        $validated = $request->validate([
            'descripcion' => 'required|string|unique:tipos_reunion,descripcion,' . $id . ',id_tipo_reunion'
        ]);

        $tipoReunion->update($validated);
        return response()->json($tipoReunion);
    }

    public function destroy($id)
    {
        $tipoReunion = TipoReunion::where('id_tipo_reunion', $id)->first();

        if (!$tipoReunion) {
            return response()->json(['message' => 'Tipo de reunión no encontrado'], 404);
        }

        // Aquí podrías agregar una verificación si hay reuniones que usan este tipo
        // antes de permitir su eliminación

        $tipoReunion->delete();
        return response()->json(null, 204);
    }
}
