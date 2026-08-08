<?php

use App\Http\Controllers\ActivityController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\PlanController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\UserController;
use Illuminate\Support\Facades\Route;

Route::redirect('/', '/dashboard')->name('home');

Route::middleware('auth')->group(function () {
    Route::get('dashboard', DashboardController::class)->name('dashboard');

    Route::get('profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::put('profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::put('profile/password', [ProfileController::class, 'updatePassword'])->name('profile.password');

    Route::resource('products', ProductController::class);
    Route::patch('products/{product}/restore', [ProductController::class, 'restore'])
        ->withTrashed()
        ->name('products.restore');

    Route::resource('products.plans', PlanController::class)->shallow()->except(['show']);

    Route::get('users', [UserController::class, 'index'])->name('users.index');
    Route::post('users', [UserController::class, 'store'])->name('users.store');
    Route::put('users/{user}', [UserController::class, 'update'])->name('users.update');
    Route::delete('users/{user}', [UserController::class, 'destroy'])->name('users.destroy');
    Route::put('users/{user}/password', [UserController::class, 'resetPassword'])->name('users.password');
    Route::patch('users/{user}/status', [UserController::class, 'toggleStatus'])->name('users.status');

    Route::get('activity', ActivityController::class)->name('activity.index');
});
