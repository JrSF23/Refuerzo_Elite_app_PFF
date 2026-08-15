<?php

/**
 * Textos de usuario de la feature multi-organización.
 *
 * Español es el idioma por defecto (Principio XII). Ningún mensaje visible al
 * usuario debe escribirse directamente en el código: los que quedan en francés
 * dentro de la aplicación son deuda anterior a la constitución y se extraen en la
 * feature de internacionalización, no aquí.
 */
return [

    // ── Acceso ───────────────────────────────────────────────────────────────
    'access' => [
        'no_organization' => 'Su cuenta no está asociada a ningún centro. Contacte con la administración.',
        'organization_suspended' => 'El acceso a este centro está suspendido temporalmente. Contacte con la administración de la plataforma.',
        'organization_unavailable' => 'Este centro ya no está disponible. Contacte con la administración de la plataforma.',
    ],

    // ── Gestión de organizaciones ────────────────────────────────────────────
    'organizations' => [
        'has_active_users' => 'La organización tiene usuarios activos: suspéndala antes de eliminarla.',
        'deleted' => 'Organización eliminada. Sus datos permanecen y son recuperables.',
    ],

    // ── Gestión de cuentas ───────────────────────────────────────────────────
    'users' => [
        'deleted' => 'Cuenta eliminada. La ficha de profesor, si la había, se conserva.',
        'teacher_profile_other_organization' => 'La ficha de profesor pertenece a otro centro.',
        'teacher_profile_already_linked' => 'Esa ficha de profesor ya está vinculada a otra cuenta.',
        'platform_admin_without_organization' => 'Un super administrador de plataforma no pertenece a ninguna organización.',
    ],

];
