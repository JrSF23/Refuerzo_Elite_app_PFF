<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Etapas educativas, con su cuota.
 *
 * La etapa es la UNIDAD DE COBRO del centro: en Guinea Ecuatorial se paga por
 * nivel —Pre-escolar, Primaria (PEP), ESBA, Bachillerato— y no por asignatura ni
 * por curso. Todos los cursos de una misma etapa cuestan lo mismo: 1º Bach CC y
 * 2º Bach Hum pagan igual, y del 1º al 6º de PEP también.
 *
 * Es el tercer intento de colocar el dinero donde de verdad está. Primero estuvo
 * en la asignatura (`subjects.monthly_fee`, retirada en b9ac83e) y hoy sigue en
 * la matrícula (`enrollments.monthly_fee`, una fila por alumno y asignatura). En
 * la demo eso produce 300 importes distintos para un centro que cobra cuatro
 * precios.
 *
 * ── Por qué una tabla y no una cadena ───────────────────────────────────────
 *
 * El nivel vive hoy como TEXTO LIBRE en `students.school_level`, y ya ha
 * divergido entre centros sin que nadie hiciera nada raro: una organización
 * escribió «primero ESBA» y otra «1º PEP», mientras la demo usa «1º ESBA». Una
 * cuota colgada de una cadena que cada uno teclea a su manera es una cuota que
 * no se puede cobrar: «primero ESBA» y «1º ESBA» serían dos etapas distintas y
 * ninguna tendría precio.
 *
 * ── La cuota la fija el centro ──────────────────────────────────────────────
 *
 * `fee` nace a cero y no con un importe por defecto. Las cifras de Guinea
 * —99.000, 105.000, 110.000, 120.000 XAF— son ejemplos de un centro concreto, no
 * una constante del país: cada centro pone las suyas. Sembrar un precio inventado
 * lo haría pasar por dato bueno hasta que alguien cobrara de más.
 *
 * `decimal(12, 2)` y no `(10, 2)` como el resto de importes: las cuotas anuales
 * en francos CFA se cuentan en cientos de miles, y diez dígitos se quedan cerca
 * del techo cuando alguien registre el total de un curso.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('stages', function (Blueprint $table): void {
            $table->id();

            // Principio IX: toda tabla de negocio nace con su organización.
            $table->foreignId('organization_id')
                ->constrained('organizations')
                ->cascadeOnDelete();

            $table->string('name', 100);
            $table->decimal('fee', 12, 2)->default(0);

            // Orden pedagógico, no alfabético: Pre-escolar va antes que Primaria
            // y «Bachillerato» antes que «ESBA» solo por la A. Lo elige el centro.
            $table->unsignedInteger('sort_order')->default(0);

            $table->timestamps();

            // Único POR ORGANIZACIÓN, nunca global: dos centros distintos tienen
            // cada uno su «Bachillerato», y son etapas diferentes con precios
            // diferentes (FR-020).
            $table->unique(['organization_id', 'name']);
        });

        Schema::table('tutor_groups', function (Blueprint $table): void {
            // La etapa la declara el AULA, y el alumno la hereda de ella. Ponerla
            // en el alumno permitiría un alumno de Bachillerato en un aula de
            // Primaria, que es una contradicción que nadie detectaría hasta
            // cobrarle mal.
            //
            // Nullable porque las aulas ya existen: exigirla de golpe dejaría la
            // migración sin poder aplicarse, y un aula sin etapa es un estado
            // legítimo mientras el centro las configura.
            $table->foreignId('stage_id')
                ->nullable()
                ->after('organization_id')
                ->constrained('stages')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('tutor_groups', function (Blueprint $table): void {
            $table->dropForeign(['stage_id']);
            $table->dropColumn('stage_id');
        });

        Schema::dropIfExists('stages');
    }
};
