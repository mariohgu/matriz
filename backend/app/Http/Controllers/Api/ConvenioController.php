<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Convenio;
use App\Models\EstadoConvenio;
use App\Models\Sector;
use App\Models\DireccionLinea;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ConvenioController extends Controller
{
    public function index()
    {
        $convenios = Convenio::with(['municipalidad', 'estadoConvenio', 'sector', 'direccionLinea'])->get();
        return response()->json($convenios);
    }

    public function store(Request $request)
    {
        $request->validate([
            'id_municipalidad' => 'required|exists:municipalidades,id_municipalidad',
            'tipo_convenio' => 'required|string|max:100',
            'monto' => 'required|numeric|min:0',
            'fecha_firma' => 'required|date',
            'id_estado_convenio' => 'required|exists:estados_convenios,id_estado_convenio',
            'descripcion' => 'nullable|string',
            'codigo_convenio' => 'nullable|string|max:20',
            'codigo_idea_cui' => 'nullable|integer|digits:7',
            'descripcion_idea_cui' => 'nullable|string|max:250',
            'beneficiarios' => 'nullable|integer|min:0',
            'codigo_interno' => 'required|string|max:20',
            'id_sector' => 'required|exists:sector,id_sector',
            'id_direccion_linea' => 'required|exists:direccion_linea,id_direccion_linea'
        ]);

        $data = $request->all();
        $data['creado_por'] = Auth::id();
        $data['actualizado_por'] = Auth::id();

        $convenio = Convenio::create($data);
        return response()->json($convenio->load(['municipalidad', 'estadoConvenio', 'sector', 'direccionLinea']), 201);
    }

    public function show($id)
    {
        $convenio = Convenio::with(['municipalidad', 'estadoConvenio', 'sector', 'direccionLinea'])->findOrFail($id);
        return response()->json($convenio);
    }

    public function update(Request $request, $id)
    {
        $request->validate([
            'id_municipalidad' => 'exists:municipalidades,id_municipalidad',
            'tipo_convenio' => 'string|max:100',
            'monto' => 'numeric|min:0',
            'fecha_firma' => 'date',
            'id_estado_convenio' => 'exists:estados_convenios,id_estado_convenio',
            'descripcion' => 'nullable|string',
            'codigo_convenio' => 'nullable|string|max:20',
            'codigo_idea_cui' => 'nullable|integer|digits:7',
            'descripcion_idea_cui' => 'nullable|string|max:250',
            'beneficiarios' => 'nullable|integer|min:0',
            'codigo_interno' => 'string|max:20',
            'id_sector' => 'exists:sector,id_sector',
            'id_direccion_linea' => 'exists:direccion_linea,id_direccion_linea'
        ]);

        $convenio = Convenio::findOrFail($id);
        $data = $request->all();
        $data['actualizado_por'] = Auth::id();

        $convenio->update($data);
        return response()->json($convenio->load(['municipalidad', 'estadoConvenio', 'sector', 'direccionLinea']));
    }

    public function destroy($id)
    {
        $convenio = Convenio::findOrFail($id);
        $convenio->delete();
        return response()->json(null, 204);
    }
} 