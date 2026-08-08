<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreProductRequest;
use App\Http\Requests\UpdateProductRequest;
use App\Models\Plan;
use App\Models\Product;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Role;

class ProductController extends Controller
{
    private const SORTABLE = ['name', 'code', 'is_active', 'created_at'];

    public function index(Request $request): Response
    {
        Gate::authorize('viewAny', Product::class);

        $sort = $request->string('sort', 'name')->toString();
        $sort = in_array($sort, self::SORTABLE, true) ? $sort : 'name';
        $direction = $request->string('direction', 'asc')->toString() === 'desc' ? 'desc' : 'asc';

        $products = Product::query()
            ->with(['technicalOwner:id,name', 'supportRole:id,name'])
            ->withCount('plans')
            ->search($request->string('search')->toString())
            ->when(
                $request->filled('status'),
                fn ($query) => $query->where('is_active', $request->string('status')->toString() === 'active'),
            )
            ->when($request->boolean('archived'), fn ($query) => $query->onlyTrashed())
            ->orderBy($sort, $direction)
            ->paginate($request->integer('per_page', 15))
            ->withQueryString();

        return Inertia::render('products/index', [
            'products' => $products,
            'filters' => [
                'search' => $request->string('search')->toString(),
                'status' => $request->string('status')->toString(),
                'archived' => $request->boolean('archived'),
                'sort' => $sort,
                'direction' => $direction,
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

        $product->load(['technicalOwner:id,name', 'supportRole:id,name']);

        return Inertia::render('products/show', [
            'product' => $product,
            'plans' => $product->plans()->get(),
            'activities' => $product->activities()->with('user:id,name')->limit(20)->get(),
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
        return User::query()->active()->orderBy('name')->get(['id', 'name']);
    }

    /**
     * @return Collection<int, Role>
     */
    protected function roles(): Collection
    {
        return Role::query()->orderBy('name')->get(['id', 'name']);
    }
}
