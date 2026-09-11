/**
 * English text catalogue.
 *
 * Same structure as `es.js`, key for key: that is what lets a test verify none
 * is missing. Any key absent here falls back to Spanish, the base language.
 *
 * What is NOT translated: the domain state keys (`status.active`,
 * `attendanceStatus.present`…) are the values the API returns and are part of
 * the contract. Only the displayed text changes.
 */

export const en = {
  app: {
    name: 'SmartWork',
    tagline: 'School management',
  },

  common: {
    save: 'Save',
    saveChanges: 'Save changes',
    cancel: 'Cancel',
    create: 'Create',
    edit: 'Edit',
    delete: 'Delete',
    confirm: 'Confirm',
    close: 'Close',
    retry: 'Retry',
    back: 'Back',
    search: 'Search',
    clear: 'Clear',
    view: 'View',
    clearFilter: 'Clear filter',
    select: 'Select',
    noOptions: 'No options available',

    typeToSearch: 'Type to search…',
    clearSelection: 'Clear selection',
    noResultsFor: 'No results for “{term}”.',
    showAll: 'Show all options',
    unresolvedOption: 'Record unavailable',
    moreResults: 'Showing {shown} of {total}. Narrow your search.',
    truncatedOptions: 'Showing the first {shown} of {total} options.',
    optionsAvailable: {
      one: '{count} option available',
      many: '{count} options available',
    },

    actions: 'Actions',
    viewAll: 'View all',

    datePlaceholder: 'dd/mm/yyyy',
    openCalendar: 'Open calendar',
    invalidDate: 'That date is not valid. Use the dd/mm/yyyy format.',

    loading: 'Loading…',
    saving: 'Saving…',
    required: 'required',
    optional: 'optional',
    emptyValue: '—',

    previous: 'Previous',
    next: 'Next',
    pagePosition: 'Page {current} of {total}',
    showingRange: 'Showing {from}–{to} of {total}',
    totalRecords: {
      one: '{count} record',
      many: '{count} records',
    },

    errorTitle: 'The data could not be loaded',
    errorBody: 'Something went wrong while contacting the server.',
    networkError: 'No connection to the server. Check your network and try again.',
    unreachableTitle: 'The server cannot be reached',
    unexpectedError: 'An unexpected error occurred.',
    notFoundTitle: 'Record not found',
    notFoundBody: 'It may have been deleted. Go back to the list to continue.',
    forbiddenTitle: 'No access',
    tooManyRequests: 'Too many attempts. Wait a moment before trying again.',

    created: 'Record created.',
    savedChanges: 'Changes saved.',
    deleted: 'Record deleted.',
    noRecordsTitle: 'No records yet',

    deleteTitle: 'Delete {name}',
    deleteBody: 'Delete “{name}”? This cannot be undone.',

    noResultsTitle: 'No results',
    noResultsBody: 'No record matches “{term}”.',

    crashTitle: 'Something went wrong',
    crashBody: 'An unexpected error occurred and the screen could not be shown. You can retry or go back to the start.',
    backToStart: 'Back to the start',

    sectionPendingTitle: 'Section under construction',
    sectionPendingBody: 'This section will be available in a future release.',
  },

  auth: {
    title: 'Sign in',
    subtitle: 'Enter your credentials to continue.',
    login: 'Username or email',
    loginHint: 'You can use either your username or your email address.',
    password: 'Password',
    submit: 'Sign in',
    submitting: 'Signing in…',
    logout: 'Sign out',
    sessionExpired: 'Your session has expired. Please sign in again.',
    genericError: 'Could not sign in. Please try again.',
  },

  nav: {
    label: 'Main navigation',
    open: 'Open navigation',
    close: 'Close navigation',
    skipToContent: 'Skip to content',
    sectionManagement: 'Management',
    sectionAcademic: 'Academic activity',
    sectionFinance: 'Fees',
    sectionAdmin: 'Administration',
    sectionPlatform: 'Platform',
  },

  roles: {
    super_admin: 'Platform',
    org_admin: 'Administration',
    teacher: 'Teacher',
    none: 'No role',
  },

  organization: {
    suspendedTitle: 'School suspended',
    suspendedBody: 'Access to this school’s data is suspended. Contact the platform administration.',
    unavailableTitle: 'School unavailable',
    missingTitle: 'No school assigned',
    missingBody: 'Your account is not assigned to any school. Contact the administration.',
  },

  theme: {
    darkMode: 'Dark mode',
  },

  language: {
    label: 'Language',
    change: 'Change language',
  },

  dashboard: {
    title: 'Dashboard',

    greetingMorning: 'Good morning, {name}!',
    greetingAfternoon: 'Good afternoon, {name}!',
    greetingEvening: 'Good evening, {name}!',

    stats: {
      students: 'Students',
      teachers: 'Teachers',
      groups: 'Groups',
      attendances: 'Attendance records',
      attendanceRate: 'Attendance',
      payments: 'Payments',
      pendingPayments: 'Outstanding payments',
      needsAttention: 'Need attention',
      myGroups: 'My groups',
      myStudents: 'My students',
      upcomingSessions: 'Upcoming sessions',
    },

    attendance: {
      title: 'Attendance',
      noTrend: 'No attendance recorded this week yet.',
      days: {
        mon: 'M',
        tue: 'T',
        wed: 'W',
        thu: 'Th',
        fri: 'F',
      },
      delta: {
        up: '{value} points higher than last week',
        down: '{value} points lower than last week',
        flat: 'Same as last week',
      },
    },

    attention: {
      title: 'Needs attention',
      pendingPayments: '{count} payments still to collect',
      lowAttendance: '{count} students with attendance below 75%',
      groupsWithoutTeacher: '{count} groups with no teacher assigned',
      groupsSubjectMismatch: '{count} groups whose teacher does not teach that subject',
    },

    recentStudents: 'Recent enrolments',
    recentSessions: 'Recent sessions',
    recentPayments: 'Recent payments',
    myGroups: 'My groups',
    upcomingSessions: 'Upcoming sessions',
    groupStudents: '{count} students',
    teacherUnlinkedTitle: 'Account with no teacher record',
    teacherUnlinkedBody: 'Your account is not linked to a teacher record yet, so no groups or sessions are shown. Ask the school administration to complete the link.',
    emptyStudents: 'No students registered yet.',
    emptySessions: 'No sessions recorded yet.',
    emptyPayments: 'No payments recorded yet.',
    emptyGroups: 'You have no groups assigned.',
    emptyUpcoming: 'You have no upcoming sessions.',
    noGuardian: 'No guardian assigned',
  },

  students: {
    filters: {
      lowAttendance: 'Students with low attendance only',
    },
    title: 'Students',
    create: 'New student',
    edit: 'Edit student',
    emptyTitle: 'No students yet',
    emptyBody: 'Register the first student to start enrolling and taking attendance.',
    groupsIntro: 'Choose a class to view and manage its students.',
    searchGroups: 'Search class',
    viewAllStudents: 'View all students',
    allStudents: 'All students',
    noGroupsTitle: 'No classes yet',
    noGroupsBody: 'Create this year’s groups so students can be organised.',
    countLabelOne: 'student',
    countLabelMany: 'students',
    emptyGroupTitle: 'This group has no students',
    emptyGroupBody: 'Register a student or move one here from their record.',
    emptyUnassignedBody: 'Every student already has a group assigned.',
    unassignedGroup: 'No group assigned',
    unassignedHint: 'Assign a group to these students from their record.',
    countOne: '{count} student',
    countMany: '{count} students',
    pagedBlocksNotice: 'The blocks match the page shown. A group with many students may continue on the next one.',
    fields: {
      attendance: 'Attendance',
      fullName: 'Student',
      dateOfBirth: 'Date of birth',
      schoolName: 'Previous school',
      schoolLevel: 'Year',
      tutorGroup: 'Group',
      tutorGroupHint: 'The class they belong to. Not the same as subject groups.',
    },
  },

  guardians: {
    title: 'Guardians',
    create: 'New guardian',
    edit: 'Edit guardian',
    emptyTitle: 'No guardians yet',
    emptyBody: 'Guardians are the contact person responsible for each student.',
    fields: {
      fullName: 'Guardian',
      relationship: 'Relationship',
      relationshipHint: 'For example: mother, father, grandmother, legal guardian.',
    },
  },

  teachers: {
    title: 'Teachers',
    create: 'New teacher',
    edit: 'Edit teacher',
    emptyTitle: 'No teachers yet',
    emptyBody: 'Teacher records are needed before groups can be assigned.',
    fields: {
      fullName: 'Teacher',
      specialty: 'Speciality',
      subjectHint: 'Decides which groups and sessions their account reaches. With no subject, the teacher can sign in but sees no groups.',
      bio: 'Profile',
    },
  },

  stages: {
    title: 'Stages',
    create: 'New stage',
    edit: 'Edit stage',
    emptyTitle: 'No stages yet',
    emptyBody: 'The stage sets what a student pays. Create them before assigning classes: Pre-school, Primary, ESBA and Baccalaureate are the ones used in Equatorial Guinea.',
    fields: {
      name: 'Stage',
      fee: 'Course fee',
      feeHint: 'Amount for the whole academic year. Your school sets it; it can be paid in instalments.',
      groups: 'Classes',
      order: 'Order',
      orderHint: 'The order they appear in. Lowest first, so they list by level rather than alphabetically.',
    },
  },

  subjects: {
    title: 'Subjects',
    create: 'New subject',
    edit: 'Edit subject',
    emptyTitle: 'No subjects yet',
    emptyBody: 'Every group teaches a subject, so this is the first step.',
    fields: {
      codeHint: 'A short identifier, unique within the school.',
    },
  },

  tutorGroups: {
    title: 'Groups',
    create: 'New group',
    edit: 'Edit group',
    emptyTitle: 'No groups yet',
    emptyBody: 'Create this year’s groups so students can be organised by class.',
    unassigned: 'Unassigned',
    shifts: {
      morning: 'Morning',
      afternoon: 'Afternoon',
    },
    fields: {
      stage: 'Stage',
      stageHint: 'Determines the fee its students pay. Without a stage the class still works, but its students have no fee assigned.',
      name: 'Group',
      nameHint: 'Whatever the school calls it: “Year 7”, “Year 10 - A”.',
      shift: 'Shift',
      academicYear: 'Academic year',
      tutor: 'Form tutor',
      tutorHint: 'Can be left unassigned and set later.',
      representative: 'Student representative',
      representativeHint: 'Only students in this group can be appointed.',
      representativeOnCreate: 'Available when editing, once the group has students',
      sortOrder: 'Order',
      sortOrderHint: 'Sets the order groups appear in. The lower the number, the higher up.',
    },
  },

  classGroups: {
    filters: {
      withoutTeacher: 'Groups without a teacher only',
      subjectMismatch: 'Groups whose teacher teaches another subject only',
    },
    subjectsOf: 'Subjects',
    emptyGroupTitle: 'This group teaches no subjects yet',
    emptyGroupBody: 'Add the subjects taught in this group and who teaches them. Without at least one, no sessions can be recorded and no attendance taken.',
    title: 'Subject groups',
    create: 'New subject group',
    edit: 'Edit subject group',
    emptyTitle: 'No subject groups yet',
    emptyBody: 'Each group teaches one subject. Create the subjects and teachers first.',
    fields: {
      teacherHint: 'Who teaches this subject in this group. Can be left unassigned.',
      nameInGroupHint: 'Whatever the school calls it. Leaving it blank is fine: lists show “group — subject”.',
      name: 'Group',
      codeHint: 'A short identifier, unique within the school.',
      academicYear: 'Academic year',
      schedule: 'Timetable',
      capacity: 'Capacity',
      startDate: 'Start date',
      endDate: 'End date',
    },
  },

  enrollments: {
    title: 'Enrolments',
    create: 'New enrolment',
    edit: 'Edit enrolment',
    emptyTitle: 'No enrolments yet',
    emptyBody: 'An enrolment links a student to a subject group and sets their amount.',
    fields: {
      enrolledAt: 'Enrolment date',
      amount: 'Amount',
      amountHint: 'The amount agreed for this student in this group.',
    },
  },

  sessions: {
    title: 'Sessions',
    create: 'New session',
    edit: 'Edit session',
    emptyTitle: 'No sessions yet',
    emptyBody: 'Create a group’s sessions so its attendance can be recorded.',
    fields: {
      title: 'Session',
      date: 'Date',
      time: 'Time',
      startsAt: 'Start time',
      endsAt: 'End time',
      room: 'Room',
      taught: 'Taught',
    },
    markTaught: 'Mark as taught',
    markTitle: 'Mark “{name}” as taught',
    marked: 'Session marked as taught.',
    markConfirm: 'Mark “{name}” as taught? This cannot be undone.',
    taughtBy: 'Marked by {name}',
  },

  attendance: {
    sessionsIntro: 'Choose a session and take attendance. The group has {count} enrolled students.',
    noSessionsTitle: 'This group has no sessions',
    noSessionsBody: 'Create a session from Sessions so attendance can be taken for it.',
    history: {
      title: 'Saved registers',
      intro: 'Registers already taken, newest first. Open one to review or correct it.',
      review: 'Review',
      emptyTitle: 'You have not taken any register yet',
      emptyBody: 'The registers you record will appear here, grouped by session.',
    },
    roll: {
      title: 'Take attendance',
      open: 'Take attendance',
      save: 'Save register',
      saved: 'Register saved: {count} students.',
      unset: 'Not marked',
      unmarked: '{count} students are still unmarked.',
      markRestPresent: 'Mark the rest as present',
      nothingToSave: 'You have not marked any student.',
      noStudents: 'This group has no enrolled students.',
      complete: 'Register complete',
      progress: '{marked} of {total}',
    },
    groupsIntro: 'Choose a group to view and record its attendance. Each group keeps its own count and its own register.',
    searchGroups: 'Search group',
    noGroupsTitle: 'No groups yet',
    noGroupsBody: 'Attendance is recorded within a group. Add a class’s subjects from Groups so attendance can be taken.',
    sessionCountOne: 'session',
    sessionCountMany: 'sessions',
    emptyGroupTitle: 'This group has no attendance recorded',
    emptyGroupBody: 'Record attendance for one of its sessions. Only this group’s sessions are offered.',
    title: 'Attendance',
    create: 'Record attendance',
    edit: 'Edit attendance',
    emptyTitle: 'No attendance recorded yet',
    emptyBody: 'Record a session’s attendance to keep track of it.',
    fields: {
      comment: 'Comment',
    },
  },

  billing: {
    title: 'Fee status',
    intro: 'What each student owes for the year, based on their stage fee and what has already been collected.',
    searchStudents: 'Search student',
    emptyTitle: 'No students yet',
    emptyBody: 'The fee status is worked out from the school’s students and their class stage.',
    noFee: 'No fee set',
    settled: 'Up to date',
    due: 'Outstanding',
    fields: {
      stage: 'Stage',
      fee: 'Course fee',
      paid: 'Collected',
      outstanding: 'Outstanding',
    },
  },

  payments: {
    filters: {
      pending: 'Pending payments only',
    },
    title: 'Payments',
    create: 'Record payment',
    edit: 'Edit payment',
    emptyTitle: 'No payments yet',
    emptyBody: 'Record the school’s payments to keep track of them.',
    fields: {
      stageFee: 'Student’s fee',
      noStage: 'No stage assigned',
      amount: 'Amount',
      period: 'Period',
      periodHint: 'For example: “October 2025” or “First term”.',
      paidAt: 'Payment date',
      method: 'Payment method',
      reference: 'Reference',
      enrollmentHint: 'Must be an enrolment of the selected student.',
    },
  },

  users: {
    title: 'Users',
    create: 'New account',
    edit: 'Edit account',
    emptyTitle: 'No accounts yet',
    emptyBody: 'Create staff accounts so they can access the application.',
    fields: {
      name: 'Name',
      username: 'Username',
      usernameHint: 'It signs you in, and so does the email address.',
      password: 'Password',
      passwordHint: 'When editing, leave blank to keep it unchanged. Minimum 8 characters.',
      role: 'Role',
      organizationHint: 'A platform administrator belongs to no school.',
      teacherProfile: 'Teacher record',
      teacherProfileHint: 'Links the account to its record. Without it, the teacher sees no groups or sessions.',
    },
  },

  organizations: {
    title: 'Organisations',
    create: 'New organisation',
    edit: 'Edit organisation',
    emptyTitle: 'No organisations yet',
    emptyBody: 'Each organisation is a school with its own data.',
    suspend: 'Suspend',
    activate: 'Activate',
    suspended: 'Organisation suspended. Its staff lose access.',
    activated: 'Organisation activated.',
    fields: {
      name: 'School',
      slug: 'Identifier',
      slugHint: 'Derived from the name if left blank.',
      contactEmail: 'Contact email',
      contactPhone: 'Contact phone',
      users: 'Users',
    },
  },

  status: {
    active: 'Active',
    inactive: 'Inactive',
    suspended: 'Suspended',
  },

  attendanceStatus: {
    present: 'Present',
    absent: 'Absent',
    late: 'Late',
    excused: 'Excused',
  },

  sessionStatus: {
    taught: 'Taught',
    pending: 'Pending',
  },

  paymentStatus: {
    paid: 'Paid',
    pending: 'Pending',
    cancelled: 'Cancelled',
  },

  paymentMethod: {
    cash: 'Cash',
    card: 'Card',
    transfer: 'Bank transfer',
  },

  fields: {
    firstName: 'First name',
    lastName: 'Surname',
    email: 'Email',
    phone: 'Phone',
    address: 'Address',
    notes: 'Notes',
    status: 'Status',
    name: 'Name',
    code: 'Code',
    level: 'Level',
    description: 'Description',
    date: 'Date',
    student: 'Student',
    guardian: 'Guardian',
    teacher: 'Teacher',
    subject: 'Subject',
    group: 'Group',
    session: 'Session',
    enrollment: 'Enrolment',
    organization: 'School',
  },
}
