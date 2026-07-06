<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('programs', function (Blueprint $table) {
            // The industry / field this program's courses lead into
            // (e.g. Healthcare, IT, Construction, Business). Nullable.
            $table->string('industry')->nullable()->after('category');
        });
    }

    public function down(): void
    {
        Schema::table('programs', function (Blueprint $table) {
            $table->dropColumn('industry');
        });
    }
};
