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
            'ubigeo' => 'required|string|max:10|unique:municipalidades',
            'nombre' => 'required|string',
            'departamento' => 'required|string|max:50',
            'provincia' => 'required|string|max:50',
            'distrito' => 'required|string|max:50',
        ]);

        $municipalidad = Municipalidad::create($validated);
        return response()->json($municipalidad, 201);
    }

    public function show(Municipalidad $municipalidad)
    {
        return response()->json($municipalidad);
    }

    public function update(Request $request, Municipalidad $municipalidad)
    {
        $validated = $request->validate([
            'ubigeo' => ['required', 'string', 'max:10', Rule::unique('municipalidades')->ignore($municipalidad->id_municipalidad, 'id_municipalidad')],
            'nombre' => 'required|string',
            'departamento' => 'required|string|max:50',
            'provincia' => 'required|string|max:50',
            'distrito' => 'required|string|max:50',
        ]);

        $municipalidad->update($validated);
        return response()->json($municipalidad);
    }

    public function destroy(Municipalidad $municipalidad)
    {
        $municipalidad->delete();
        return response()->json(null, 204);
    }
}
