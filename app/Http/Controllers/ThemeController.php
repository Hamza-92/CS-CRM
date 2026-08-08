<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ThemeController extends Controller
{
    public function update(Request $request): RedirectResponse
    {
        $theme = $request->validate([
            'theme' => ['required', Rule::in(['light', 'dark'])],
        ])['theme'];

        $request->session()->put('theme', $theme);

        return back();
    }
}
