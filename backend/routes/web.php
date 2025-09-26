<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

// Route de fallback pour éviter l'erreur "Route [login] not defined"
Route::get('/login', function () {
    return response()->json([
        'message' => 'This is an API application. Please use the API endpoints for authentication.',
        'login_endpoint' => '/api/auth/login'
    ], 200);
})->name('login');
