<?php

namespace App\Policies;

/**
 * Gestión de fichas de profesor: competencia exclusiva de la administración del centro.
 *
 * Profesor y super administrador quedan denegados.
 */
class TeacherPolicy extends OrganizationAdminOnlyPolicy
{
}
