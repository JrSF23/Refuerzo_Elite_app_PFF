/**
 * Catalogue des textes en français.
 *
 * Même structure que `es.js`, clé par clé : c'est ce qui permet de vérifier
 * automatiquement qu'aucune ne manque. Toute clé absente ici retombe sur
 * l'espagnol, langue de base.
 *
 * Ce qui NE se traduit pas : les clés des états de domaine (`status.active`,
 * `attendanceStatus.present`…) sont les valeurs que renvoie l'API et font partie
 * du contrat. Seul le texte affiché change.
 */

export const fr = {
  app: {
    name: 'SmartWork',
    tagline: 'Gestion d’établissements scolaires',
  },

  common: {
    save: 'Enregistrer',
    saveChanges: 'Enregistrer les modifications',
    cancel: 'Annuler',
    create: 'Créer',
    edit: 'Modifier',
    delete: 'Supprimer',
    confirm: 'Confirmer',
    close: 'Fermer',
    retry: 'Réessayer',
    back: 'Retour',
    search: 'Rechercher',
    clear: 'Effacer',
    view: 'Voir',
    clearFilter: 'Retirer le filtre',
    select: 'Sélectionnez',
    noOptions: 'Aucune option disponible',

    typeToSearch: 'Saisissez pour rechercher…',
    clearSelection: 'Retirer la sélection',
    noResultsFor: 'Aucun résultat pour « {term} ».',
    showAll: 'Voir toutes les options',
    unresolvedOption: 'Enregistrement indisponible',
    moreResults: '{shown} résultats affichés sur {total}. Affinez la recherche.',
    truncatedOptions: 'Les {shown} premières options sur {total} sont affichées.',
    optionsAvailable: {
      one: '{count} option disponible',
      many: '{count} options disponibles',
    },

    actions: 'Actions',
    viewAll: 'Tout voir',

    datePlaceholder: 'jj/mm/aaaa',
    openCalendar: 'Ouvrir le calendrier',
    invalidDate: 'La date n’est pas valide. Utilisez le format jj/mm/aaaa.',

    loading: 'Chargement…',
    saving: 'Enregistrement…',
    required: 'obligatoire',
    optional: 'facultatif',
    emptyValue: '—',

    previous: 'Précédent',
    next: 'Suivant',
    pagePosition: 'Page {current} sur {total}',
    showingRange: 'Affichage de {from}–{to} sur {total}',
    totalRecords: {
      one: '{count} enregistrement',
      many: '{count} enregistrements',
    },

    errorTitle: 'Impossible de charger les données',
    errorBody: 'Un problème est survenu lors de la connexion au serveur.',
    networkError: 'Aucune connexion au serveur. Vérifiez votre réseau et réessayez.',
    unreachableTitle: 'Impossible de joindre le serveur',
    unexpectedError: 'Une erreur inattendue est survenue.',
    notFoundTitle: 'Enregistrement introuvable',
    notFoundBody: 'Il a peut-être été supprimé. Revenez à la liste pour continuer.',
    forbiddenTitle: 'Accès refusé',
    tooManyRequests: 'Trop de tentatives. Patientez un instant avant de réessayer.',

    created: 'Enregistrement créé.',
    savedChanges: 'Modifications enregistrées.',
    deleted: 'Enregistrement supprimé.',
    noRecordsTitle: 'Aucun enregistrement pour le moment',

    deleteTitle: 'Supprimer {name}',
    deleteBody: 'Confirmez-vous la suppression de « {name} » ? Cette action est irréversible.',

    noResultsTitle: 'Aucun résultat',
    noResultsBody: 'Aucun enregistrement ne correspond à « {term} ».',

    crashTitle: 'Une erreur est survenue',
    crashBody: 'Une erreur inattendue s’est produite et l’écran n’a pas pu s’afficher. Vous pouvez réessayer ou revenir à l’accueil.',
    backToStart: 'Revenir à l’accueil',

    sectionPendingTitle: 'Section en construction',
    sectionPendingBody: 'Cette section sera disponible dans une prochaine version.',
  },

  auth: {
    showPassword: 'Afficher le mot de passe',
    hidePassword: 'Masquer le mot de passe',
    title: 'Connexion',
    subtitle: 'Saisissez vos identifiants pour entrer.',
    login: 'Identifiant ou e-mail',
    loginHint: 'Vous pouvez utiliser votre nom d’utilisateur ou votre adresse e-mail.',
    password: 'Mot de passe',
    submit: 'Se connecter',
    submitting: 'Connexion…',
    logout: 'Se déconnecter',
    sessionExpired: 'Votre session a expiré. Reconnectez-vous.',
    genericError: 'Connexion impossible. Réessayez.',
  },

  nav: {
    label: 'Navigation principale',
    open: 'Ouvrir la navigation',
    close: 'Fermer la navigation',
    skipToContent: 'Aller au contenu',
    sectionManagement: 'Gestion',
    sectionAcademic: 'Activité scolaire',
    sectionFinance: 'Encaissements',
    sectionAdmin: 'Administration',
    sectionPlatform: 'Plateforme',
  },

  roles: {
    super_admin: 'Plateforme',
    org_admin: 'Administration',
    teacher: 'Enseignant',
    none: 'Aucun rôle',
  },

  organization: {
    suspendedTitle: 'Établissement suspendu',
    suspendedBody: 'L’accès aux données de cet établissement est suspendu. Contactez l’administration de la plateforme.',
    unavailableTitle: 'Établissement indisponible',
    missingTitle: 'Aucun établissement attribué',
    missingBody: 'Votre compte n’est rattaché à aucun établissement. Contactez l’administration.',
  },

  theme: {
    darkMode: 'Mode sombre',
  },

  language: {
    label: 'Langue',
    change: 'Changer de langue',
  },

  dashboard: {
    title: 'Tableau de bord',

    greetingMorning: 'Bonjour, {name} !',
    greetingAfternoon: 'Bon après-midi, {name} !',
    greetingEvening: 'Bonsoir, {name} !',

    stats: {
      students: 'Élèves',
      teachers: 'Enseignants',
      groups: 'Groupes',
      attendances: 'Relevés de présence',
      attendanceRate: 'Présence',
      payments: 'Paiements',
      pendingPayments: 'Paiements en attente',
      needsAttention: 'À traiter',
      myGroups: 'Mes groupes',
      myStudents: 'Mes élèves',
      upcomingSessions: 'Prochaines séances',
    },

    attendance: {
      title: 'Présence',
      noTrend: 'Aucune présence enregistrée cette semaine.',
      // Initiales des jours : mardi et mercredi commencent tous deux par M, d'où
      // les deux lettres pour les distinguer.
      days: {
        mon: 'L',
        tue: 'Ma',
        wed: 'Me',
        thu: 'J',
        fri: 'V',
      },
      delta: {
        up: '{value} points de plus que la semaine dernière',
        down: '{value} points de moins que la semaine dernière',
        flat: 'Identique à la semaine dernière',
      },
    },

    attention: {
      title: 'À traiter',
      pendingPayments: '{count} paiements en attente d’encaissement',
      lowAttendance: '{count} élèves avec une présence inférieure à 75 %',
      groupsWithoutTeacher: '{count} groupes sans enseignant attribué',
      groupsSubjectMismatch: '{count} groupes dont l’enseignant n’assure pas cette matière',
    },

    recentStudents: 'Dernières inscriptions',
    recentSessions: 'Dernières séances',
    recentPayments: 'Derniers paiements',
    myGroups: 'Mes groupes',
    upcomingSessions: 'Prochaines séances',
    groupStudents: '{count} élèves',
    teacherUnlinkedTitle: 'Compte sans fiche enseignant',
    teacherUnlinkedBody: 'Votre compte n’est pas encore lié à une fiche enseignant : aucun groupe ni séance ne s’affiche. Demandez à l’administration de l’établissement de compléter la liaison.',
    emptyStudents: 'Aucun élève inscrit pour le moment.',
    emptySessions: 'Aucune séance enregistrée pour le moment.',
    emptyPayments: 'Aucun paiement enregistré pour le moment.',
    emptyGroups: 'Aucun groupe ne vous est attribué.',
    emptyUpcoming: 'Vous n’avez aucune séance à venir.',
    noGuardian: 'Aucun tuteur attribué',
  },

  students: {
    filters: {
      lowAttendance: 'Uniquement les élèves peu assidus',
    },
    title: 'Élèves',
    create: 'Nouvel élève',
    edit: 'Modifier l’élève',
    emptyTitle: 'Aucun élève pour le moment',
    emptyBody: 'Inscrivez le premier élève pour commencer à créer des inscriptions et faire l’appel.',
    groupsIntro: 'Choisissez une classe pour voir et gérer ses élèves.',
    searchGroups: 'Rechercher une classe',
    viewAllStudents: 'Voir tous les élèves',
    allStudents: 'Tous les élèves',
    noGroupsTitle: 'Aucune classe pour le moment',
    noGroupsBody: 'Créez les groupes de l’année pour pouvoir organiser les élèves.',
    countLabelOne: 'élève',
    countLabelMany: 'élèves',
    emptyGroupTitle: 'Ce groupe n’a aucun élève',
    emptyGroupBody: 'Inscrivez un élève ou changez-le de groupe depuis sa fiche.',
    emptyUnassignedBody: 'Tous les élèves ont déjà un groupe attribué.',
    unassignedGroup: 'Sans groupe attribué',
    unassignedHint: 'Attribuez un groupe à ces élèves depuis leur fiche.',
    countOne: '{count} élève',
    countMany: '{count} élèves',
    pagedBlocksNotice: 'Les blocs correspondent à la page affichée. Un groupe comptant beaucoup d’élèves peut se poursuivre sur la suivante.',
    fields: {
      attendance: 'Assiduité',
      fullName: 'Élève',
      dateOfBirth: 'Date de naissance',
      schoolName: 'Établissement d’origine',
      schoolLevel: 'Niveau',
      tutorGroup: 'Groupe',
      tutorGroupHint: 'La classe à laquelle il appartient. À ne pas confondre avec les groupes de matière.',
    },
  },

  guardians: {
    title: 'Tuteurs',
    create: 'Nouveau tuteur',
    edit: 'Modifier le tuteur',
    emptyTitle: 'Aucun tuteur pour le moment',
    emptyBody: 'Les tuteurs sont les responsables à contacter pour chaque élève.',
    fields: {
      fullName: 'Tuteur',
      relationship: 'Lien de parenté',
      relationshipHint: 'Par exemple : mère, père, grand-mère, tuteur légal.',
    },
  },

  teachers: {
    title: 'Enseignants',
    create: 'Nouvel enseignant',
    edit: 'Modifier l’enseignant',
    emptyTitle: 'Aucun enseignant pour le moment',
    emptyBody: 'Les fiches enseignant sont nécessaires pour pouvoir attribuer des groupes.',
    fields: {
      fullName: 'Enseignant',
      specialty: 'Spécialité',
      subjectHint: 'Détermine les groupes et les séances auxquels son compte accède. Sans matière, l’enseignant se connecte mais ne voit aucun groupe.',
      bio: 'Présentation',
    },
  },

  stages: {
    title: 'Niveaux',
    create: 'Nouveau niveau',
    edit: 'Modifier le niveau',
    emptyTitle: 'Aucun niveau pour le moment',
    emptyBody: 'Le niveau fixe ce que paie un élève. Créez-les avant d’attribuer des classes : Pré-scolaire, Primaire, ESBA et Baccalauréat sont ceux du système éducatif de Guinée équatoriale.',
    fields: {
      name: 'Niveau',
      fee: 'Frais de scolarité',
      feeHint: 'Montant de l’année scolaire complète. Fixé par votre établissement ; le paiement échelonné est possible.',
      groups: 'Classes',
      order: 'Ordre',
      orderHint: 'Ordre d’affichage. Le plus petit d’abord, pour les lister par niveau et non par alphabet.',
    },
  },

  subjects: {
    title: 'Matières',
    create: 'Nouvelle matière',
    edit: 'Modifier la matière',
    emptyTitle: 'Aucune matière pour le moment',
    emptyBody: 'Chaque groupe porte sur une matière : c’est donc la première étape.',
    fields: {
      codeHint: 'Identifiant court et unique au sein de l’établissement.',
    },
  },

  tutorGroups: {
    title: 'Groupes',
    create: 'Nouveau groupe',
    edit: 'Modifier le groupe',
    emptyTitle: 'Aucun groupe pour le moment',
    emptyBody: 'Créez les groupes de l’année pour organiser les élèves par classe.',
    unassigned: 'Non attribué',
    shifts: {
      morning: 'Matin',
      afternoon: 'Après-midi',
    },
    fields: {
      stage: 'Niveau',
      stageHint: 'Détermine les frais que paient ses élèves. Sans niveau, la classe fonctionne mais ses élèves n’ont aucun montant attribué.',
      name: 'Groupe',
      nameHint: 'Tel que l’appelle l’établissement : « 6e », « 5e - A ».',
      shift: 'Vacation',
      academicYear: 'Année scolaire',
      tutor: 'Professeur principal',
      tutorHint: 'Peut rester non attribué et être désigné plus tard.',
      representative: 'Élève délégué',
      representativeHint: 'Seuls les élèves de ce groupe peuvent être désignés.',
      representativeOnCreate: 'Disponible à la modification, lorsque le groupe aura des élèves',
      sortOrder: 'Ordre',
      sortOrderHint: 'Fixe l’ordre d’affichage des groupes. Plus le nombre est petit, plus il apparaît haut.',
    },
  },

  classGroups: {
    filters: {
      withoutTeacher: 'Uniquement les groupes sans enseignant',
      subjectMismatch: 'Uniquement les groupes dont l’enseignant enseigne une autre matière',
    },
    subjectsOf: 'Matières',
    emptyGroupTitle: 'Ce groupe n’assure encore aucune matière',
    emptyGroupBody: 'Ajoutez les matières enseignées dans ce groupe et qui les assure. Sans au moins une, impossible d’enregistrer des séances ni de faire l’appel.',
    title: 'Groupes de matière',
    create: 'Nouveau groupe de matière',
    edit: 'Modifier le groupe de matière',
    emptyTitle: 'Aucun groupe de matière pour le moment',
    emptyBody: 'Chaque groupe porte sur une matière. Créez d’abord les matières et les enseignants.',
    fields: {
      teacherHint: 'Qui assure cette matière dans ce groupe. Peut rester non attribué.',
      nameInGroupHint: 'Tel que l’appelle l’établissement. Le laisser vide ne pose pas de problème : ce qui s’affiche dans les listes est « groupe — matière ».',
      name: 'Groupe',
      codeHint: 'Identifiant court et unique au sein de l’établissement.',
      academicYear: 'Année scolaire',
      schedule: 'Horaire',
      capacity: 'Capacité',
      startDate: 'Date de début',
      endDate: 'Date de fin',
    },
  },

  enrollments: {
    title: 'Inscriptions',
    create: 'Nouvelle inscription',
    edit: 'Modifier l’inscription',
    emptyTitle: 'Aucune inscription pour le moment',
    emptyBody: 'L’inscription relie un élève à un groupe de matière et fixe son montant.',
    fields: {
      enrolledAt: 'Date d’inscription',
      amount: 'Montant',
      amountHint: 'Montant convenu pour cet élève dans ce groupe.',
    },
  },

  sessions: {
    title: 'Séances',
    create: 'Nouvelle séance',
    edit: 'Modifier la séance',
    emptyTitle: 'Aucune séance pour le moment',
    emptyBody: 'Créez les séances d’un groupe pour pouvoir enregistrer sa présence.',
    fields: {
      title: 'Séance',
      date: 'Date',
      time: 'Horaire',
      startsAt: 'Heure de début',
      endsAt: 'Heure de fin',
      room: 'Salle',
      taught: 'Assurée',
    },
    markTaught: 'Marquer comme assurée',
    markTitle: 'Marquer « {name} » comme assurée',
    marked: 'Séance marquée comme assurée.',
    markConfirm: 'Marquer « {name} » comme assurée ? Cette marque est irréversible.',
    taughtBy: 'Marquée par {name}',
  },

  attendance: {
    sessionsIntro: 'Choisissez une séance et faites l’appel. Le groupe compte {count} élèves inscrits.',
    noSessionsTitle: 'Ce groupe n’a aucune séance',
    noSessionsBody: 'Créez une séance depuis Séances pour pouvoir en faire l’appel.',
    history: {
      title: 'Appels enregistrés',
      intro: 'Les appels déjà faits, du plus récent au plus ancien. Cliquez sur l’un d’eux pour le consulter ou le corriger.',
      review: 'Consulter',
      emptyTitle: 'Vous n’avez encore fait aucun appel',
      emptyBody: 'Les appels que vous enregistrerez apparaîtront ici, regroupés par séance.',
    },
    roll: {
      title: 'Faire l’appel',
      open: 'Faire l’appel',
      save: 'Enregistrer l’appel',
      saved: 'Appel enregistré : {count} élèves.',
      unset: 'Non marqué',
      unmarked: 'Il reste {count} élèves non marqués.',
      markRestPresent: 'Marquer le reste comme présents',
      nothingToSave: 'Vous n’avez marqué aucun élève.',
      noStudents: 'Ce groupe n’a aucun élève inscrit.',
      complete: 'Appel complet',
      progress: '{marked} sur {total}',
    },
    groupsIntro: 'Choisissez un groupe pour consulter et enregistrer sa présence. Chaque groupe a son propre décompte et sa propre liste.',
    searchGroups: 'Rechercher un groupe',
    noGroupsTitle: 'Aucun groupe pour le moment',
    noGroupsBody: 'La présence s’enregistre dans un groupe. Ajoutez les matières d’une classe depuis Groupes pour pouvoir faire l’appel.',
    sessionCountOne: 'séance',
    sessionCountMany: 'séances',
    emptyGroupTitle: 'Ce groupe n’a aucune présence enregistrée',
    emptyGroupBody: 'Enregistrez la présence de l’une de ses séances. Seules les séances de ce groupe sont proposées.',
    title: 'Présence',
    create: 'Enregistrer la présence',
    edit: 'Modifier la présence',
    emptyTitle: 'Aucune présence enregistrée pour le moment',
    emptyBody: 'Enregistrez la présence d’une séance pour en assurer le suivi.',
    fields: {
      comment: 'Commentaire',
    },
  },

  billing: {
    title: 'État des encaissements',
    intro: 'Ce que chaque élève doit pour l’année, selon les frais de son niveau et ce qui a déjà été encaissé.',
    searchStudents: 'Rechercher un élève',
    emptyTitle: 'Aucun élève pour le moment',
    emptyBody: 'L’état des encaissements se calcule à partir des élèves de l’établissement et du niveau de leur classe.',
    noFee: 'Sans montant',
    settled: 'À jour',
    due: 'En attente',
    fields: {
      stage: 'Niveau',
      fee: 'Frais de scolarité',
      paid: 'Encaissé',
      outstanding: 'Restant dû',
    },
  },

  payments: {
    filters: {
      pending: 'Uniquement les paiements en attente',
    },
    title: 'Paiements',
    create: 'Enregistrer un paiement',
    edit: 'Modifier le paiement',
    emptyTitle: 'Aucun paiement pour le moment',
    emptyBody: 'Enregistrez les encaissements de l’établissement pour en assurer le suivi.',
    fields: {
      stageFee: 'Frais de l’élève',
      noStage: 'Aucun niveau attribué',
      amount: 'Montant',
      period: 'Période',
      periodHint: 'Par exemple : « Octobre 2025 » ou « 1er trimestre ».',
      paidAt: 'Date de paiement',
      method: 'Mode de paiement',
      reference: 'Référence',
      enrollmentHint: 'Doit être une inscription de l’élève sélectionné.',
    },
  },

  users: {
    title: 'Utilisateurs',
    create: 'Nouveau compte',
    edit: 'Modifier le compte',
    emptyTitle: 'Aucun compte pour le moment',
    emptyBody: 'Créez les comptes du personnel pour qu’il puisse accéder à l’application.',
    fields: {
      name: 'Nom',
      username: 'Identifiant',
      usernameHint: 'Il permet de se connecter, tout comme l’adresse e-mail.',
      password: 'Mot de passe',
      passwordHint: 'À la modification, laissez vide pour ne pas le changer. 8 caractères minimum.',
      role: 'Rôle',
      organizationHint: 'Un administrateur de plateforme n’appartient à aucun établissement.',
      teacherProfile: 'Fiche enseignant',
      teacherProfileHint: 'Relie le compte à sa fiche. Sans elle, l’enseignant ne voit ni groupes ni séances.',
    },
  },

  organizations: {
    title: 'Organisations',
    create: 'Nouvelle organisation',
    edit: 'Modifier l’organisation',
    emptyTitle: 'Aucune organisation pour le moment',
    emptyBody: 'Chaque organisation est un établissement scolaire avec ses propres données.',
    suspend: 'Suspendre',
    activate: 'Activer',
    suspended: 'Organisation suspendue. Son personnel perd l’accès.',
    activated: 'Organisation activée.',
    fields: {
      name: 'Établissement',
      slug: 'Identifiant',
      slugHint: 'Dérivé du nom s’il est laissé vide.',
      contactEmail: 'E-mail de contact',
      contactPhone: 'Téléphone de contact',
      users: 'Utilisateurs',
    },
  },

  status: {
    active: 'Actif',
    inactive: 'Inactif',
    suspended: 'Suspendu',
  },

  attendanceStatus: {
    present: 'Présent',
    absent: 'Absent',
    late: 'En retard',
    excused: 'Excusé',
  },

  sessionStatus: {
    taught: 'Assurée',
    pending: 'En attente',
  },

  paymentStatus: {
    paid: 'Payé',
    pending: 'En attente',
    cancelled: 'Annulé',
  },

  paymentMethod: {
    cash: 'Espèces',
    card: 'Carte',
    transfer: 'Virement',
  },

  fields: {
    firstName: 'Prénom',
    lastName: 'Nom',
    email: 'E-mail',
    phone: 'Téléphone',
    address: 'Adresse',
    notes: 'Observations',
    status: 'Statut',
    name: 'Nom',
    code: 'Code',
    level: 'Niveau',
    description: 'Description',
    date: 'Date',
    student: 'Élève',
    guardian: 'Tuteur',
    teacher: 'Enseignant',
    subject: 'Matière',
    group: 'Groupe',
    session: 'Séance',
    enrollment: 'Inscription',
    organization: 'Établissement',
  },
}
