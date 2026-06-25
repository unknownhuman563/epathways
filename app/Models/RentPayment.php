<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RentPayment extends Model
{
    protected $table = 'accommodation_rent_payments';

    protected $fillable = ['tenant_id', 'week_start', 'amount_nzd'];

    protected $casts = [
        'week_start' => 'date',
        'amount_nzd' => 'decimal:2',
    ];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }
}
