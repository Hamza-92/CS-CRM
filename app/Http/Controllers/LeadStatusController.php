<?php

namespace App\Http\Controllers;

use App\Models\Lead;
use App\Models\LeadStatusOption;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class LeadStatusController extends Controller
{
    public function index(Request $request): Response
    {
        $this->authorize($request);
        $search = $request->string('search')->toString();
        $status = in_array($request->string('status')->toString(), ['active', 'inactive'], true) ? $request->string('status')->toString() : '';
        $statuses = LeadStatusOption::query()
            ->when($search !== '', fn ($query) => $query->where(fn ($q) => $q->where('name', 'like', "%{$search}%")->orWhere('description', 'like', "%{$search}%")))
            ->when($status !== '', fn ($query) => $query->where('status', $status))
            ->withCount('leads')
            ->orderBy('sort_order')->orderBy('name')
            ->paginate(12)->withQueryString();

        return Inertia::render('lead-settings/statuses', ['statuses' => $statuses, 'filters' => ['search' => $search, 'status' => $status]]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->authorize($request);
        $data = $this->validated($request);
        $data['slug'] = $this->uniqueSlug($data['name']);
        $data['sort_order'] = (int) LeadStatusOption::max('sort_order') + 1;
        LeadStatusOption::create($data);

        return back()->with('success', "Lead status {$data['name']} created.");
    }

    public function update(Request $request, LeadStatusOption $leadStatus): RedirectResponse
    {
        $this->authorize($request);
        $data = $this->validated($request);
        // Keep the stable slug so existing leads retain their status relation when the label is renamed.
        $data['slug'] = $leadStatus->slug;
        $leadStatus->update($data);

        return back()->with('success', "Lead status {$leadStatus->name} updated.");
    }

    public function toggle(Request $request, LeadStatusOption $leadStatus): RedirectResponse
    {
        $this->authorize($request);
        $oldStatus = $leadStatus->status;
        $leadStatus->update(['status' => $leadStatus->status === 'active' ? 'inactive' : 'active']);
        $leadStatus->recordActivity('status_changed', [
            'old' => ['status' => $oldStatus],
            'new' => ['status' => $leadStatus->status],
        ]);

        return back()->with('success', "Lead status {$leadStatus->name} is now {$leadStatus->status}.");
    }

    public function destroy(Request $request, LeadStatusOption $leadStatus): RedirectResponse
    {
        $this->authorize($request);
        if (Lead::query()->where('status', $leadStatus->slug)->exists()) return back()->with('error', 'This status is in use by leads and cannot be deleted.');
        $name = $leadStatus->name;
        $leadStatus->delete();

        return back()->with('success', "Lead status {$name} deleted.");
    }

    private function authorize(Request $request): void
    {
        abort_unless($request->user()?->can('leads.manage'), 403);
    }

    /** @return array<string, mixed> */
    private function validated(Request $request): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'max:80'],
            'description' => ['nullable', 'string', 'max:500'],
            'color' => ['required', 'regex:/^#[A-Fa-f0-9]{6}$/'],
            'status' => ['required', Rule::in(['active', 'inactive'])],
        ]);
    }

    private function uniqueSlug(string $name, ?int $ignore = null): string
    {
        $base = Str::slug($name) ?: 'status';
        $slug = $base;
        $index = 2;
        while (LeadStatusOption::query()->where('slug', $slug)->when($ignore, fn ($query) => $query->where('id', '!=', $ignore))->exists()) $slug = "{$base}-".$index++;

        return $slug;
    }
}
