<?php

namespace App\Http\Requests;

use App\Models\SupportTicket;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreSupportTicketRequest extends FormRequest
{
    public function authorize(): bool { return $this->user()->can('create', SupportTicket::class); }
    public function rules(): array
    {
        return [
            'customer_id' => ['required', 'integer', Rule::exists('customers', 'id')->whereNull('deleted_at')],
            'application_instance_id' => ['nullable', 'integer', Rule::exists('application_instances', 'id')->whereNull('deleted_at')],
            'assigned_to_id' => ['nullable', 'integer', Rule::exists('users', 'id')->whereNull('deleted_at')],
            'subject' => ['required', 'string', 'max:180'], 'description' => ['required', 'string', 'max:20000'],
            'category' => ['required', Rule::in(SupportTicket::CATEGORIES)], 'priority' => ['required', Rule::in(SupportTicket::PRIORITIES)], 'status' => ['required', Rule::in(SupportTicket::STATUSES)],
            'due_at' => ['nullable', 'date'], 'resolution_notes' => ['nullable', 'string', 'max:5000'],
        ];
    }
}
