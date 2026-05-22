<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('students', function (Blueprint $table) {
            $table->index('status');
            $table->index('guardian_id');
        });

        Schema::table('enrollments', function (Blueprint $table) {
            $table->index('status');
        });

        Schema::table('class_groups', function (Blueprint $table) {
            $table->index('status');
            $table->index('academic_year');
        });

        Schema::table('class_sessions', function (Blueprint $table) {
            $table->index(['class_group_id', 'session_date']);
        });

        Schema::table('payments', function (Blueprint $table) {
            $table->index('status');
            $table->index('paid_at');
        });

        Schema::table('audit_events', function (Blueprint $table) {
            $table->index(['entity_type', 'entity_id']);
            $table->index('user_id');
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::table('students', function (Blueprint $table) {
            $table->dropIndex(['status']);
            $table->dropIndex(['guardian_id']);
        });

        Schema::table('enrollments', function (Blueprint $table) {
            $table->dropIndex(['status']);
        });

        Schema::table('class_groups', function (Blueprint $table) {
            $table->dropIndex(['status']);
            $table->dropIndex(['academic_year']);
        });

        Schema::table('class_sessions', function (Blueprint $table) {
            $table->dropIndex(['class_group_id', 'session_date']);
        });

        Schema::table('payments', function (Blueprint $table) {
            $table->dropIndex(['status']);
            $table->dropIndex(['paid_at']);
        });

        Schema::table('audit_events', function (Blueprint $table) {
            $table->dropIndex(['entity_type', 'entity_id']);
            $table->dropIndex(['user_id']);
            $table->dropIndex(['created_at']);
        });
    }
};
