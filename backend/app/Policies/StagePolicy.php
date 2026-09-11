<?php

namespace App\Policies;

/**
 * Etapas educativas: competencia exclusiva de la administración del centro.
 *
 * La etapa lleva la CUOTA, así que entra de lleno en el invariante FR-016: el
 * profesor no accede a ninguna información económica. Profesor y super
 * administrador quedan denegados.
 */
class StagePolicy extends OrganizationAdminOnlyPolicy
{
}
