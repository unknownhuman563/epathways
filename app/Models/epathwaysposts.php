<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class epathwaysposts extends Model
{

    protected $fillable = ['ancmnts_title', 'ancmnts_content', 'ancmnts_image', 'ancmnts_size'];


    /** @use HasFactory<\Database\Factories\EpathwayspostsFactory> */
    use HasFactory;
}
