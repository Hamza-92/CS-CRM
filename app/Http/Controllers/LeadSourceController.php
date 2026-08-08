<?php

namespace App\Http\Controllers;

use App\Models\Lead;
use App\Models\LeadSourceOption;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class LeadSourceController extends Controller
{
    public function index(Request $request): Response
    {
        $this->authorize($request);
        $search = $request->string('search')->toString();
        $status = in_array($request->string('status')->toString(), ['active', 'inactive'], true) ? $request->string('status')->toString() : '';
        $sources = LeadSourceOption::query()
            ->when($search !== '', fn ($query) => $query->where(fn ($q) => $q->where('name', 'like', "%{$search}%")->orWhere('description', 'like', "%{$search}%")))
            ->when($status !== '', fn ($query) => $query->where('status', $status))
            ->withCount('leads')
            ->orderBy('sort_order')->orderBy('name')
            ->paginate(12)->withQueryString();

        return Inertia::render('lead-settings/sources', ['sources' => $sources, 'filters' => ['search' => $search, 'status' => $status]]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->authorize($request);
        $data = $this->validated($request);
        $data['slug'] = $this->uniqueSlug($data['name']);
        $data['sort_order'] = (int) LeadSourceOption::max('sort_order') + 1;
        LeadSourceOption::create($data);

        return back()->with('success', "Lead source {$data['name']} created.");
    }

    public function update(Request $request, LeadSourceOption $leadSource): RedirectResponse
    {
        $this->authorize($request);
        $data = $this->validated($request);
        // Keep the stable slug so existing leads retain their source relation when the label is renamed.
        $data['slug'] = $leadSource->slug;
        $leadSource->update($data);

        return back()->with('success', "Lead source {$leadSource->name} updated.");
    }

    public function toggle(Request $request, LeadSourceOption $leadSource): RedirectResponse
    {
        $this->authorize($request);
        $leadSource->update(['status' => $leadSource->status === 'active' ? 'inactive' : 'active']);

        return back()->with('success', "Lead source {$leadSource->name} is now {$leadSource->status}.");
    }

    public function destroy(Request $request, LeadSourceOption $leadSource): RedirectResponse
    {
        $this->authorize($request);
        if (Lead::query()->where('source', $leadSource->slug)->exists()) return back()->with('error', 'This source is in use by leads and cannot be deleted.');
        $name = $leadSource->name;
        $leadSource->delete();

        return back()->with('success', "Lead source {$name} deleted.");
    }

    private function authorize(Request $request): void { abort_unless($request->user()?->can('leads.manage'), 403); }

    /** @return array<string, mixed> */
    private function validated(Request $request): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'max:80'],
            'description' => ['nullable', 'string', 'max:500'],
            'status' => ['required', Rule::in(['active', 'inactive'])],
        ]);
    }

    private function uniqueSlug(string $name, ?int $ignore = null): string
    {
        $base = Str::slug($name) ?: 'source';
        $slug = $base;
        $index = 2;
        while (LeadSourceOption::query()->where('slug', $slug)->when($ignore, fn ($query) => $query->where('id', '!=', $ignore))->exists()) $slug = "{$base}-".$index++;

        return $slug;
    }
}
