<?php

namespace App\Http\Requests;

use App\Models\Deal;

class UpdateDealRequest extends StoreDealRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('update', $this->route('deal') ?? Deal::class);
    }
}
