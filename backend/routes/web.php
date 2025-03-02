<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

Route::get('/webtest', function () {
    return response()->json(['message' => 'Web route is working!']);
});
