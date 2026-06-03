<?php

use App\Models\Property;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('accommodation_properties', function (Blueprint $table) {
            $table->string('slug')->nullable()->unique()->after('name');
        });

        // Backfill slugs for existing rows (saveQuietly skips model events).
        Property::whereNull('slug')->get()->each(function (Property $p) {
            $base = Str::slug($p->name) ?: 'property';
            $slug = $base;
            $i = 1;
            while (Property::where('slug', $slug)->where('id', '!=', $p->id)->exists()) {
                $slug = $base.'-'.(++$i);
            }
            $p->slug = $slug;
            $p->saveQuietly();
        });
    }

    public function down(): void
    {
        Schema::table('accommodation_properties', function (Blueprint $table) {
            $table->dropColumn('slug');
        });
    }
};
