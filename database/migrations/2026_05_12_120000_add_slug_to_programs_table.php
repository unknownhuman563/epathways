<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('programs', function (Blueprint $table) {
            $table->string('slug')->nullable()->after('title');
        });

        foreach (DB::table('programs')->orderBy('id')->get() as $program) {
            $base = Str::slug($program->title) ?: 'program';
            $slug = $base;
            $i = 2;
            while (DB::table('programs')
                ->where('slug', $slug)
                ->where('id', '!=', $program->id)
                ->exists()
            ) {
                $slug = $base.'-'.$i;
                $i++;
            }
            DB::table('programs')->where('id', $program->id)->update(['slug' => $slug]);
        }

        Schema::table('programs', function (Blueprint $table) {
            $table->unique('slug');
        });
    }

    public function down(): void
    {
        Schema::table('programs', function (Blueprint $table) {
            $table->dropUnique(['slug']);
            $table->dropColumn('slug');
        });
    }
};
