<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AccommodationMessageTemplate extends Model
{
    protected $table = 'accommodation_message_templates';

    protected $fillable = ['title', 'content', 'notes'];
}
