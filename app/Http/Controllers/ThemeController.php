<?php

namespace App\Http\Controllers;

use App\Support\Audit\ActivityLogger;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ThemeController extends Controller
{
    public function update(Request $request, ActivityLogger $logger): RedirectResponse
    {
        $theme = $request->validate([
            'theme' => ['required', Rule::in(['light', 'dark'])],
        ])['theme'];

        $oldTheme = $request->session()->get('theme', 'light');
        $request->session()->put('theme', $theme);

        if ($oldTheme !== $theme) {
            $logger->log('theme.changed', null, 'Theme preference changed', [
                'old' => ['theme' => $oldTheme],
                'new' => ['theme' => $theme],
            ]);
        }

        return back();
    }
}
