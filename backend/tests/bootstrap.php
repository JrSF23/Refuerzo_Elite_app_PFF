<?php

/**
 * Arranque de la suite. Existe para UNA cosa: que `phpunit.xml` mande de verdad.
 *
 * ── El problema ─────────────────────────────────────────────────────────────
 *
 * `phpunit.xml` declara `DB_CONNECTION`, `DB_DATABASE`, `CACHE_STORE` y compañía
 * con `force="true"`, y PHPUnit cumple: las escribe en `putenv()` y en `$_ENV`.
 * Pero NO toca `$_SERVER`.
 *
 * Y `$_SERVER` es justo donde aterrizan las variables que Docker inyecta en el
 * contenedor. El repositorio de entorno de Laravel consulta sus adaptadores en
 * orden y `$_SERVER` va el primero, así que `env('DB_CONNECTION')` devolvía
 * `mysql` —la de producción— mientras `getenv()` devolvía `sqlite`.
 *
 * Medido dentro del contenedor antes de escribir esto:
 *
 *     getenv()  = 'sqlite'      $_ENV = 'sqlite'      $_SERVER = 'mysql'
 *
 * Con `DB_DATABASE` apuntando a la base que sirve la aplicación, el primer test
 * con RefreshDatabase o DatabaseMigrations habría hecho `migrate:fresh` sobre
 * los datos reales. Hoy no pasa solo porque la imagen se construye sin las
 * dependencias de desarrollo y ahí no hay phpunit.
 *
 * ── La corrección ───────────────────────────────────────────────────────────
 *
 * Copiar `$_ENV` sobre `$_SERVER` antes de que Laravel arranque. Para las
 * variables que PHPUnit no ha forzado ambos arrays ya coinciden y la copia no
 * cambia nada; para las forzadas, es lo que hace que ganen. Es decir: el efecto
 * neto es exactamente «que `phpunit.xml` decida», que es lo que el fichero
 * pretendía desde el principio.
 *
 * Va aquí y no en el `Makefile` a propósito. Un `env -u` en el objetivo de make
 * solo protegería a quien lo invoque por ahí; esto protege también a quien
 * escriba `vendor/bin/phpunit` a mano dentro del contenedor, que es el caso en
 * el que la trampa saltaría sin avisar.
 */

require __DIR__.'/../vendor/autoload.php';

foreach ($_ENV as $clave => $valor) {
    $_SERVER[$clave] = $valor;
}
