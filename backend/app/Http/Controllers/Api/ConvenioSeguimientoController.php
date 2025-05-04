<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ConvenioSeguimiento;
use App\Models\Convenio;
use App\Models\EstadoConvenio;
use Illuminate\Http\Request;

class ConvenioSeguimientoController extends Controller
{
    public function index()
    {
        $seguimientos = ConvenioSeguimiento::with(['convenio', 'estadoConvenio'])->get();
        return response()->json($seguimientos);
    }

    public function store(Request $request)
    {
        $request->validate([
            'id_convenio' => 'required|exists:convenios,id_convenio',
            'fecha' => 'required|date',
            'id_estado_convenio' => 'required|exists:estados_convenios,id_estado_convenio',
            'comentarios' => 'nullable|string',
            'acciones_realizadas' => 'nullable|string',
            'alertas_identificadas' => 'nullable|string',
            'acciones_desarrollar' => 'nullable|string',
            'fecha_seguimiento' => 'nullable|date'
        ]);

        $seguimiento = ConvenioSeguimiento::create($request->all());
        return response()->json($seguimiento->load(['convenio', 'estadoConvenio']), 201);
    }

    public function show($id)
    {
        $seguimiento = ConvenioSeguimiento::with(['convenio', 'estadoConvenio'])->findOrFail($id);
        return response()->json($seguimiento);
    }

    public function update(Request $request, $id)
    {
        $request->validate([
            'id_convenio' => 'exists:convenios,id_convenio',
            'fecha' => 'date',
            'id_estado_convenio' => 'exists:estados_convenios,id_estado_convenio',
            'comentarios' => 'nullable|string',
            'acciones_realizadas' => 'nullable|string',
            'alertas_identificadas' => 'nullable|string',
            'acciones_desarrollar' => 'nullable|string',
            'fecha_seguimiento' => 'nullable|date'
        ]);

        $seguimiento = ConvenioSeguimiento::findOrFail($id);
        $seguimiento->update($request->all());
        return response()->json($seguimiento->load(['convenio', 'estadoConvenio']));
    }

    public function destroy($id)
    {
        $seguimiento = ConvenioSeguimiento::findOrFail($id);
        $seguimiento->delete();
        return response()->json(null, 204);
    }

    public function porConvenio($idConvenio)
    {
        $seguimientos = ConvenioSeguimiento::with(['convenio', 'estadoConvenio'])
            ->where('id_convenio', $idConvenio)
            ->get();
        return response()->json($seguimientos);
    }
} 