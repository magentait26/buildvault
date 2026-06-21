<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return response()->json([
        'app' => 'BuildVault Standalone API',
        'version' => '12.0.0',
        'status' => 'online'
    ]);
});
