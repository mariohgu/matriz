<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class HelloController extends Controller
{
    public function index()
    {
        return response()->json(['message' => 'Hola desde Laravel'], 200);
    }
}
