<?php

namespace App\Policies;

/**
 * Gestión de asignaturas: competencia exclusiva de la administración del centro.
 *
 * Profesor y super administrador quedan denegados.
 */
class SubjectPolicy extends OrganizationAdminOnlyPolicy
{
}
