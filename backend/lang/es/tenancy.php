<?php

/**
 * Textos de usuario de la feature multi-organización.
 *
 * Español es el idioma por defecto (Principio XII). Ningún mensaje visible al
 * usuario debe escribirse directamente en el código.
 *
 * Ya no queda ninguno en francés: el último, `Identifiants invalides.` del acceso,
 * se extrajo a `auth.php` en la fase 1 de la feature 002. Los mensajes de
 * validación de Laravel viven en `validation.php`, que tampoco existía y hacía
 * que toda la validación cayera al inglés.
 */
return [

    // ── Acceso ───────────────────────────────────────────────────────────────
    'access' => [
        'no_organization' => 'Su cuenta no está asociada a ningún centro. Contacte con la administración.',
        'organization_suspended' => 'El acceso a este centro está suspendido temporalmente. Contacte con la administración de la plataforma.',
        'organization_unavailable' => 'Este centro ya no está disponible. Contacte con la administración de la plataforma.',
        'role_denied' => 'Acceso denegado para este perfil.',
    ],

    // ── Operaciones sobre registros ──────────────────────────────────────────
    'records' => [
        'deleted' => 'Registro eliminado correctamente.',
    ],

    // ── Pagos ────────────────────────────────────────────────────────────────
    'payments' => [
        'enrollment_mismatch' => 'La matrícula seleccionada no pertenece a este alumno.',
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
