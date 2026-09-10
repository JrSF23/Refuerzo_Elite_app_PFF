<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

/*
 * ── Limpieza de tokens caducados ────────────────────────────────────────────
 *
 * Los tokens de Sanctum CADUCAN solos: con `sanctum.expiration` en 1440, el
 * guard rechaza cualquiera cuyo `created_at` tenga más de 24 horas. Eso ya
 * estaba bien y no es lo que se arregla aquí.
 *
 * Lo que no ocurría es BORRAR la fila. Un token caducado sigue ocupando sitio en
 * `personal_access_tokens` para siempre, y la tabla crece con cada inicio de
 * sesión de cada persona, sin techo. En la base de la demo había 32 filas de las
 * que 31 estaban caducadas, la más antigua de hacía tres semanas.
 *
 * No es un agujero de seguridad —lo guardado es el hash, no el token, y además
 * está caducado— pero sí una tabla que solo crece.
 *
 * `--hours=24` deja un margen sobre la caducidad: se borra lo que lleva al menos
 * un día caducado, no lo que acaba de caducar. Así una petición en vuelo con un
 * token recién vencido recibe «no autorizado», que es lo correcto, y no un fallo
 * raro por haberle desaparecido la fila debajo.
 *
 * ── OJO: esto no se ejecuta solo ────────────────────────────────────────────
 *
 * `docker-compose.yml` levanta nginx, PHP-FPM y MySQL. NINGUNO ejecuta
 * `schedule:run`, así que esta tarea está declarada pero inerte. Para que corra
 * hace falta un proceso más —un contenedor con `php artisan schedule:work`, o
 * una entrada de cron en el anfitrión llamando a `schedule:run` cada minuto—.
 *
 * Se declara igual: cuando ese proceso exista, la limpieza empieza sin que nadie
 * tenga que acordarse. Mientras tanto se lanza a mano.
 */
Schedule::command('sanctum:prune-expired --hours=24')
    ->daily()
    ->description('Retira los tokens caducados de personal_access_tokens');
