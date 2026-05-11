<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class UserReview extends Model
{
    protected $fillable = [
        'review_id',
        'name',
        'email',
        'mode',
        'answer_1',
        'answer_2',
        'answer_3',
        'paragraph',
        'status',
    ];
}
