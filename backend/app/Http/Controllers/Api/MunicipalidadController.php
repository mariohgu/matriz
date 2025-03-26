<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Municipalidad;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class MunicipalidadController extends Controller
{
    public function index()
    {
        $municipalidades = Municipalidad::all();
        return response()->json($municipalidades);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'ubigeo' => 'required|string|max:6|unique:municipalidades',
            'nombre' => 'required|string',
            'departamento' => 'required|string|max:50',
            'provincia' => 'required|string|max:50',
            'distrito' => 'required|string|max:50',
            'region' => 'required|string|max:50',
            'region_natural' => 'required|string|max:50',
            'nivel' => 'nullable|string|max:30',
            'X' => 'nullable|numeric',
            'Y' => 'nullable|numeric',
        ]);

        $municipalidad = Municipalidad::create($validated);
        return response()->json($municipalidad, 201);
    }

    public function show($id)
    {
        $municipalidad = Municipalidad::where('id_municipalidad', $id)->first();

        if (!$municipalidad) {
            return response()->json(['message' => 'Municipalidad no encontrada'], 404);
        }

        return response()->json($municipalidad);
    }

    public function update(Request $request, $id)
    {
        $municipalidad = Municipalidad::where('id_municipalidad', $id)->first();

        if (!$municipalidad) {
            return response()->json(['message' => 'Municipalidad no encontrada'], 404);
        }

        $validated = $request->validate([
            'ubigeo' => ['required', 'string', 'max:10', Rule::unique('municipalidades')->ignore($municipalidad->id_municipalidad, 'id_municipalidad')],
            'nombre' => 'required|string',
            'departamento' => 'required|string|max:50',
            'provincia' => 'required|string|max:50',
            'distrito' => 'required|string|max:50',
            'region' => 'required|string|max:50',
            'region_natural' => 'required|string|max:50',
            'nivel' => 'nullable|string|max:30',
            'X' => 'nullable|numeric',
            'Y' => 'nullable|numeric',
        ]);

        $municipalidad->update($validated);
        return response()->json($municipalidad);
    }

    public function destroy($id)
    {
        $municipalidad = Municipalidad::where('id_municipalidad', $id)->first();
        
        if (!$municipalidad) {
            return response()->json(['message' => 'Municipalidad no encontrada'], 404);
        }

        $municipalidad->delete();
        return response()->json(null, 204);
    }
}
