<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\App;
use Symfony\Component\HttpFoundation\Response;

/**
 * El idioma de la respuesta lo decide quien pregunta.
 *
 * Todo lo que el servidor DICE —errores de validación, avisos, mensajes de
 * acceso— tiene que salir en el idioma que la persona eligió en la interfaz. Sin
 * esto, cambiar a francés traducía la pantalla pero el primer formulario
 * incompleto respondía «El campo estado es obligatorio», y la mezcla delata que
 * la traducción es de fachada.
 *
 * Lo que el usuario ESCRIBIÓ no se toca nunca: nombres, observaciones, títulos
 * de sesión. Eso son datos, no mensajes, y traducirlos sería corromperlos.
 *
 * ── Por qué `Accept-Language` y no un parámetro ─────────────────────────────
 *
 * Es la cabecera que existe para esto, la manda el cliente en cada petición y no
 * ensucia ninguna URL. Un parámetro habría que añadirlo a mano en cada llamada y
 * se olvidaría en la mitad.
 *
 * ── Lista blanca, no lo que llegue ──────────────────────────────────────────
 *
 * Solo se aceptan los idiomas que el producto tiene. `App::setLocale()` con una
 * cadena arbitraria hace que Laravel busque ficheros de un directorio que no
 * existe y devuelva las claves crudas —«validation.required»— en toda la
 * respuesta. La cabecera la manda el cliente, así que no se da por buena.
 */
class SetLocaleFromRequest
{
    /** Los idiomas que el producto tiene traducidos. */
    private const SUPPORTED = ['es', 'fr', 'en'];

    public function handle(Request $request, Closure $next): Response
    {
        $locale = $this->negotiate($request->header('Accept-Language'));

        if ($locale !== null) {
            App::setLocale($locale);
        }

        return $next($request);
    }

    /**
     * Primer idioma soportado de los que pide el cliente.
     *
     * `Accept-Language` puede venir como «fr-FR,fr;q=0.9,es;q=0.8»: se recorre en
     * orden y se toma el primero que tengamos, comparando solo las dos primeras
     * letras. La variante regional no importa aquí —el francés de Francia y el de
     * Guinea Ecuatorial comparten catálogo— y exigirla dejaría fuera a casi todo
     * el mundo.
     *
     * Devuelve `null` si no hay ninguno, y entonces se conserva el idioma por
     * defecto de la aplicación en lugar de imponer uno.
     */
    private function negotiate(?string $header): ?string
    {
        if ($header === null || trim($header) === '') {
            return null;
        }

        foreach (explode(',', $header) as $part) {
            // Se descarta el factor de calidad: el orden de aparición ya expresa
            // la preferencia en la práctica totalidad de los navegadores.
            $tag = trim(explode(';', $part)[0]);
            $base = strtolower(substr($tag, 0, 2));

            if (in_array($base, self::SUPPORTED, true)) {
                return $base;
            }
        }

        return null;
    }
}
