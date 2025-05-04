<?php

namespace App\Http\Controllers\Api;

use App\Models\Sector;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;

class SectorController extends Controller
{
    public function index()
    {
        $sectores = Sector::all();
        return response()->json($sectores);
    }

    public function store(Request $request)
    {
        $request->validate([
            'descripcion' => 'required|string'
        ]);

        $sector = Sector::create($request->all());
        return response()->json($sector, 201);
    }

    public function show($id)
    {
        $sector = Sector::findOrFail($id);
        return response()->json($sector);
    }

    public function update(Request $request, $id)
    {
        $request->validate([
            'descripcion' => 'required|string'
        ]);

        $sector = Sector::findOrFail($id);
        $sector->update($request->all());
        return response()->json($sector);
    }

    public function destroy($id)
    {
        $sector = Sector::findOrFail($id);
        $sector->delete();
        return response()->json(null, 204);
    }
} 