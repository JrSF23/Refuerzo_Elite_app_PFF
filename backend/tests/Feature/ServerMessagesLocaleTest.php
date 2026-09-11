<?php

namespace Tests\Feature;

use App\Models\Organization;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\CreatesOrganizations;
use Tests\TestCase;

/**
 * Los mensajes del servidor salen en el idioma que pide el cliente.
 *
 * Traducir solo la interfaz deja el trabajo a medias de la peor manera: la
 * pantalla en francés y el primer formulario incompleto respondiendo «El campo
 * estado es obligatorio». La mezcla no parece una traducción pendiente, parece
 * un producto roto.
 *
 * Lo que el usuario ESCRIBIÓ no se traduce nunca —nombres, observaciones,
 * títulos—. Eso son datos, y tocarlos sería corromperlos. Aquí solo viajan los
 * mensajes.
 */
class ServerMessagesLocaleTest extends TestCase
{
    use CreatesOrganizations, RefreshDatabase;

    private Organization $org;

    private string $token;

    protected function setUp(): void
    {
        parent::setUp();

        $this->ensureRoles();

        $this->org = $this->createOrganization(['name' => 'Centro A']);
        $this->token = $this->tokenFor($this->createUserFor($this->org, 'org_admin'));
    }

    /** Un alta incompleta, para provocar un error de validación real. */
    private function invalidRequest(?string $language): \Illuminate\Testing\TestResponse
    {
        $request = $this->actingWithToken($this->token);

        if ($language !== null) {
            $request = $request->withHeader('Accept-Language', $language);
        }

        return $request->postJson('/api/v1/subjects', []);
    }

    /**
     * El español se pide como cualquier otro idioma.
     *
     * No hay una prueba de «sin cabecera» porque ese caso NO es alcanzable desde
     * el cliente de pruebas: `Symfony\Component\HttpFoundation\Request::create`
     * inyecta `Accept-Language: en-us,en;q=0.5` entre sus valores por defecto, de
     * modo que una petición aparentemente sin cabecera llega pidiendo inglés — y
     * la respuesta en inglés era correcta, no un fallo.
     *
     * En producción tampoco ocurre: los navegadores siempre mandan la cabecera, y
     * la aplicación la sobrescribe con el idioma que la persona eligió. El caso
     * «no llega ninguna» lo cubre `test_an_unsupported_language_falls_back...`,
     * donde la negociación no encuentra nada y se conserva el idioma de la
     * aplicación.
     */
    public function test_validation_errors_come_in_spanish_when_asked(): void
    {
        $mensaje = $this->invalidRequest('es')->assertStatus(422)->json('errors.name.0');

        $this->assertStringContainsString('obligatorio', $mensaje);
    }

    public function test_validation_errors_come_in_french_when_asked(): void
    {
        $mensaje = $this->invalidRequest('fr')->assertStatus(422)->json('errors.name.0');

        $this->assertStringContainsString('obligatoire', $mensaje);
    }

    public function test_validation_errors_come_in_english_when_asked(): void
    {
        $mensaje = $this->invalidRequest('en')->assertStatus(422)->json('errors.name.0');

        $this->assertStringContainsString('required', $mensaje);
    }

    /**
     * El nombre del campo se traduce con el mensaje. Sin `attributes`, un
     * francés leería «Le champ name est obligatoire»: la regla en su idioma y el
     * campo en el del programador.
     */
    public function test_the_field_name_is_translated_too(): void
    {
        $mensaje = $this->invalidRequest('fr')->assertStatus(422)->json('errors.code.0');

        $this->assertStringContainsString('code', $mensaje);
        $this->assertStringNotContainsString('attribute', $mensaje);
    }

    /**
     * La cabecera real de un navegador, con variantes regionales y factores de
     * calidad: «fr-FR,fr;q=0.9,es;q=0.8». Se toma el primero que tengamos y se
     * ignora la región, porque el francés de Francia y el de Guinea Ecuatorial
     * comparten catálogo.
     */
    public function test_a_real_browser_header_is_understood(): void
    {
        $mensaje = $this->invalidRequest('fr-FR,fr;q=0.9,es;q=0.8')
            ->assertStatus(422)
            ->json('errors.name.0');

        $this->assertStringContainsString('obligatoire', $mensaje);
    }

    /**
     * Un idioma que no tenemos NO se aplica: `App::setLocale()` con una cadena
     * arbitraria hace que Laravel busque ficheros inexistentes y devuelva las
     * claves crudas —«validation.required»— en toda la respuesta. La cabecera la
     * manda el cliente, así que no se da por buena.
     */
    public function test_an_unsupported_language_falls_back_instead_of_breaking(): void
    {
        $mensaje = $this->invalidRequest('de-DE,de;q=0.9')->assertStatus(422)->json('errors.name.0');

        $this->assertStringNotContainsString('validation.', $mensaje);
        $this->assertStringContainsString('obligatorio', $mensaje);
    }

    /**
     * También los mensajes que no son de validación: los de dominio, que salen
     * de `tenancy.php`.
     */
    public function test_domain_messages_are_translated_too(): void
    {
        $subject = $this->createSubject($this->org);

        $mensaje = $this->actingWithToken($this->token)
            ->withHeader('Accept-Language', 'en')
            ->deleteJson("/api/v1/subjects/{$subject->getKey()}")
            ->assertOk()
            ->json('message');

        $this->assertSame('Record deleted.', $mensaje);
    }

    /**
     * Los tres catálogos tienen que llevar EXACTAMENTE las mismas claves.
     *
     * Sin esto, un idioma se queda atrás en silencio: el respaldo devuelve
     * español y la pantalla sale medio traducida. Es la misma garantía que
     * `keys.test.js` da en el navegador, aplicada al servidor.
     */
    public function test_every_language_file_has_the_same_keys(): void
    {
        foreach (['auth', 'tenancy', 'validation'] as $fichero) {
            $base = $this->flatten(require base_path("lang/es/{$fichero}.php"));

            foreach (['fr', 'en'] as $idioma) {
                $suyas = $this->flatten(require base_path("lang/{$idioma}/{$fichero}.php"));

                $this->assertSame(
                    [],
                    array_values(array_diff($base, $suyas)),
                    "Faltan claves en lang/{$idioma}/{$fichero}.php"
                );

                $this->assertSame(
                    [],
                    array_values(array_diff($suyas, $base)),
                    "Sobran claves en lang/{$idioma}/{$fichero}.php"
                );
            }
        }
    }

    /**
     * @param  array<string, mixed>  $tree
     * @return list<string>
     */
    private function flatten(array $tree, string $prefix = ''): array
    {
        $keys = [];

        foreach ($tree as $key => $value) {
            $path = $prefix.$key;

            if (is_array($value)) {
                $keys = array_merge($keys, $this->flatten($value, $path.'.'));
                continue;
            }

            $keys[] = $path;
        }

        sort($keys);

        return $keys;
    }
}
