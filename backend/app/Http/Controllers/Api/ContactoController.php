<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Contacto;
use App\Models\Municipalidad;
use Illuminate\Http\Request;

class ContactoController extends Controller
{
    public function index()
    {
        $contactos = Contacto::with('municipalidad')->get();
        return response()->json($contactos);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'id_municipalidad' => 'required|exists:municipalidades,id_municipalidad',
            'nombre_completo' => 'required|string',
            'cargo' => 'required|string',
            'telefono' => 'nullable|string|max:20',
            'email' => 'nullable|email|max:100',
        ]);

        $contacto = Contacto::create($validated);
        return response()->json($contacto->load('municipalidad'), 201);
    }

    public function show($id)
    {
        $contacto = Contacto::with('municipalidad')
            ->where('id_contacto', $id)
            ->first();

        if (!$contacto) {
            return response()->json(['message' => 'Contacto no encontrado'], 404);
        }

        return response()->json($contacto);
    }

    public function update(Request $request, $id)
    {
        $contacto = Contacto::find($id);

        if (!$contacto) {
            return response()->json(['message' => 'Contacto no encontrado'], 404);
        }

        $validated = $request->validate([
            'id_municipalidad' => 'required|exists:municipalidades,id_municipalidad',
            'nombre_completo' => 'required|string',
            'cargo' => 'required|string',
            'telefono' => 'nullable|string|max:20',
            'email' => 'nullable|email|max:100',
        ]);

        $contacto->update($validated);
        return response()->json($contacto->load('municipalidad'));
    }

    public function destroy($id)
    {
        $contacto = Contacto::where('id_contacto', $id)->first();

        if (!$contacto) {
            return response()->json(['message' => 'Contacto no encontrado'], 404);
        }

        $contacto->delete();
        return response()->json(null, 204);
    }

    // Método adicional para obtener contactos por municipalidad
    public function porMunicipalidad($id_municipalidad)
    {
        $contactos = Contacto::with('municipalidad')
            ->where('id_municipalidad', $id_municipalidad)
            ->get();

        return response()->json($contactos);
    }
}
