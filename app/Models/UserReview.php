<?php

namespace App\Models;

use App\Traits\LogsActivity;
use Illuminate\Database\Eloquent\Model;

class UserReview extends Model
{
    use LogsActivity;

    protected $fillable = [
        'review_id',
        'name',
        'email',
        'mode',
        'answer_1',
        'answer_2',
        'answer_3',
        'paragraph',
        'rating',
        'status',
        'is_published',
        'is_featured',
        'visa_type',
    ];

    protected $casts = [
        'rating'       => 'integer',
        'is_published' => 'boolean',
        'is_featured'  => 'boolean',
    ];
}
