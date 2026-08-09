<?php

namespace App\Http\Requests;

use App\Models\WorkTask;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreWorkTaskRequest extends FormRequest
{
    public function authorize(): bool { return $this->user()->can('create', WorkTask::class); }
    public function rules(): array { return ['customer_id' => ['nullable', 'integer', Rule::exists('customers', 'id')->whereNull('deleted_at')], 'lead_id' => ['nullable', 'integer', Rule::exists('leads', 'id')->whereNull('deleted_at')], 'product_id' => ['nullable', 'integer', Rule::exists('products', 'id')->whereNull('deleted_at')], 'application_instance_id' => ['nullable', 'integer', Rule::exists('application_instances', 'id')->whereNull('deleted_at')], 'support_ticket_id' => ['nullable', 'integer', Rule::exists('support_tickets', 'id')->whereNull('deleted_at')], 'assigned_to_id' => ['nullable', 'integer', Rule::exists('users', 'id')->whereNull('deleted_at')], 'title' => ['required', 'string', 'max:180'], 'description' => ['nullable', 'string', 'max:20000'], 'priority' => ['required', Rule::in(WorkTask::PRIORITIES)], 'status' => ['required', Rule::in(WorkTask::STATUSES)], 'due_at' => ['nullable', 'date']]; }
}
