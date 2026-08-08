<?php

namespace App\Http\Controllers;

use App\Enums\Permission;
use App\Models\DealStage;
use App\Support\Audit\ActivityLogger;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class DealStageController extends Controller
{
    public function index(Request $request): Response
    {
        $this->authorizeManage($request);

        return Inertia::render('deal-stages/index', [
            'stages' => DealStage::query()->withCount('deals')->orderBy('sort_order')->orderBy('name')->get(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->authorizeManage($request);
        $data = $this->validated($request);
        if ($data['is_won'] && $data['is_lost']) return back()->with('error', 'A stage cannot be both won and lost.');
        if ($response = $this->terminalStageConflict($data)) return $response;
        $data['slug'] = $this->uniqueSlug($data['name']);
        $data['sort_order'] = (int) DealStage::max('sort_order') + 10;
        DealStage::create($data);

        return back()->with('success', "Deal stage {$data['name']} created.");
    }

    public function update(Request $request, DealStage $dealStage): RedirectResponse
    {
        $this->authorizeManage($request);
        $data = $this->validated($request);
        if ($data['is_won'] && $data['is_lost']) return back()->with('error', 'A stage cannot be both won and lost.');
        if ($response = $this->terminalStageConflict($data, $dealStage->id)) return $response;
        $dealStage->update([...$data, 'slug' => $dealStage->slug]);

        return back()->with('success', "Deal stage {$dealStage->name} updated.");
    }

    public function toggle(Request $request, DealStage $dealStage): RedirectResponse
    {
        $this->authorizeManage($request);
        $old = $dealStage->status;
        $dealStage->update(['status' => $old === 'active' ? 'inactive' : 'active']);
        $dealStage->recordActivity('status_changed', ['old' => ['status' => $old], 'new' => ['status' => $dealStage->status]]);

        return back()->with('success', "Deal stage {$dealStage->name} is now {$dealStage->status}.");
    }

    public function reorder(Request $request, ActivityLogger $logger): RedirectResponse
    {
        $this->authorizeManage($request);
        $ids = $request->validate(['ordered_ids' => ['required', 'array'], 'ordered_ids.*' => ['integer', 'distinct', 'exists:deal_stages,id']])['ordered_ids'];
        foreach ($ids as $index => $id) DealStage::query()->whereKey($id)->update(['sort_order' => ($index + 1) * 10]);
        $logger->log('deal_stage.reordered', null, 'Deal stages reordered', ['ordered_ids' => $ids]);

        return back()->with('success', 'Deal stages reordered.');
    }

    public function destroy(Request $request, DealStage $dealStage): RedirectResponse
    {
        $this->authorizeManage($request);
        if ($dealStage->deals()->withTrashed()->exists()) return back()->with('error', 'This stage is in use and cannot be deleted.');
        $name = $dealStage->name;
        $dealStage->delete();

        return back()->with('success', "Deal stage {$name} deleted.");
    }

    private function authorizeManage(Request $request): void
    {
        abort_unless($request->user()?->can(Permission::ManageDealStages->value) || $request->user()?->can(Permission::ManageDeals->value), 403);
    }

    private function validated(Request $request): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'max:80'],
            'color' => ['required', 'regex:/^#[A-Fa-f0-9]{6}$/'],
            'probability' => ['required', 'integer', 'min:0', 'max:100'],
            'status' => ['required', Rule::in(['active', 'inactive'])],
            'is_won' => ['required', 'boolean'],
            'is_lost' => ['required', 'boolean'],
        ]);
    }

    private function terminalStageConflict(array $data, ?int $ignore = null): ?RedirectResponse
    {
        foreach (['is_won' => 'won', 'is_lost' => 'lost'] as $field => $label) {
            if (($data[$field] ?? false) && DealStage::query()->where($field, true)->when($ignore, fn ($query) => $query->where('id', '!=', $ignore))->exists()) {
                return back()->with('error', "Only one {$label} stage can be configured.");
            }
        }

        return null;
    }

    private function uniqueSlug(string $name): string
    {
        $base = Str::slug($name) ?: 'stage';
        $slug = $base;
        $index = 2;
        while (DealStage::query()->where('slug', $slug)->exists()) $slug = "{$base}-".$index++;
        return $slug;
    }
}
