<?php

namespace App\Models;

use App\Support\Audit\LogsActivity;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Model;

class CustomerContact extends Model
{
    use HasFactory, LogsActivity, SoftDeletes;

    protected $fillable = ['customer_id', 'name', 'job_title', 'email', 'phone', 'whatsapp', 'is_primary', 'notes'];

    protected function casts(): array { return ['is_primary' => 'boolean']; }
    public function customer(): BelongsTo { return $this->belongsTo(Customer::class); }
    public function activityDescription(string $event): ?string { return "Contact {$this->name} {$event}"; }
}
