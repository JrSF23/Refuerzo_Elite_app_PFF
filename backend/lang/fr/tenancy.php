<?php

/**
 * Textes de la fonctionnalité multi-établissement, en français.
 *
 * Mêmes clés que `lang/es/tenancy.php`, à l'identique : c'est ce qui permet à un
 * test de vérifier qu'aucune ne manque.
 */

return [

    'access' => [
        'no_organization' => 'Votre compte n’est rattaché à aucun établissement. Contactez l’administration.',
        'organization_suspended' => 'L’accès à cet établissement est temporairement suspendu. Contactez l’administration de la plateforme.',
        'organization_unavailable' => 'Cet établissement n’est plus disponible. Contactez l’administration de la plateforme.',
        'role_denied' => 'Accès refusé pour ce profil.',
    ],

    'records' => [
        'deleted' => 'Enregistrement supprimé.',
    ],

    'tutor_groups' => [
        'representative_on_create' => 'Impossible de désigner un délégué à la création du groupe : il n’a encore aucun élève. Créez le groupe, rattachez des élèves, puis désignez.',
        'representative_other_group' => 'L’élève sélectionné appartient à un autre groupe. Le délégué doit être un élève de ce groupe.',
    ],

    'class_sessions' => [
        'already_taught' => 'Cette séance est déjà marquée comme assurée. La marque est irréversible : en cas d’erreur, l’administration doit supprimer la séance.',
    ],

    'payments' => [
        'enrollment_mismatch' => 'L’inscription sélectionnée n’appartient pas à cet élève.',
    ],

    'organizations' => [
        'has_active_users' => 'L’organisation a des utilisateurs actifs : suspendez-la avant de la supprimer.',
        'deleted' => 'Organisation supprimée. Ses données subsistent et restent récupérables.',
    ],

    'users' => [
        'deleted' => 'Compte supprimé. La fiche enseignant, s’il y en avait une, est conservée.',
        'teacher_profile_other_organization' => 'La fiche enseignant appartient à un autre établissement.',
        'teacher_profile_already_linked' => 'Cette fiche enseignant est déjà liée à un autre compte.',
        'platform_admin_without_organization' => 'Un super administrateur de plateforme n’appartient à aucune organisation.',
    ],

];
