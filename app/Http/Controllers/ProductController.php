<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreProductRequest;
use App\Http\Requests\UpdateProductRequest;
use App\Models\Plan;
use App\Models\Product;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Role;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ProductController extends Controller
{
    private const SORTABLE = ['name', 'code', 'is_active', 'created_at', 'deleted_at'];

    public function index(Request $request): Response
    {
        return $this->listing($request, false);
    }

    public function archived(Request $request): Response
    {
        return $this->listing($request, true);
    }

    public function export(Request $request): StreamedResponse
    {
        Gate::authorize('viewAny', Product::class);

        $archived = $request->boolean('archived');
        $products = Product::query()
            ->with(['technicalOwner:id,name,email,avatar_path', 'supportRole:id,name'])
            ->search($request->string('search')->toString())
            ->when(
                ! $archived && in_array($request->string('status')->toString(), ['active', 'inactive'], true),
                fn ($query) => $query->where('is_active', $request->string('status')->toString() === 'active'),
            )
            ->when($archived, fn ($query) => $query->onlyTrashed())
            ->orderBy('name')
            ->get();

        $filename = $archived ? 'archived-products.csv' : 'products.csv';

        return response()->streamDownload(function () use ($products): void {
            $handle = fopen('php://output', 'wb');
            fputcsv($handle, ['name', 'code', 'brand_color', 'description', 'is_active', 'technical_owner_email', 'support_role', 'default_trial_days', 'demo_notes']);

            foreach ($products as $product) {
                fputcsv($handle, [
                    $product->name,
                    $product->code,
                    $product->brand_color,
                    $product->description,
                    $product->is_active ? 'true' : 'false',
                    $product->technicalOwner?->email,
                    $product->supportRole?->name,
                    $product->default_trial_days,
                    $product->demo_notes,
                ]);
            }

            fclose($handle);
        }, $filename, ['Content-Type' => 'text/csv; charset=UTF-8']);
    }

    public function import(Request $request): RedirectResponse
    {
        Gate::authorize('create', Product::class);

        $file = $request->validate([
            'file' => ['required', 'file', 'mimes:csv,txt', 'max:10240'],
        ])['file'];

        $handle = fopen($file->getRealPath(), 'rb');
        $headers = $handle ? fgetcsv($handle) : false;

        if (! $handle || ! is_array($headers)) {
            return back()->with('error', 'The CSV file could not be read.');
        }

        $headers = array_map(fn ($header) => Str::snake(ltrim(trim((string) $header), "\xEF\xBB\xBF")), $headers);
        $required = ['name', 'code'];
        $missing = array_values(array_diff($required, $headers));

        if ($missing !== []) {
            fclose($handle);

            return back()->with('error', 'Import requires these columns: '.implode(', ', $missing).'.');
        }

        $rows = [];
        $errors = [];
        $seenCodes = [];
        $line = 1;

        while (($values = fgetcsv($handle)) !== false) {
            $line++;
            if (count(array_filter($values, fn ($value) => trim((string) $value) !== '')) === 0) {
                continue;
            }

            $mappedValues = array_slice(array_pad($values, count($headers), null), 0, count($headers));
            $mapped = array_combine($headers, $mappedValues);

            if ($mapped === false) {
                $errors[] = "Row {$line}: the number of columns does not match the header.";
                continue;
            }

            $data = array_replace(array_fill_keys($headers, null), $mapped);
            $code = strtoupper(trim((string) ($data['code'] ?? '')));

            $validator = Validator::make($data, [
                'name' => ['required', 'string', 'max:255'],
                'code' => ['required', 'string', 'max:32', 'regex:/^[A-Za-z0-9\-_]+$/'],
                'brand_color' => ['nullable', 'string', 'regex:/^#[A-Fa-f0-9]{6}$/'],
                'description' => ['nullable', 'string', 'max:5000'],
                'default_trial_days' => ['nullable', 'integer', 'min:1', 'max:365'],
                'demo_notes' => ['nullable', 'string', 'max:5000'],
            ]);

            if ($validator->fails()) {
                $errors[] = "Row {$line}: ".implode(' ', $validator->errors()->all());
                continue;
            }

            if (isset($seenCodes[$code]) || Product::withTrashed()->where('code', $code)->exists()) {
                $errors[] = "Row {$line}: product code {$code} already exists.";
                continue;
            }

            $ownerId = null;
            if (filled($data['technical_owner_email'] ?? null)) {
                $ownerId = User::query()->where('email', trim((string) $data['technical_owner_email']))->value('id');
                if (! $ownerId) {
                    $errors[] = "Row {$line}: technical owner email was not found.";
                    continue;
                }
            }

            $supportRoleId = null;
            if (filled($data['support_role'] ?? null)) {
                $supportRoleId = Role::query()->where('name', trim((string) $data['support_role']))->value('id');
                if (! $supportRoleId) {
                    $errors[] = "Row {$line}: support role was not found.";
                    continue;
                }
            }

            $seenCodes[$code] = true;
            $rows[] = [
                'name' => trim((string) $data['name']),
                'code' => $code,
                'brand_color' => filled($data['brand_color'] ?? null) ? strtoupper(trim((string) $data['brand_color'])) : null,
                'description' => filled($data['description'] ?? null) ? trim((string) $data['description']) : null,
                'is_active' => ! in_array(strtolower(trim((string) ($data['is_active'] ?? 'true'))), ['0', 'false', 'no', 'inactive'], true),
                'technical_owner_id' => $ownerId,
                'support_role_id' => $supportRoleId,
                'default_trial_days' => filled($data['default_trial_days'] ?? null) ? (int) $data['default_trial_days'] : null,
                'demo_notes' => filled($data['demo_notes'] ?? null) ? trim((string) $data['demo_notes']) : null,
            ];
        }

        fclose($handle);

        if ($errors !== []) {
            return back()->with('error', 'Import failed: '.implode(' ', array_slice($errors, 0, 3)).(count($errors) > 3 ? ' More rows need attention.' : ''));
        }

        DB::transaction(fn () => collect($rows)->each(fn (array $row) => Product::create($row)));

        return back()->with('success', count($rows).' product'.(count($rows) === 1 ? '' : 's').' imported.');
    }

    private function listing(Request $request, bool $archived): Response
    {
        Gate::authorize('viewAny', Product::class);

        $sort = $request->string('sort', 'name')->toString();
        $sort = in_array($sort, self::SORTABLE, true) ? $sort : 'name';
        $direction = $request->string('direction', 'asc')->toString() === 'desc' ? 'desc' : 'asc';
        $perPage = in_array($request->integer('per_page', 10), [10, 25, 50, 100], true)
            ? $request->integer('per_page', 10)
            : 10;
        $status = ! $archived && in_array($request->string('status')->toString(), ['active', 'inactive'], true)
            ? $request->string('status')->toString()
            : '';

        $products = Product::query()
            ->with(['technicalOwner:id,name,avatar_path', 'supportRole:id,name'])
            ->withCount('plans')
            ->search($request->string('search')->toString())
            ->when(
                $status !== '',
                fn ($query) => $query->where('is_active', $status === 'active'),
            )
            ->when($archived, fn ($query) => $query->onlyTrashed())
            ->orderBy($sort, $direction)
            ->paginate($perPage)
            ->withQueryString();

        return Inertia::render($archived ? 'products/archived' : 'products/index', [
            'products' => $products,
            'filters' => [
                'search' => $request->string('search')->toString(),
                'sort' => $sort,
                'direction' => $direction,
                'per_page' => $perPage,
                ...(! $archived ? ['status' => $status] : []),
            ],
        ]);
    }

    public function create(): Response
    {
        Gate::authorize('create', Product::class);

        return Inertia::render('products/create', [
            'owners' => $this->owners(),
            'roles' => $this->roles(),
        ]);
    }

    public function store(StoreProductRequest $request): RedirectResponse
    {
        $product = Product::create($request->validated());

        return redirect()
            ->route('products.show', $product)
            ->with('success', "Product {$product->name} created.");
    }

    public function show(Request $request, Product $product): Response
    {
        Gate::authorize('view', $product);

        $product->load(['technicalOwner:id,name,avatar_path', 'supportRole:id,name']);

        return Inertia::render('products/show', [
            'product' => $product,
            'plans' => $product->plans()->get(),
            'activities' => $product->activities()->with('user:id,name,avatar_path')->limit(20)->get(),
            'can' => [
                'update' => $request->user()->can('update', $product),
                'delete' => $request->user()->can('delete', $product),
                'managePlans' => $request->user()->can('create', Plan::class),
                'viewPricing' => $request->user()->can('viewPricing', Plan::class),
            ],
        ]);
    }

    public function edit(Product $product): Response
    {
        Gate::authorize('update', $product);

        return Inertia::render('products/edit', [
            'product' => $product,
            'owners' => $this->owners(),
            'roles' => $this->roles(),
        ]);
    }

    public function update(UpdateProductRequest $request, Product $product): RedirectResponse
    {
        $product->update($request->validated());

        return redirect()
            ->route('products.show', $product)
            ->with('success', "Product {$product->name} updated.");
    }

    public function destroy(Product $product): RedirectResponse
    {
        Gate::authorize('delete', $product);

        $product->delete();

        return redirect()
            ->route('products.index')
            ->with('success', "Product {$product->name} archived.");
    }

    public function restore(Product $product): RedirectResponse
    {
        Gate::authorize('restore', $product);

        $product->restore();

        return redirect()
            ->route('products.show', $product)
            ->with('success', "Product {$product->name} restored.");
    }

    /**
     * @return Collection<int, User>
     */
    protected function owners(): Collection
    {
        return User::query()->active()->orderBy('name')->get(['id', 'name', 'avatar_path']);
    }

    /**
     * @return Collection<int, Role>
     */
    protected function roles(): Collection
    {
        return Role::query()->orderBy('name')->get(['id', 'name']);
    }
}
