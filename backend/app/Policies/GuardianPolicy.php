<?php

namespace App\Policies;

/**
 * Gestión de tutores: competencia exclusiva de la administración del centro.
 *
 * Profesor y super administrador quedan denegados.
 */
class GuardianPolicy extends OrganizationAdminOnlyPolicy
{
}
