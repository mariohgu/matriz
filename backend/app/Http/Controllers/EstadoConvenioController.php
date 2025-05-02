<?php

namespace App\Http\Controllers;

use App\Models\EstadoConvenio;
use Illuminate\Http\Request;

class EstadoConvenioController extends Controller
{
    public function index()
    {
        $estados = EstadoConvenio::all();
        return response()->json($estados);
    }

    public function store(Request $request)
    {
        $request->validate([
            'descripcion' => 'required|string|max:100'
        ]);

        $estado = EstadoConvenio::create($request->all());
        return response()->json($estado, 201);
    }

    public function show($id)
    {
        $estado = EstadoConvenio::findOrFail($id);
        return response()->json($estado);
    }

    public function update(Request $request, $id)
    {
        $request->validate([
            'descripcion' => 'required|string|max:100'
        ]);

        $estado = EstadoConvenio::findOrFail($id);
        $estado->update($request->all());
        return response()->json($estado);
    }

    public function destroy($id)
    {
        $estado = EstadoConvenio::findOrFail($id);
        $estado->delete();
        return response()->json(null, 204);
    }
} 