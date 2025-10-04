<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('subscriptions', function (Blueprint $table) {
            $table->string('user_uuid')->nullable()->after('user_id')->index();
        });

        // Backfill user_uuid from users table where possible
        \DB::table('subscriptions')->join('users', 'subscriptions.user_id', '=', 'users.id')
            ->whereNotNull('users.uuid')
            ->update(['subscriptions.user_uuid' => \DB::raw('users.uuid')]);
    }

    public function down(): void
    {
        Schema::table('subscriptions', function (Blueprint $table) {
            $table->dropColumn('user_uuid');
        });
    }
};
