<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use App\Models\Lead;
use App\Models\User;
use App\Models\WorkTask;
use App\Support\Audit\ActivityLogger;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class DataImportController extends Controller
{
    public function index(Request $request): Response
    {
        return Inertia::render('imports/index', ['can' => [
            'customers' => $request->user()->can('create', Customer::class),
            'leads' => $request->user()->can('create', Lead::class),
            'tasks' => $request->user()->can('create', WorkTask::class),
        ]]);
    }

    public function customers(Request $request, ActivityLogger $logger): RedirectResponse
    {
        abort_unless($request->user()->can('create', Customer::class), 403);
        [$rows, $errors] = $this->rows($request, ['name']);
        $valid = [];
        $seenEmails = [];
        foreach ($rows as $line => $data) {
            $validator = Validator::make($data, ['name' => ['required', 'string', 'max:255'], 'business' => ['nullable', 'string', 'max:255'], 'email' => ['nullable', 'email', 'max:255'], 'phone' => ['nullable', 'string', 'max:40'], 'city' => ['nullable', 'string', 'max:120'], 'status' => ['nullable', 'in:active,inactive'], 'owner_email' => ['nullable', 'email']]);
            if ($validator->fails()) { $errors[] = "Row {$line}: ".implode(' ', $validator->errors()->all()); continue; }
            $email = filled($data['email'] ?? null) ? strtolower(trim((string) $data['email'])) : null;
            if ($email && (isset($seenEmails[$email]) || Customer::withTrashed()->where('email', $email)->exists())) { $errors[] = "Row {$line}: customer email {$email} already exists."; continue; }
            if ($email) $seenEmails[$email] = true;
            $valid[] = ['name' => trim((string) $data['name']), 'business' => $this->nullable($data['business'] ?? null), 'email' => $email, 'phone' => $this->nullable($data['phone'] ?? null), 'city' => $this->nullable($data['city'] ?? null), 'status' => $data['status'] ?: 'active', 'owner_id' => $this->ownerId($data['owner_email'] ?? null, $line, $errors)];
        }
        return $this->persist($valid, $errors, Customer::class, $logger, 'customers.imported', 'customers imported.');
    }

    public function leads(Request $request, ActivityLogger $logger): RedirectResponse
    {
        abort_unless($request->user()->can('create', Lead::class), 403);
        [$rows, $errors] = $this->rows($request, ['name']);
        $valid = [];
        $seenEmails = [];
        foreach ($rows as $line => $data) {
            $validator = Validator::make($data, ['name' => ['required', 'string', 'max:255'], 'business' => ['nullable', 'string', 'max:255'], 'email' => ['nullable', 'email', 'max:255'], 'phone' => ['nullable', 'string', 'max:40'], 'source' => ['nullable', 'string', 'max:80'], 'status' => ['nullable', 'string', 'max:32'], 'owner_email' => ['nullable', 'email']]);
            if ($validator->fails()) { $errors[] = "Row {$line}: ".implode(' ', $validator->errors()->all()); continue; }
            $email = filled($data['email'] ?? null) ? strtolower(trim((string) $data['email'])) : null;
            if ($email && (isset($seenEmails[$email]) || Lead::withTrashed()->where('email', $email)->exists())) { $errors[] = "Row {$line}: lead email {$email} already exists."; continue; }
            if ($email) $seenEmails[$email] = true;
            $valid[] = ['name' => trim((string) $data['name']), 'business' => $this->nullable($data['business'] ?? null), 'email' => $email, 'phone' => $this->nullable($data['phone'] ?? null), 'source' => $this->nullable($data['source'] ?? null), 'status' => $data['status'] ?: 'new', 'owner_id' => $this->ownerId($data['owner_email'] ?? null, $line, $errors)];
        }
        return $this->persist($valid, $errors, Lead::class, $logger, 'leads.imported', 'leads imported.');
    }

    public function tasks(Request $request, ActivityLogger $logger): RedirectResponse
    {
        abort_unless($request->user()->can('create', WorkTask::class), 403);
        [$rows, $errors] = $this->rows($request, ['title']);
        $valid = [];
        foreach ($rows as $line => $data) {
            $validator = Validator::make($data, ['title' => ['required', 'string', 'max:255'], 'priority' => ['nullable', 'in:low,normal,high,urgent'], 'status' => ['nullable', 'in:open,in_progress,completed,cancelled'], 'due_at' => ['nullable', 'date'], 'assigned_to_email' => ['nullable', 'email']]);
            if ($validator->fails()) { $errors[] = "Row {$line}: ".implode(' ', $validator->errors()->all()); continue; }
            $valid[] = ['task_number' => 'TSK-'.now()->format('Y').'-'.str_pad((string) (WorkTask::withTrashed()->max('id') + count($valid) + 1), 5, '0', STR_PAD_LEFT), 'title' => trim((string) $data['title']), 'priority' => $data['priority'] ?: 'normal', 'status' => $data['status'] ?: 'open', 'due_at' => $this->nullable($data['due_at'] ?? null), 'assigned_to_id' => $this->ownerId($data['assigned_to_email'] ?? null, $line, $errors)];
        }
        return $this->persist($valid, $errors, WorkTask::class, $logger, 'tasks.imported', 'tasks imported.');
    }

    /** @return array{0: array<int, array<string, string|null>>, 1: array<int, string>} */
    private function rows(Request $request, array $required): array
    {
        $file = $request->validate(['file' => ['required', 'file', 'mimes:csv,txt', 'max:10240']])['file'];
        $handle = fopen($file->getRealPath(), 'rb');
        $headers = $handle ? fgetcsv($handle) : false;
        if (! $handle || ! is_array($headers)) return [[], ['The CSV file could not be read.']];
        $headers = array_map(fn ($header) => Str::snake(ltrim(trim((string) $header), "\xEF\xBB\xBF")), $headers);
        $missing = array_values(array_diff($required, $headers));
        if ($missing !== []) { fclose($handle); return [[], ['Import requires: '.implode(', ', $missing).'.']]; }
        $rows = []; $errors = []; $line = 1;
        while (($values = fgetcsv($handle)) !== false) { $line++; if (count(array_filter($values, fn ($value) => trim((string) $value) !== '')) === 0) continue; $mapped = array_combine($headers, array_slice(array_pad($values, count($headers), null), 0, count($headers))); if ($mapped === false) { $errors[] = "Row {$line}: column count does not match the header."; continue; } $rows[$line] = $mapped; }
        fclose($handle);
        return [$rows, $errors];
    }

    private function ownerId(mixed $email, int $line, array &$errors): ?int
    {
        if (! filled($email)) return null;
        $id = User::query()->where('email', trim((string) $email))->value('id');
        if (! $id) $errors[] = "Row {$line}: assigned owner email was not found.";
        return $id;
    }

    private function nullable(mixed $value): ?string { return filled($value) ? trim((string) $value) : null; }

    private function persist(array $rows, array $errors, string $model, ActivityLogger $logger, string $event, string $message): RedirectResponse
    {
        if ($errors !== []) return back()->with('error', 'Import failed: '.implode(' ', array_slice($errors, 0, 3)).(count($errors) > 3 ? ' More rows need attention.' : ''));
        DB::transaction(fn () => collect($rows)->each(fn (array $row) => $model::create($row)));
        $logger->log($event, null, ucfirst($message), ['count' => count($rows)]);
        return back()->with('success', count($rows).' '. $message);
    }
}
