<?php

namespace App\Http\Requests;

// Same rules as creating — property_id stays required (it may keep its current
// value). Custom lifecycle transitions (notice/vacate/renew/move) have their own
// requests, so current_status is still just an optional in:STATUSES here.
class UpdateTenantRequest extends StoreTenantRequest
{
}
