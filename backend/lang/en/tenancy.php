<?php

/**
 * Multi-school feature texts, in English.
 *
 * The same keys as `lang/es/tenancy.php`, exactly: that is what lets a test
 * verify none is missing.
 */

return [

    'access' => [
        'no_organization' => 'Your account is not linked to any school. Contact the administration.',
        'organization_suspended' => 'Access to this school is temporarily suspended. Contact the platform administration.',
        'organization_unavailable' => 'This school is no longer available. Contact the platform administration.',
        'role_denied' => 'Access denied for this profile.',
    ],

    'records' => [
        'deleted' => 'Record deleted.',
    ],

    'tutor_groups' => [
        'representative_on_create' => 'A representative cannot be appointed while creating the group: it has no students yet. Create the group, add students, then appoint one.',
        'representative_other_group' => 'The selected student belongs to another group. The representative must be a student of this group.',
    ],

    'class_sessions' => [
        'already_taught' => 'This session is already marked as taught. The mark cannot be undone: if it is a mistake, the administration must delete the session.',
    ],

    'payments' => [
        'enrollment_mismatch' => 'The selected enrolment does not belong to this student.',
    ],

    'organizations' => [
        'has_active_users' => 'The organisation has active users: suspend it before deleting it.',
        'deleted' => 'Organisation deleted. Its data remains and can be recovered.',
    ],

    'users' => [
        'deleted' => 'Account deleted. The teacher record, if there was one, is kept.',
        'teacher_profile_other_organization' => 'That teacher record belongs to another school.',
        'teacher_profile_already_linked' => 'That teacher record is already linked to another account.',
        'platform_admin_without_organization' => 'A platform super administrator belongs to no organisation.',
    ],

];
