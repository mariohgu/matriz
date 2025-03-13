<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Estado;
use Illuminate\Http\Request;

class EstadoController extends Controller
{
    public function index()
    {
        $estados = Estado::orderBy('descripcion')->get();
        return response()->json($estados);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'descripcion' => 'required|string|unique:estados,descripcion'
        ]);

        $estado = Estado::create($validated);
        return response()->json($estado, 201);
    }

    public function show($id)
    {
        $estado = Estado::find($id);

        if (!$estado) {
            return response()->json(['message' => 'Estado no encontrado'], 404);
        }

        return response()->json($estado);
    }

    public function update(Request $request, $id)
    {
        $estado = Estado::find($id);

        if (!$estado) {
            return response()->json(['message' => 'Estado no encontrado'], 404);
        }

        $validated = $request->validate([
            'descripcion' => 'required|string|unique:estados,descripcion,' . $id . ',id_estado'
        ]);

        $estado->update($validated);
        return response()->json($estado);
    }

    public function destroy($id)
    {
        $estado = Estado::where('id_estado', $id)->first();

        if (!$estado) {
            return response()->json(['message' => 'Estado no encontrado'], 404);
        }

        // Aquí podrías agregar una verificación si hay registros que usan este estado
        // antes de permitir su eliminación

        $estado->delete();
        return response()->json(null, 204);
    }
}
