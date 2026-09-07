<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * One configured message on an email-automation event. Events are defined in
 * EmailEventRegistry (code); these rows are the admin-editable "who gets what".
 */
class EmailAutomationMessage extends Model
{
    protected $fillable = [
        'event_key', 'recipient', 'template_key', 'channel', 'delay_minutes', 'enabled', 'cc_agent', 'sort_order',
    ];

    protected $casts = [
        'enabled'       => 'boolean',
        'cc_agent'      => 'boolean',
        'delay_minutes' => 'integer',
        'sort_order'    => 'integer',
    ];
}
