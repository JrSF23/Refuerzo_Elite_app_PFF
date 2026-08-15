<?php

namespace App\Policies;

/**
 * Gestión de matrículas: competencia exclusiva de la administración del centro.
 *
 * Profesor y super administrador quedan denegados.
 */
class EnrollmentPolicy extends OrganizationAdminOnlyPolicy
{
}
