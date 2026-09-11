<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    /**
     * Idioma fijo en las pruebas.
     *
     * Desde que el servidor responde en el idioma que pide el cliente, una
     * prueba que compruebe un mensaje depende de qué cabecera acompañe a la
     * petición. Y ahí hay una trampa: `Symfony\Component\HttpFoundation\Request`
     * INYECTA `Accept-Language: en-us,en;q=0.5` entre sus valores por defecto, de
     * modo que una petición aparentemente sin cabecera llega pidiendo inglés.
     *
     * El resultado era desconcertante: pruebas escritas hace meses, sin relación
     * con los idiomas, fallaban porque un mensaje salía en inglés. No estaban
     * mal ni el código ni ellas — faltaba fijar el idioma, igual que se fija el
     * huso horario o la semilla de aleatoriedad.
     *
     * Se fija el español, que es el idioma base del producto. Quien quiera
     * comprobar otro manda su propia cabecera con `withHeader`, y esa gana:
     * `ServerMessagesLocaleTest` lo hace en cada caso.
     */
    protected function setUp(): void
    {
        parent::setUp();

        $this->withHeader('Accept-Language', 'es');
    }
}
