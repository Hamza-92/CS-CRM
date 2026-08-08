<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\LoginHistoryController;
use App\Http\Controllers\PlanController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\RoleController;
use App\Http\Controllers\UserController;
use Illuminate\Support\Facades\Route;

Route::redirect('/', '/users')->name('home');

Route::middleware('auth')->group(function () {
    Route::redirect('dashboard', '/users')->name('dashboard');

    Route::get('profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::put('profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::put('profile/password', [ProfileController::class, 'updatePassword'])->name('profile.password');

    Route::get('users', [UserController::class, 'index'])->name('users.index');
    Route::get('products', [ProductController::class, 'index'])->name('products.index');
    Route::get('products/archived', [ProductController::class, 'archived'])->name('products.archived');
    Route::get('products/create', [ProductController::class, 'create'])->name('products.create');
    Route::post('products', [ProductController::class, 'store'])->name('products.store');
    Route::get('products/{product}', [ProductController::class, 'show'])->withTrashed()->name('products.show');
    Route::get('products/{product}/edit', [ProductController::class, 'edit'])->withTrashed()->name('products.edit');
    Route::put('products/{product}', [ProductController::class, 'update'])->withTrashed()->name('products.update');
    Route::delete('products/{product}', [ProductController::class, 'destroy'])->withTrashed()->name('products.destroy');
    Route::patch('products/{product}/restore', [ProductController::class, 'restore'])->withTrashed()->name('products.restore');
    Route::get('products/{product}/plans', [PlanController::class, 'index'])->withTrashed()->name('products.plans.index');
    Route::get('products/{product}/plans/create', [PlanController::class, 'create'])->withTrashed()->name('products.plans.create');
    Route::post('products/{product}/plans', [PlanController::class, 'store'])->withTrashed()->name('products.plans.store');
    Route::get('plans/{plan}/edit', [PlanController::class, 'edit'])->name('plans.edit');
    Route::put('plans/{plan}', [PlanController::class, 'update'])->name('plans.update');
    Route::delete('plans/{plan}', [PlanController::class, 'destroy'])->name('plans.destroy');
    Route::get('roles', [RoleController::class, 'index'])->name('roles.index');
    Route::get('roles/create', [RoleController::class, 'create'])->name('roles.create');
    Route::get('roles/{role}/edit', [RoleController::class, 'edit'])->name('roles.edit');
    Route::post('roles', [RoleController::class, 'store'])->name('roles.store');
    Route::put('roles/{role}', [RoleController::class, 'update'])->name('roles.update');
    Route::delete('roles/{role}', [RoleController::class, 'destroy'])->name('roles.destroy');
    Route::get('login-history', LoginHistoryController::class)->name('login-history.index');
    Route::post('users', [UserController::class, 'store'])->name('users.store');
    Route::put('users/{user}', [UserController::class, 'update'])->name('users.update');
    Route::delete('users/{user}', [UserController::class, 'destroy'])->name('users.destroy');
    Route::put('users/{user}/password', [UserController::class, 'resetPassword'])->name('users.password');
    Route::patch('users/{user}/status', [UserController::class, 'toggleStatus'])->name('users.status');

});
