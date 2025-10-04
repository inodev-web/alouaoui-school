<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->string('user_uuid')->nullable()->after('user_id')->index();
            $table->string('processed_by_uuid')->nullable()->after('processed_by')->index();
        });

        // Backfill user_uuid and processed_by_uuid from users table where possible
        \DB::table('payments')->join('users', 'payments.user_id', '=', 'users.id')
            ->whereNotNull('users.uuid')
            ->update(['payments.user_uuid' => \DB::raw('users.uuid')]);

        \DB::table('payments')->leftJoin('users as proc', 'payments.processed_by', '=', 'proc.id')
            ->whereNotNull('proc.uuid')
            ->update(['payments.processed_by_uuid' => \DB::raw('proc.uuid')]);
    }

    public function down(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->dropColumn(['user_uuid', 'processed_by_uuid']);
        });
    }
};
