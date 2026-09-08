<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * A school can have several contact people (marketing, admissions, regional
 * reps…), so replace the single contact_* columns with a `contacts` JSON list
 * of { name, role, email, phone }. Any single contact already entered is folded
 * into the new list before the old columns are dropped.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('schools', function (Blueprint $table) {
            $table->json('contacts')->nullable()->after('description');
        });

        // Preserve any existing single contact as the first list entry.
        foreach (DB::table('schools')->get(['id', 'contact_person_name', 'contact_email', 'contact_number']) as $s) {
            $hasAny = $s->contact_person_name || $s->contact_email || $s->contact_number;
            if (! $hasAny) {
                continue;
            }
            DB::table('schools')->where('id', $s->id)->update([
                'contacts' => json_encode([[
                    'name' => $s->contact_person_name,
                    'role' => null,
                    'email' => $s->contact_email,
                    'phone' => $s->contact_number,
                ]]),
            ]);
        }

        Schema::table('schools', function (Blueprint $table) {
            $table->dropColumn(['contact_person_name', 'contact_email', 'contact_number']);
        });
    }

    public function down(): void
    {
        Schema::table('schools', function (Blueprint $table) {
            $table->string('contact_person_name')->nullable()->after('description');
            $table->string('contact_email')->nullable()->after('contact_person_name');
            $table->string('contact_number')->nullable()->after('contact_email');
        });

        foreach (DB::table('schools')->whereNotNull('contacts')->get(['id', 'contacts']) as $s) {
            $first = json_decode($s->contacts, true)[0] ?? null;
            if ($first) {
                DB::table('schools')->where('id', $s->id)->update([
                    'contact_person_name' => $first['name'] ?? null,
                    'contact_email' => $first['email'] ?? null,
                    'contact_number' => $first['phone'] ?? null,
                ]);
            }
        }

        Schema::table('schools', function (Blueprint $table) {
            $table->dropColumn('contacts');
        });
    }
};
