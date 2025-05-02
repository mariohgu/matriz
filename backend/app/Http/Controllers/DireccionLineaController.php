<?php

namespace App\Http\Controllers;

use App\Models\DireccionLinea;
use Illuminate\Http\Request;

class DireccionLineaController extends Controller
{
    public function index()
    {
        $direcciones = DireccionLinea::all();
        return response()->json($direcciones);
    }

    public function store(Request $request)
    {
        $request->validate([
            'descripcion' => 'required|string'
        ]);

        $direccion = DireccionLinea::create($request->all());
        return response()->json($direccion, 201);
    }

    public function show($id)
    {
        $direccion = DireccionLinea::findOrFail($id);
        return response()->json($direccion);
    }

    public function update(Request $request, $id)
    {
        $request->validate([
            'descripcion' => 'required|string'
        ]);

        $direccion = DireccionLinea::findOrFail($id);
        $direccion->update($request->all());
        return response()->json($direccion);
    }

    public function destroy($id)
    {
        $direccion = DireccionLinea::findOrFail($id);
        $direccion->delete();
        return response()->json(null, 204);
    }
} 