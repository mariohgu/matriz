<?php

namespace App\Http\Controllers\Api;

use App\Models\EstadoConvenio;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;

class EstadoConvenioController extends Controller
{
    public function index()
    {
        $estados = EstadoConvenio::all();
        $estados = $estados->map(function($estado) {
            if (empty($estado->nombre)) {
                $estado->nombre = $estado->descripcion;
            }
            return $estado;
        });
        return response()->json($estados);
    }

    public function store(Request $request)
    {
        $request->validate([
            'descripcion' => 'required|string|max:100',
            'nombre' => 'nullable|string|max:100'
        ]);

        $data = $request->all();
        if (empty($data['nombre'])) {
            $data['nombre'] = $data['descripcion'];
        }

        $estado = EstadoConvenio::create($data);
        return response()->json($estado, 201);
    }

    public function show($id)
    {
        $estado = EstadoConvenio::findOrFail($id);
        if (empty($estado->nombre)) {
            $estado->nombre = $estado->descripcion;
        }
        return response()->json($estado);
    }

    public function update(Request $request, $id)
    {
        $request->validate([
            'descripcion' => 'required|string|max:100',
            'nombre' => 'nullable|string|max:100'
        ]);

        $estado = EstadoConvenio::findOrFail($id);
        $data = $request->all();
        if (empty($data['nombre'])) {
            $data['nombre'] = $data['descripcion'];
        }
        
        $estado->update($data);
        return response()->json($estado);
    }

    public function destroy($id)
    {
        $estado = EstadoConvenio::findOrFail($id);
        $estado->delete();
        return response()->json(null, 204);
    }
} 