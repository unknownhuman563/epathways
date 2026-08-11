<?php

use App\Models\User;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    /**
     * Add a public referral code for agents so we can build a per-agent
     * registration URL (/register?ref=AGT-XXXX). Every existing agent row
     * gets one generated retroactively so their existing links (once shared)
     * work immediately.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $t) {
            $t->string('referral_code', 20)->nullable()->unique()->after('role');
        });

        // Back-fill codes for existing agents. Bulk-friendly loop: pick a
        // fresh random suffix per row, retry once on the (extremely
        // unlikely) unique collision — cheaper than pre-computing.
        DB::table('users')->where('role', 'agent')->whereNull('referral_code')->orderBy('id')->each(function ($row) {
            for ($i = 0; $i < 5; $i++) {
                $code = 'AGT-'.strtoupper(Str::random(6));
                $ok = DB::table('users')->where('id', $row->id)->update(['referral_code' => $code]);
                if ($ok) return;
            }
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $t) {
            $t->dropUnique(['referral_code']);
            $t->dropColumn('referral_code');
        });
    }
};
