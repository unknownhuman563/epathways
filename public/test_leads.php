<?php
require __DIR__.'/../vendor/autoload.php';
$app = require_once __DIR__.'/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$events = \App\Models\Event::withCount('leads')->get();
foreach($events as $e) {
    echo "ID: {$e->id} | CODE: {$e->event_code} | LEADS_COUNT: {$e->leads_count}\n";
}
