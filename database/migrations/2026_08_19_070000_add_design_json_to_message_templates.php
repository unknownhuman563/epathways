<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Stores the visual email builder's (Unlayer) design document so a
 * builder-made template can be re-opened and edited. The exported HTML lives in
 * email_body as usual; design_json is the editable source. Presence of
 * design_json marks the template as a complete, self-contained email that is
 * sent WITHOUT the branded shell (see TemplatedMessage / CommunicationService).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('message_templates', function (Blueprint $table) {
            $table->longText('design_json')->nullable()->after('email_body');
        });
    }

    public function down(): void
    {
        Schema::table('message_templates', function (Blueprint $table) {
            $table->dropColumn('design_json');
        });
    }
};
