<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        // Users
        Schema::create('users', function (Blueprint $table) {
            $table->uuid('uuid')->primary();
            $table->string('firstname');
            $table->string('lastname');
            $table->date('birth_date')->nullable();
            $table->string('address')->nullable();
            $table->string('school_name')->nullable();
            $table->string('phone')->unique();
            $table->string('password');
            $table->string('year_of_study')->nullable();
            $table->string('role')->default('student');
            $table->string('device_uuid')->nullable();
            $table->string('qr_token')->nullable();
            $table->boolean('free_subscriber')->default(false);
            $table->string('free_subscriber_reason')->nullable();
            $table->rememberToken();
            $table->timestamps();
            $table->index(['role', 'year_of_study']);
            $table->index(['qr_token']);
        });

        // Teachers
        Schema::create('teachers', function (Blueprint $table) {
            $table->uuid('uuid')->primary();
            $table->string('name');
            $table->string('phone')->nullable();
            $table->string('picture')->nullable();
            $table->string('module')->nullable();
            $table->string('year')->nullable();
            $table->boolean('is_online_publisher')->default(false);
            $table->decimal('price_subscription', 8, 2)->nullable();
            $table->decimal('price_session', 8, 2)->nullable();
            $table->unsignedInteger('percent_school')->nullable();
            $table->timestamps();
            $table->index(['is_online_publisher']);
        });

        // Chapters
        Schema::create('chapters', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('year_target')->nullable();
            $table->timestamps();
            $table->index(['year_target']);
        });

        // Courses
        Schema::create('courses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('chapter_id')->constrained('chapters')->onDelete('cascade');
            $table->string('title');
            $table->string('video_ref')->nullable();
            $table->string('pdf_summary')->nullable();
            $table->string('exercises_pdf')->nullable();
            $table->timestamps();
            $table->index(['chapter_id']);
        });

        // Sessions
        Schema::create('sessions', function (Blueprint $table) {
            $table->id();
            $table->uuid('teacher_uuid')->nullable();
            $table->string('year_target')->nullable();
            $table->dateTime('start_time')->nullable();
            $table->dateTime('end_time')->nullable();
            $table->string('status')->default('completed');
            $table->timestamps();
            $table->foreign('teacher_uuid')->references('uuid')->on('teachers')->onDelete('cascade');
            $table->index(['teacher_uuid', 'start_time']);
        });

        // Subscriptions (simplified - time window based only)
        Schema::create('subscriptions', function (Blueprint $table) {
            $table->id();
            $table->uuid('user_uuid');
            $table->uuid('teacher_uuid')->nullable();
            $table->dateTime('starts_at');
            $table->dateTime('ends_at');
            $table->timestamps();
            $table->foreign('user_uuid')->references('uuid')->on('users')->onDelete('cascade');
            $table->foreign('teacher_uuid')->references('uuid')->on('teachers')->onDelete('cascade');
            $table->index(['user_uuid', 'teacher_uuid']);
            $table->index(['starts_at', 'ends_at']);
        });

        // Attendances
        Schema::create('attendances', function (Blueprint $table) {
            $table->id();
            $table->uuid('student_uuid');
            $table->uuid('teacher_uuid');
            $table->foreignId('session_id')->nullable()->constrained('sessions')->onDelete('cascade');
            $table->dateTime('validated_at')->nullable();
            $table->timestamps();
            $table->foreign('student_uuid')->references('uuid')->on('users')->onDelete('cascade');
            $table->foreign('teacher_uuid')->references('uuid')->on('teachers')->onDelete('cascade');
            $table->unique(['student_uuid', 'session_id']);
            $table->index(['student_uuid', 'created_at']);
            $table->index(['teacher_uuid']);
        });

        // Stream tokens
        Schema::create('stream_tokens', function (Blueprint $table) {
            $table->id();
            $table->uuid('user_uuid');
            $table->foreignId('course_id')->constrained('courses')->onDelete('cascade');
            $table->string('token')->unique();
            $table->string('ip_address')->nullable();
            $table->string('user_agent')->nullable();
            $table->dateTime('expires_at');
            $table->dateTime('accessed_at')->nullable();
            $table->boolean('is_used')->default(false);
            $table->json('metadata')->nullable();
            $table->timestamps();
            $table->foreign('user_uuid')->references('uuid')->on('users')->onDelete('cascade');
            $table->index(['user_uuid', 'course_id']);
        });

        // Testimonials
        Schema::create('testimonials', function (Blueprint $table) {
            $table->id();
            $table->string('author')->nullable();
            $table->text('content')->nullable();
            $table->timestamps();
        });

        // Events
        Schema::create('events', function (Blueprint $table) {
            $table->id();
            $table->string('name')->nullable();
            $table->dateTime('starts_at')->nullable();
            $table->dateTime('ends_at')->nullable();
            $table->timestamps();
        });

        // Personal access tokens (Sanctum)
        Schema::create('personal_access_tokens', function (Blueprint $table) {
            $table->id();
            $table->morphs('tokenable');
            $table->string('name');
            $table->string('token', 64)->unique();
            $table->text('abilities')->nullable();
            $table->timestamp('last_used_at')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('personal_access_tokens');
        Schema::dropIfExists('events');
        Schema::dropIfExists('testimonials');
        Schema::dropIfExists('stream_tokens');
        Schema::dropIfExists('attendances');
        Schema::dropIfExists('subscriptions');
        Schema::dropIfExists('sessions');
        Schema::dropIfExists('courses');
        Schema::dropIfExists('chapters');
        Schema::dropIfExists('teachers');
        Schema::dropIfExists('users');
    }
};
