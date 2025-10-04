<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('attendances', function (Blueprint $table) {
            $table->string('user_uuid')->nullable()->after('user_id')->index();
            $table->string('checked_in_by_uuid')->nullable()->after('checked_in_by')->index();
        });

        // Backfill user_uuid and checked_in_by_uuid from users table where possible
        \DB::table('attendances')->join('users', 'attendances.user_id', '=', 'users.id')
            ->whereNotNull('users.uuid')
            ->update(['attendances.user_uuid' => \DB::raw('users.uuid')]);

        \DB::table('attendances')->leftJoin('users as proc', 'attendances.checked_in_by', '=', 'proc.id')
            ->whereNotNull('proc.uuid')
            ->update(['attendances.checked_in_by_uuid' => \DB::raw('proc.uuid')]);
    }

    public function down(): void
    {
        Schema::table('attendances', function (Blueprint $table) {
            $table->dropColumn(['user_uuid', 'checked_in_by_uuid']);
        });
    }
};
