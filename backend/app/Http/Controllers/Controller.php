<?php

namespace App\Http\Controllers;

use Illuminate\Foundation\Auth\Access\AuthorizesRequests;

/**
 * Laravel 12 ya no incluye AuthorizesRequests en el controlador base. Se añade
 * aquí para que `authorize()` esté disponible en toda la API: las policies son el
 * mecanismo de autorización del proyecto (Principio IV) y conviene que no haya
 * que recordar importarlas controlador a controlador.
 */
abstract class Controller
{
    use AuthorizesRequests;
}
