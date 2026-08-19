<?php

/**
 * Mensajes de autenticación.
 *
 * Pasan por el sistema de traducción y no van escritos en el controlador, como
 * exige el Principio XII.a de la constitución.
 */

return [

    // Deliberadamente NO distingue si falló el usuario o la contraseña: decirlo
    // permitiría averiguar qué cuentas existen probando nombres.
    'failed' => 'Las credenciales indicadas no son correctas.',

    'throttle' => 'Demasiados intentos de acceso. Inténtelo de nuevo en :seconds segundos.',

    'staff_only' => 'Este espacio está reservado a la administración y al profesorado.',

    'logged_out' => 'Sesión cerrada.',

];
