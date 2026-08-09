<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use App\Models\Lead;
use App\Models\WorkTask;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

class DataExportController extends Controller
{
    public function customers(Request $request): StreamedResponse
    {
        abort_unless($request->user()->can('viewAny', Customer::class), 403);
        $query = Customer::query()->with('owner:id,name')->when($request->filled('search'), fn ($q) => $q->search($request->string('search')->toString()))->when(in_array($request->string('status')->toString(), ['active', 'inactive'], true), fn ($q) => $q->where('status', $request->string('status')->toString()));

        return $this->download('customers', ['ID', 'Name', 'Business', 'Email', 'Phone', 'City', 'Status', 'Owner', 'Created at'], $query->get()->map(fn (Customer $customer): array => [$customer->id, $customer->name, $customer->business, $customer->email, $customer->phone, $customer->city, $customer->status, $customer->owner?->name, $customer->created_at?->toDateTimeString()])->all());
    }

    public function leads(Request $request): StreamedResponse
    {
        abort_unless($request->user()->can('viewAny', Lead::class), 403);
        $query = Lead::query()->with('owner:id,name')->when($request->filled('search'), fn ($q) => $q->search($request->string('search')->toString()))->when($request->filled('status'), fn ($q) => $q->where('status', $request->string('status')->toString()));

        return $this->download('leads', ['ID', 'Name', 'Business', 'Email', 'Phone', 'Source', 'Status', 'Owner', 'Next follow-up', 'Created at'], $query->get()->map(fn (Lead $lead): array => [$lead->id, $lead->name, $lead->business, $lead->email, $lead->phone, $lead->source, $lead->status, $lead->owner?->name, $lead->next_follow_up_at?->toDateTimeString(), $lead->created_at?->toDateTimeString()])->all());
    }

    public function tasks(Request $request): StreamedResponse
    {
        abort_unless($request->user()->can('viewAny', WorkTask::class), 403);
        $query = WorkTask::query()->with('assignedTo:id,name')->when($request->filled('search'), fn ($q) => $q->search($request->string('search')->toString()))->when(in_array($request->string('status')->toString(), WorkTask::STATUSES, true), fn ($q) => $q->where('status', $request->string('status')->toString()));

        return $this->download('tasks', ['ID', 'Task number', 'Title', 'Priority', 'Status', 'Due date', 'Assigned to', 'Created at'], $query->get()->map(fn (WorkTask $task): array => [$task->id, $task->task_number, $task->title, $task->priority, $task->status, $task->due_at?->toDateString(), $task->assignedTo?->name, $task->created_at?->toDateTimeString()])->all());
    }

    private function download(string $name, array $headers, array $rows): StreamedResponse
    {
        return response()->streamDownload(function () use ($headers, $rows): void {
            $handle = fopen('php://output', 'wb');
            fputcsv($handle, $headers);
            foreach ($rows as $row) fputcsv($handle, $row);
            fclose($handle);
        }, "{$name}-".now()->format('Y-m-d').'.csv', ['Content-Type' => 'text/csv; charset=UTF-8']);
    }
}
