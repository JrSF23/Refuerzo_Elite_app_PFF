<?php

/**
 * Validation messages, in English.
 *
 * The same keys as `lang/es/validation.php`, exactly: a test compares the three
 * catalogues and fails if any is missing, because a missing key falls back to
 * Spanish and leaves one message in another language inside an English form.
 *
 * `attributes` is what turns «The class_group_id field is required» into «The
 * group field is required». It is the part that matters most to whoever reads
 * the error: the rule is generic, the field name is what tells them where to
 * look.
 */

return [

    'accepted' => 'The :attribute field must be accepted.',
    'accepted_if' => 'The :attribute field must be accepted when :other is :value.',
    'active_url' => 'The :attribute field must be a valid URL.',
    'after' => 'The :attribute field must be a date after :date.',
    'after_or_equal' => 'The :attribute field must be a date after or equal to :date.',
    'alpha' => 'The :attribute field may only contain letters.',
    'alpha_dash' => 'The :attribute field may only contain letters, numbers, dashes and underscores.',
    'alpha_num' => 'The :attribute field may only contain letters and numbers.',
    'any_of' => 'The :attribute field is invalid.',
    'array' => 'The :attribute field must be a list.',
    'ascii' => 'The :attribute field may only contain single-byte characters and symbols.',
    'before' => 'The :attribute field must be a date before :date.',
    'before_or_equal' => 'The :attribute field must be a date before or equal to :date.',
    'boolean' => 'The :attribute field must be true or false.',
    'can' => 'The :attribute field contains an unauthorised value.',
    'confirmed' => 'The :attribute field confirmation does not match.',
    'contains' => 'The :attribute field is missing a required value.',
    'current_password' => 'The password is incorrect.',
    'date' => 'The :attribute field must be a valid date.',
    'date_equals' => 'The :attribute field must be a date equal to :date.',
    'date_format' => 'The :attribute field must match the format :format.',
    'decimal' => 'The :attribute field must have :decimal decimal places.',
    'declined' => 'The :attribute field must be declined.',
    'declined_if' => 'The :attribute field must be declined when :other is :value.',
    'different' => 'The :attribute field and :other must be different.',
    'digits' => 'The :attribute field must be :digits digits.',
    'digits_between' => 'The :attribute field must be between :min and :max digits.',
    'dimensions' => 'The :attribute field has invalid image dimensions.',
    'distinct' => 'The :attribute field has a duplicate value.',
    'doesnt_contain' => 'The :attribute field must not contain any of the following: :values.',
    'doesnt_end_with' => 'The :attribute field must not end with any of the following: :values.',
    'doesnt_start_with' => 'The :attribute field must not start with any of the following: :values.',
    'email' => 'The :attribute field must be a valid email address.',
    'encoding' => 'The :attribute field must use the :encoding encoding.',
    'ends_with' => 'The :attribute field must end with one of the following: :values.',
    'enum' => 'The selected :attribute is invalid.',
    'exists' => 'The selected :attribute is invalid.',
    'extensions' => 'The :attribute field must have one of the following extensions: :values.',
    'file' => 'The :attribute field must be a file.',
    'filled' => 'The :attribute field must have a value.',
    'hex_color' => 'The :attribute field must be a valid hexadecimal colour.',
    'image' => 'The :attribute field must be an image.',
    'in' => 'The selected :attribute is invalid.',
    'in_array' => 'The :attribute field must exist in :other.',
    'in_array_keys' => 'The :attribute field must contain at least one of the following keys: :values.',
    'integer' => 'The :attribute field must be a whole number.',
    'ip' => 'The :attribute field must be a valid IP address.',
    'ipv4' => 'The :attribute field must be a valid IPv4 address.',
    'ipv6' => 'The :attribute field must be a valid IPv6 address.',
    'json' => 'The :attribute field must be a valid JSON string.',
    'list' => 'The :attribute field must be a list.',
    'lowercase' => 'The :attribute field must be lowercase.',
    'mac_address' => 'The :attribute field must be a valid MAC address.',
    'max_digits' => 'The :attribute field must not have more than :max digits.',
    'mimes' => 'The :attribute field must be a file of type: :values.',
    'mimetypes' => 'The :attribute field must be a file of type: :values.',
    'min_digits' => 'The :attribute field must have at least :min digits.',
    'missing' => 'The :attribute field must be missing.',
    'missing_if' => 'The :attribute field must be missing when :other is :value.',
    'missing_unless' => 'The :attribute field must be missing unless :other is :value.',
    'missing_with' => 'The :attribute field must be missing when :values is present.',
    'missing_with_all' => 'The :attribute field must be missing when :values are present.',
    'multiple_of' => 'The :attribute field must be a multiple of :value.',
    'not_in' => 'The selected :attribute is invalid.',
    'not_regex' => 'The :attribute field format is invalid.',
    'numeric' => 'The :attribute field must be a number.',
    'present' => 'The :attribute field must be present.',
    'present_if' => 'The :attribute field must be present when :other is :value.',
    'present_unless' => 'The :attribute field must be present unless :other is :value.',
    'present_with' => 'The :attribute field must be present when :values is present.',
    'present_with_all' => 'The :attribute field must be present when :values are present.',
    'prohibited' => 'The :attribute field is prohibited.',
    'prohibited_if' => 'The :attribute field is prohibited when :other is :value.',
    'prohibited_if_accepted' => 'The :attribute field is prohibited when :other is accepted.',
    'prohibited_if_declined' => 'The :attribute field is prohibited when :other is declined.',
    'prohibited_unless' => 'The :attribute field is prohibited unless :other is in :values.',
    'prohibits' => 'The :attribute field prohibits :other from being present.',
    'regex' => 'The :attribute field format is invalid.',
    'required' => 'The :attribute field is required.',
    'required_array_keys' => 'The :attribute field must contain entries for: :values.',
    'required_if' => 'The :attribute field is required when :other is :value.',
    'required_if_accepted' => 'The :attribute field is required when :other is accepted.',
    'required_if_declined' => 'The :attribute field is required when :other is declined.',
    'required_unless' => 'The :attribute field is required unless :other is in :values.',
    'required_with' => 'The :attribute field is required when :values is present.',
    'required_with_all' => 'The :attribute field is required when :values are present.',
    'required_without' => 'The :attribute field is required when :values is not present.',
    'required_without_all' => 'The :attribute field is required when none of :values are present.',
    'same' => 'The :attribute field must match :other.',
    'starts_with' => 'The :attribute field must start with one of the following: :values.',
    'string' => 'The :attribute field must be text.',
    'timezone' => 'The :attribute field must be a valid time zone.',
    'unique' => 'That :attribute is already taken.',
    'uploaded' => 'The :attribute field failed to upload.',
    'uppercase' => 'The :attribute field must be uppercase.',
    'url' => 'The :attribute field must be a valid URL.',
    'ulid' => 'The :attribute field must be a valid ULID.',
    'uuid' => 'The :attribute field must be a valid UUID.',

    'between' => [
        'array' => 'The :attribute field must have between :min and :max items.',
        'file' => 'The :attribute field must be between :min and :max kilobytes.',
        'numeric' => 'The :attribute field must be between :min and :max.',
        'string' => 'The :attribute field must be between :min and :max characters.',
    ],

    'gt' => [
        'array' => 'The :attribute field must have more than :value items.',
        'file' => 'The :attribute field must be greater than :value kilobytes.',
        'numeric' => 'The :attribute field must be greater than :value.',
        'string' => 'The :attribute field must be longer than :value characters.',
    ],

    'gte' => [
        'array' => 'The :attribute field must have :value items or more.',
        'file' => 'The :attribute field must be greater than or equal to :value kilobytes.',
        'numeric' => 'The :attribute field must be greater than or equal to :value.',
        'string' => 'The :attribute field must be :value characters or longer.',
    ],

    'lt' => [
        'array' => 'The :attribute field must have fewer than :value items.',
        'file' => 'The :attribute field must be less than :value kilobytes.',
        'numeric' => 'The :attribute field must be less than :value.',
        'string' => 'The :attribute field must be shorter than :value characters.',
    ],

    'lte' => [
        'array' => 'The :attribute field must not have more than :value items.',
        'file' => 'The :attribute field must be less than or equal to :value kilobytes.',
        'numeric' => 'The :attribute field must be less than or equal to :value.',
        'string' => 'The :attribute field must be :value characters or shorter.',
    ],

    'max' => [
        'array' => 'The :attribute field must not have more than :max items.',
        'file' => 'The :attribute field must not be greater than :max kilobytes.',
        'numeric' => 'The :attribute field must not be greater than :max.',
        'string' => 'The :attribute field must not be longer than :max characters.',
    ],

    'min' => [
        'array' => 'The :attribute field must have at least :min items.',
        'file' => 'The :attribute field must be at least :min kilobytes.',
        'numeric' => 'The :attribute field must be at least :min.',
        'string' => 'The :attribute field must be at least :min characters.',
    ],

    'password' => [
        'letters' => 'The :attribute field must contain at least one letter.',
        'mixed' => 'The :attribute field must contain at least one uppercase and one lowercase letter.',
        'numbers' => 'The :attribute field must contain at least one number.',
        'symbols' => 'The :attribute field must contain at least one symbol.',
        'uncompromised' => 'That :attribute has appeared in a data leak. Please choose a different one.',
    ],

    'size' => [
        'array' => 'The :attribute field must contain :size items.',
        'file' => 'The :attribute field must be :size kilobytes.',
        'numeric' => 'The :attribute field must be :size.',
        'string' => 'The :attribute field must be :size characters.',
    ],

    'custom' => [
        'password' => [
            'min' => 'The password must be at least 8 characters.',
        ],
    ],

    /*
     * Field names, in the school's own words.
     *
     * This is what turns «The class_group_id field is required» into «The group
     * field is required». The rule is generic; the field name is what tells the
     * reader where to look.
     */
    'attributes' => [
        'login' => 'username or email',
        'password' => 'password',
        'username' => 'username',
        'name' => 'name',
        'email' => 'email',
        'role' => 'role',
        'organization_id' => 'school',

        'first_name' => 'first name',
        'last_name' => 'surname',
        'phone' => 'phone',
        'address' => 'address',
        'notes' => 'notes',
        'date_of_birth' => 'date of birth',
        'relationship_label' => 'relationship',
        'specialty' => 'speciality',
        'bio' => 'profile',
        'school_name' => 'previous school',
        'school_level' => 'year',

        'subject_id' => 'subject',
        'teacher_id' => 'teacher',
        'guardian_id' => 'guardian',
        'student_id' => 'student',
        'class_group_id' => 'group',
        'class_session_id' => 'session',
        'enrollment_id' => 'enrolment',
        'code' => 'code',
        'level' => 'level',
        'description' => 'description',
        'academic_year' => 'academic year',
        'schedule' => 'timetable',
        'capacity' => 'capacity',
        'start_date' => 'start date',
        'end_date' => 'end date',
        'enrolled_at' => 'enrolment date',
        'title' => 'title',
        'session_date' => 'session date',
        'starts_at' => 'start time',
        'ends_at' => 'end time',
        'room' => 'room',
        'comment' => 'comment',
        'status' => 'status',
        'is_active' => 'status',

        'amount' => 'amount',
        'monthly_fee' => 'monthly fee',
        'period_label' => 'period',
        'paid_at' => 'payment date',
        'payment_method' => 'payment method',
        'reference' => 'reference',

        'slug' => 'identifier',
        'contact_email' => 'contact email',
        'contact_phone' => 'contact phone',
    ],

];
