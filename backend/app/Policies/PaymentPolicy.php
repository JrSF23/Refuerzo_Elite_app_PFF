<?php

namespace App\Policies;

/**
 * Gestión de pagos: competencia exclusiva de la administración del centro.
 *
 * Profesor y super administrador quedan denegados.
 *
 * Los pagos son el caso más estricto: el profesor no accede a información
 * económica en NINGUNA forma, ni siquiera a la de los alumnos de sus propios
 * grupos (FR-016).
 */
class PaymentPolicy extends OrganizationAdminOnlyPolicy
{
}
