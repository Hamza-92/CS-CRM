<?php

namespace App\Http\Controllers;

use App\Models\Activity;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class ActivityController extends Controller
{
    public function __invoke(Request $request): Response
    {
        Gate::authorize('viewAny', Activity::class);

        $activities = Activity::query()
            ->with('user:id,name')
            ->when(
                $request->filled('event'),
                fn ($query) => $query->where('event', 'like', $request->string('event')->toString().'%'),
            )
            ->when(
                $request->filled('user_id'),
                fn ($query) => $query->where('user_id', $request->integer('user_id')),
            )
            ->when(
                $request->filled('from'),
                fn ($query) => $query->whereDate('created_at', '>=', $request->date('from')),
            )
            ->when(
                $request->filled('to'),
                fn ($query) => $query->whereDate('created_at', '<=', $request->date('to')),
            )
            ->latest('created_at')
            ->paginate($request->integer('per_page', 25))
            ->withQueryString();

        return Inertia::render('activity/index', [
            'activities' => $activities,
            'eventPrefixes' => Activity::query()
                ->selectRaw('substring_index(event, ".", 1) as prefix')
                ->distinct()
                ->orderBy('prefix')
                ->pluck('prefix'),
            'filters' => [
                'event' => $request->string('event')->toString(),
                'user_id' => $request->string('user_id')->toString(),
                'from' => $request->string('from')->toString(),
                'to' => $request->string('to')->toString(),
            ],
        ]);
    }
}
