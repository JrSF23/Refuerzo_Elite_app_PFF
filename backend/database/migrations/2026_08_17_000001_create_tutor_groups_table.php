<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Grupos tutoriales: el aula a la que pertenece un alumno.
 *
 * El concepto no existía. `class_groups` es el grupo DE UNA ASIGNATURA —su
 * `subject_id` es obligatorio y un alumno pertenece a varios con profesores
 * distintos—, así que no podía representar el aula ni aportar un tutor único.
 *
 * Desplegable por sí sola: la columna que se añade a `students` es nullable, de
 * modo que todo lo anterior sigue funcionando sin conocerla.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tutor_groups', function (Blueprint $table): void {
            $table->id();

            // Principio IX: toda tabla de negocio nace con su organización.
            $table->foreignId('organization_id')
                ->constrained('organizations')
                ->cascadeOnDelete();

            $table->string('name', 100);

            // Cadena validada en servidor y no ENUM de base de datos: añadir un
            // turno de noche no debe exigir una migración. Es además el patrón
            // que ya usan `status`, `payment_method` y los estados de asistencia.
            $table->string('shift', 20);

            $table->string('academic_year', 20);

            /*
             * Tutor y delegado son OPCIONALES, y las tres claves foráneas de esta
             * feature usan SET NULL. No es un detalle:
             *
             *   · Un grupo existe antes de tener tutor, y es lo que permite
             *     mostrar «sin asignar» sin inventar un dato (FR-005).
             *   · Un grupo recién creado no tiene alumnos, luego tampoco puede
             *     tener delegado (FR-003b).
             *   · Con CASCADE, dar de baja a un profesor borraría su grupo, y dar
             *     de baja un grupo borraría a sus alumnos con sus matrículas,
             *     asistencia y pagos. La spec lo prohíbe (FR-010, FR-011).
             */
            $table->foreignId('tutor_teacher_id')
                ->nullable()
                ->constrained('teachers')
                ->nullOnDelete();

            $table->foreignId('representative_student_id')
                ->nullable()
                ->constrained('students')
                ->nullOnDelete();

            // Orden académico COMO DATO. No puede escribirse en el código: el
            // Principio XII prohíbe acoplar la lógica a un país, y ordenar por el
            // texto del nivel da mal resultado —«1º Bachiller» precede
            // alfabéticamente a «1º ESO»—.
            $table->integer('sort_order')->default(0);

            $table->string('status', 20)->default('active');

            $table->timestamps();
            $table->softDeletes();

            /*
             * Unicidad acotada por organización, y con el turno dentro.
             *
             * Sin `shift`, «1º ESO mañana» y «1º ESO tarde» chocarían siendo
             * grupos distintos. Y sin `organization_id` sería a la vez un fallo
             * funcional —dos centros no podrían tener ambos su «1º ESO»— y una
             * fuga: el error de clave duplicada revelaría un registro ajeno.
             */
            $table->unique(
                ['organization_id', 'name', 'shift', 'academic_year'],
                'tutor_groups_org_name_shift_year_unique',
            );

            $table->index(['organization_id', 'sort_order']);
        });

        // DESPUÉS de crear la tabla: la clave foránea no puede apuntar a algo que
        // todavía no existe.
        Schema::table('students', function (Blueprint $table): void {
            /*
             * NULLABLE, y no es negociable. Los alumnos que ya existen no tienen
             * grupo, y `school_level` es texto libre del que no se puede deducir
             * ninguno. Una columna NOT NULL sin valor por defecto haría fallar
             * esta migración sobre datos reales: es exactamente el defecto que en
             * la feature 001 obligó a partir la migración M4 en dos.
             */
            $table->foreignId('tutor_group_id')
                ->nullable()
                ->after('guardian_id')
                ->constrained('tutor_groups')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('students', function (Blueprint $table): void {
            $table->dropConstrainedForeignId('tutor_group_id');
        });

        Schema::dropIfExists('tutor_groups');
    }
};
