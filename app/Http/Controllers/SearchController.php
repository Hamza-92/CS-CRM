<?php

namespace App\Http\Controllers;

use App\Enums\Permission;
use App\Models\ApplicationInstance;
use App\Models\Customer;
use App\Models\Deal;
use App\Models\Lead;
use App\Models\Payment;
use App\Models\Product;
use App\Models\Subscription;
use App\Models\SupportTicket;
use App\Models\WorkTask;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SearchController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        $term = trim($request->string('q')->toString());

        if (mb_strlen($term) < 2) {
            return response()->json(['results' => []]);
        }

        $user = $request->user();
        $can = static fn (Permission $permission): bool => $user->can($permission->value);
        $results = collect();
        $limit = 3;

        if ($can(Permission::ViewCustomers)) {
            $results = $results->merge(Customer::query()->search($term)->latest()->limit($limit)->get(['id', 'name', 'business', 'email'])->map(fn (Customer $customer): array => [
                'type' => 'Customer', 'icon' => 'customer', 'label' => $customer->business ?: $customer->name,
                'meta' => $customer->business && $customer->name !== $customer->business ? $customer->name : ($customer->email ?: 'Customer'),
                'href' => "/customers/{$customer->id}",
            ]));
        }

        if ($can(Permission::ViewLeads)) {
            $results = $results->merge(Lead::query()->search($term)->latest()->limit($limit)->get(['id', 'name', 'business', 'email'])->map(fn (Lead $lead): array => [
                'type' => 'Lead', 'icon' => 'lead', 'label' => $lead->name,
                'meta' => $lead->business ?: ($lead->email ?: 'Lead'), 'href' => "/leads/{$lead->id}",
            ]));
        }

        if ($can(Permission::ViewDeals)) {
            $results = $results->merge(Deal::query()->search($term)->with(['customer:id,name,business', 'lead:id,name'])->latest()->limit($limit)->get(['id', 'title', 'customer_id', 'lead_id'])->map(fn (Deal $deal): array => [
                'type' => 'Deal', 'icon' => 'deal', 'label' => $deal->title,
                'meta' => $deal->customer?->business ?: ($deal->customer?->name ?: ($deal->lead?->name ?: 'Deal')), 'href' => "/deals/{$deal->id}",
            ]));
        }

        if ($can(Permission::ViewProducts)) {
            $results = $results->merge(Product::query()->search($term)->latest()->limit($limit)->get(['id', 'name', 'code'])->map(fn (Product $product): array => [
                'type' => 'Product', 'icon' => 'product', 'label' => $product->name,
                'meta' => $product->code ?: 'Product', 'href' => "/products/{$product->id}",
            ]));
        }

        if ($can(Permission::ViewInstances)) {
            $results = $results->merge(ApplicationInstance::query()->search($term)->with(['customer:id,name,business'])->latest()->limit($limit)->get(['id', 'name', 'customer_id'])->map(fn (ApplicationInstance $instance): array => [
                'type' => 'Instance', 'icon' => 'instance', 'label' => $instance->name,
                'meta' => $instance->customer?->business ?: ($instance->customer?->name ?: 'Application instance'), 'href' => "/instances/{$instance->id}",
            ]));
        }

        if ($can(Permission::ViewSubscriptions)) {
            $results = $results->merge(Subscription::query()->search($term)->with('applicationInstance:id,name')->latest()->limit($limit)->get(['id', 'application_instance_id', 'external_reference', 'status'])->map(fn (Subscription $subscription): array => [
                'type' => 'Subscription', 'icon' => 'subscription', 'label' => $subscription->external_reference ?: "Subscription #{$subscription->id}",
                'meta' => $subscription->applicationInstance?->name ?: ucfirst(str_replace('_', ' ', $subscription->status)), 'href' => "/subscriptions/{$subscription->id}",
            ]));
        }

        if ($can(Permission::ViewSupportTickets)) {
            $results = $results->merge(SupportTicket::query()->search($term)->latest()->limit($limit)->get(['id', 'ticket_number', 'subject'])->map(fn (SupportTicket $ticket): array => [
                'type' => 'Ticket', 'icon' => 'ticket', 'label' => $ticket->subject,
                'meta' => $ticket->ticket_number, 'href' => "/support-tickets/{$ticket->id}",
            ]));
        }

        if ($can(Permission::ViewTasks)) {
            $results = $results->merge(WorkTask::query()->search($term)->latest()->limit($limit)->get(['id', 'task_number', 'title'])->map(fn (WorkTask $task): array => [
                'type' => 'Task', 'icon' => 'task', 'label' => $task->title,
                'meta' => $task->task_number, 'href' => "/tasks/{$task->id}",
            ]));
        }

        return response()->json(['results' => $results->take(12)->values()->all()]);
    }
}
