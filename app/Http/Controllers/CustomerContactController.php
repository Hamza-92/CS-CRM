<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use App\Models\CustomerContact;
use App\Support\Audit\ActivityLogger;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CustomerContactController extends Controller
{
    public function store(Request $request, Customer $customer): RedirectResponse
    {
        abort_unless($request->user()->can('update', $customer), 403);
        $data = $this->validated($request);
        DB::transaction(function () use ($customer, $data): void {
            if ($data['is_primary'] ?? false) CustomerContact::query()->where('customer_id', $customer->id)->update(['is_primary' => false]);
            CustomerContact::create(['customer_id' => $customer->id, ...$data]);
        });
        return back()->with('success', 'Contact added.');
    }

    public function update(Request $request, Customer $customer, CustomerContact $contact): RedirectResponse
    {
        abort_unless($request->user()->can('update', $customer) && $contact->customer_id === $customer->id, 403);
        $data = $this->validated($request);
        DB::transaction(function () use ($customer, $contact, $data): void {
            if ($data['is_primary'] ?? false) CustomerContact::query()->where('customer_id', $customer->id)->where('id', '!=', $contact->id)->update(['is_primary' => false]);
            $contact->update($data);
        });
        return back()->with('success', 'Contact updated.');
    }

    public function destroy(Customer $customer, CustomerContact $contact): RedirectResponse
    {
        abort_unless($contact->customer_id === $customer->id && request()->user()->can('update', $customer), 403);
        $contact->delete();
        return back()->with('success', 'Contact archived.');
    }

    private function validated(Request $request): array
    {
        return $request->validate(['name' => ['required', 'string', 'max:120'], 'job_title' => ['nullable', 'string', 'max:120'], 'email' => ['nullable', 'email', 'max:255'], 'phone' => ['nullable', 'string', 'max:32'], 'whatsapp' => ['nullable', 'string', 'max:32'], 'is_primary' => ['boolean'], 'notes' => ['nullable', 'string', 'max:3000']]);
    }
}
