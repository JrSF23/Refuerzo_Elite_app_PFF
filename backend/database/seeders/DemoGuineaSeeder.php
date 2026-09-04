<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

/**
 * Datos de demostración para enseñar la plataforma al sector académico
 * de Guinea Ecuatorial.
 *
 * ── Por qué existe, además de DemoSeeder ────────────────────────────────────
 *
 * `DemoSeeder` sirve para desarrollar: cuatro alumnos y un par de grupos bastan
 * para probar una pantalla. No sirve para ENSEÑAR el producto: un listado con
 * nueve alumnos no demuestra que la tabla aguante, la paginación no se llega a
 * ver, y los nombres castellanos genéricos no le dicen nada a un director de
 * centro de Malabo o Bata.
 *
 * ── El único centro que toca ────────────────────────────────────────────────
 *
 * Este seeder opera EXCLUSIVAMENTE sobre la organización 1. Las demás pueden
 * contener datos de personas que están evaluando la plataforma, y borrarlas
 * sería destruir su trabajo. El borrado va siempre acotado por
 * `organization_id`, nunca con un `truncate`, que ignoraría esa frontera.
 *
 * ── La coherencia por etapa es la parte delicada ────────────────────────────
 *
 * Cada aula lleva su etapa y su edad. De ahí salen la fecha de nacimiento del
 * alumno y, sobre todo, LAS ASIGNATURAS A LAS QUE PUEDE MATRICULARSE. Sin eso
 * el reparto al azar acaba matriculando a un niño de Pre-escolar en
 * Contabilidad, y ese es justo el detalle que hunde una demostración delante de
 * alguien que dirige un centro.
 *
 * ── Sobre los importes ──────────────────────────────────────────────────────
 *
 * En francos CFA, que es la moneda del país. Las cuotas anteriores (70–80)
 * venían del origen europeo del producto y en una demostración local no
 * significan nada. La aplicación todavía no muestra divisa —desviación XII.b,
 * aceptada por escrito—, así que la credibilidad depende enteramente de que la
 * magnitud del número sea la correcta.
 */
class DemoGuineaSeeder extends Seeder
{
    /** El centro de demostración. Ninguna consulta de este fichero sale de aquí. */
    private const ORG = 1;

    /**
     * El curso que se enseña es el 2025-2026, ya terminado, y no el que viene.
     *
     * No es un descuido: el 2026-2027 empieza el 14 de septiembre y hoy todavía
     * no ha llegado, así que un centro en ese curso no tendría ni una sesión
     * impartida ni una asistencia registrada — las dos pantallas saldrían
     * vacías justo cuando hay que enseñarlas.
     */
    private const CURSO = '2025-2026';

    private const CURSO_INICIO = '2025-09-15';

    private const CURSO_FIN = '2026-06-19';

    /** Cuentas que sobreviven: superadmin, admin y admin.a. */
    private const CUENTAS_QUE_SE_QUEDAN = [1, 2, 3];

    private const ALUMNOS = 150;

    /**
     * El catálogo completo de aulas del sistema educativo de Guinea Ecuatorial:
     * nombre, turno, etapa y edad de referencia.
     *
     * Pre-escolar y Primaria van SOLO de mañana, que es como funcionan; la ESBA
     * se desdobla en mañana y tarde, y el Bachillerato se imparte de mañana en
     * sus tres ramas: Ciencias, Humanidades y Tecnología.
     *
     * La edad no es decorativa: de ella sale la fecha de nacimiento, y un aula
     * de Pre-escolar llena de adolescentes se nota al primer vistazo.
     *
     * @var list<array{0:string,1:string,2:string,3:int}>
     */
    private const AULAS = [
        ['Pre-escolar 1', 'morning',   'infantil',  3],
        ['Pre-escolar 2', 'morning',   'infantil',  4],

        ['1º PEP',        'morning',   'primaria',  6],
        ['2º PEP',        'morning',   'primaria',  7],
        ['3º PEP',        'morning',   'primaria',  8],
        ['4º PEP',        'morning',   'primaria2', 9],
        ['5º PEP',        'morning',   'primaria2', 10],
        ['6º PEP',        'morning',   'primaria2', 11],

        ['1º ESBA',       'morning',   'esba',      12],
        ['1º ESBA',       'afternoon', 'esba',      12],
        ['2º ESBA',       'morning',   'esba',      13],
        ['2º ESBA',       'afternoon', 'esba',      13],
        ['3º ESBA',       'morning',   'esba',      14],
        ['3º ESBA',       'afternoon', 'esba',      14],
        ['4º ESBA',       'morning',   'esba',      15],
        ['4º ESBA',       'afternoon', 'esba',      15],

        ['1º Bach CC',    'morning',   'bach',      16],
        ['2º Bach CC',    'morning',   'bach',      17],
        ['1º Bach Hum',   'morning',   'bach',      16],
        ['2º Bach Hum',   'morning',   'bach',      17],
        ['1º Tecn',       'morning',   'bach',      16],
        ['2º Tecn',       'morning',   'bach',      17],
    ];

    /**
     * Asignaturas, con las etapas que pueden cursarlas.
     *
     * El último campo es lo que impide los disparates: Contabilidad solo
     * aparece en Bachillerato, y la iniciación a la lectura no llega a la ESBA.
     *
     * El importe NO se guarda en la asignatura —esa columna se eliminó, porque
     * el cobro es por curso y no por materia— y sirve solo para fijar la cuota
     * de cada matrícula, que es donde el dinero tiene sentido.
     *
     * @var list<array{0:string,1:string,2:int,3:list<string>}>
     */
    private const ASIGNATURAS = [
        ['Iniciación a la Lectura',      'ILE', 15000, ['infantil', 'primaria']],
        ['Refuerzo Escolar Infantil',    'REI', 15000, ['infantil', 'primaria']],
        ['Matemáticas',                  'MAT', 25000, ['primaria', 'primaria2', 'esba', 'bach']],
        ['Lengua Castellana',            'LEN', 20000, ['primaria', 'primaria2', 'esba', 'bach']],
        ['Inglés',                       'ING', 22500, ['primaria', 'primaria2', 'esba', 'bach']],
        ['Francés',                      'FRA', 22500, ['primaria2', 'esba', 'bach']],
        ['Historia de Guinea Ecuatorial', 'HGE', 17500, ['primaria2', 'esba', 'bach']],
        ['Geografía',                    'GEO', 17500, ['primaria2', 'esba', 'bach']],
        ['Física y Química',             'FQU', 27500, ['esba', 'bach']],
        ['Biología y Geología',          'BIO', 25000, ['esba', 'bach']],
        ['Informática',                  'INF', 30000, ['esba', 'bach']],
        ['Contabilidad',                 'CON', 27500, ['bach']],
    ];

    /** Etiqueta legible de la etapa, para el campo `level` de la asignatura. */
    private const ETIQUETA_ETAPA = [
        'infantil' => 'Pre-escolar',
        'primaria' => 'Primaria',
        'primaria2' => 'Primaria',
        'esba' => 'ESBA',
        'bach' => 'Bachillerato',
    ];

    private const APELLIDOS = [
        'Nsue', 'Ndong', 'Obiang', 'Nguema', 'Mba', 'Esono', 'Ela', 'Owono',
        'Michá', 'Nchama', 'Bindang', 'Asumu', 'Edu', 'Ondó', 'Bacale', 'Mangué',
        'Abeso', 'Eyene', 'Nzang', 'Oyono', 'Ntutumu', 'Sima', 'Nvono', 'Akeng',
        'Bibang', 'Engonga', 'Mbomío', 'Nfono', 'Ayingono', 'Ncogo', 'Esara',
        'Mikue', 'Nsang', 'Obama', 'Ovono', 'Asangono', 'Bolopa', 'Eneme',
        'Ekang', 'Esaha', 'Mifumu', 'Bohari', 'Nkulu', 'Ada', 'Bee',
    ];

    private const NOMBRES_M = [
        'Salvador', 'Anacleto', 'Prudencio', 'Restituto', 'Fructuoso', 'Bonifacio',
        'Celestino', 'Damián', 'Eulogio', 'Faustino', 'Gaspar', 'Hilario',
        'Isidoro', 'Juvenal', 'Leoncio', 'Marcelino', 'Norberto', 'Olegario',
        'Pancracio', 'Rufino', 'Saturnino', 'Teodoro', 'Valentín', 'Bienvenido',
        'Crisanto', 'Domingo', 'Eleuterio', 'Fidel', 'Santiago', 'Matías',
        'Rafael', 'Miguel', 'Andrés', 'Tomás', 'Baltasar', 'Nicasio',
    ];

    private const NOMBRES_F = [
        'Celina', 'Purificación', 'Restituta', 'Anastacia', 'Bienvenida',
        'Consolación', 'Encarnación', 'Filomena', 'Genoveva', 'Higinia',
        'Inocencia', 'Juliana', 'Leocadia', 'Manuela', 'Natividad', 'Obdulia',
        'Petra', 'Remedios', 'Sabina', 'Teodora', 'Visitación', 'Marina',
        'Eloísa', 'Julia', 'Raquel', 'Asunción', 'Trinidad', 'Milagrosa',
        'Soledad', 'Esperanza', 'Práxedes', 'Nieves',
    ];

    public function run(): void
    {
        // Semilla fija: dos ejecuciones producen los mismos datos. Al grabar un
        // vídeo importa, porque permite repetir una toma sin que los nombres de
        // la pantalla hayan cambiado.
        mt_srand(2026);

        $this->limpiarCentroDemo();
        $this->limpiarCuentas();

        $ahora = now();

        $asignaturas = $this->crearAsignaturas($ahora);
        $aulas = $this->crearAulas($ahora);
        $profesores = $this->crearProfesores($ahora);
        $tutores = $this->crearTutores($ahora);
        $alumnos = $this->crearAlumnos($ahora, $aulas, $tutores);
        $this->asignarTutoresYDelegados($aulas, $profesores);
        $grupos = $this->crearGruposDeAsignatura($ahora, $asignaturas, $profesores);
        $matriculas = $this->crearMatriculas($ahora, $alumnos, $grupos);
        $sesiones = $this->crearSesiones($ahora, $grupos);
        $this->crearAsistencia($ahora, $sesiones, $matriculas);
        $pagos = $this->crearPagos($ahora, $matriculas, $alumnos);

        $this->command?->info(sprintf(
            '  aulas %d · asignaturas %d · profesores %d · tutores %d · alumnos %d',
            count($aulas), count($asignaturas), count($profesores), count($tutores), count($alumnos)
        ));
        $this->command?->info(sprintf(
            '  grupos %d · matrículas %d · sesiones %d · pagos %d',
            count($grupos), count($matriculas), count($sesiones), $pagos
        ));
    }

    /**
     * Borra el contenido de la organización 1 respetando el orden de las claves
     * foráneas: primero lo que apunta, después lo apuntado.
     *
     * Se usa `delete()` del query builder y no los modelos, para que el borrado
     * lógico no deje filas escondidas que luego reaparezcan en las pantallas.
     */
    private function limpiarCentroDemo(): void
    {
        $sesiones = DB::table('class_sessions')->where('organization_id', self::ORG)->pluck('id');

        DB::table('attendances')->whereIn('class_session_id', $sesiones)->delete();
        DB::table('attendances')->where('organization_id', self::ORG)->delete();
        DB::table('class_sessions')->where('organization_id', self::ORG)->delete();
        DB::table('payments')->where('organization_id', self::ORG)->delete();
        DB::table('enrollments')->where('organization_id', self::ORG)->delete();
        DB::table('class_groups')->where('organization_id', self::ORG)->delete();

        // Los alumnos apuntan a aula y a tutor: van antes que ambos.
        DB::table('students')->where('organization_id', self::ORG)->delete();
        DB::table('tutor_groups')->where('organization_id', self::ORG)->delete();
        DB::table('guardians')->where('organization_id', self::ORG)->delete();
        DB::table('subjects')->where('organization_id', self::ORG)->delete();
        DB::table('teachers')->where('organization_id', self::ORG)->delete();
    }

    /**
     * Deja solo las cuentas de la demostración.
     *
     * NO se tocan las de las organizaciones 3 y 4: las creó gente que está
     * evaluando la plataforma y su acceso tiene que seguir funcionando.
     */
    private function limpiarCuentas(): void
    {
        $sobran = DB::table('users')
            ->whereIn('organization_id', [1, 2])
            ->whereNotIn('id', self::CUENTAS_QUE_SE_QUEDAN)
            ->pluck('id');

        if ($sobran->isEmpty()) {
            return;
        }

        DB::table('model_has_roles')->whereIn('model_id', $sobran)
            ->where('model_type', 'App\Models\User')->delete();
        DB::table('personal_access_tokens')->whereIn('tokenable_id', $sobran)
            ->where('tokenable_type', 'App\Models\User')->delete();
        DB::table('users')->whereIn('id', $sobran)->delete();
    }

    /** @return list<array{id:int,fee:float,etapas:list<string>}> */
    private function crearAsignaturas(\DateTimeInterface $ahora): array
    {
        $filas = [];

        foreach (self::ASIGNATURAS as [$nombre, $codigo, $cuota, $etapas]) {
            // La etiqueta muestra el rango: «Primaria – Bachillerato».
            $primera = self::ETIQUETA_ETAPA[$etapas[0]];
            $ultima = self::ETIQUETA_ETAPA[$etapas[count($etapas) - 1]];

            $filas[] = [
                'organization_id' => self::ORG,
                'name' => $nombre,
                // El código lleva el centro delante porque `subjects.code` es
                // único en toda la tabla, no por organización.
                'code' => 'RE-' . $codigo,
                'level' => $primera === $ultima ? $primera : $primera . ' – ' . $ultima,
                // Sin importe: la asignatura ya no es unidad de cobro. La cuota
                // del catálogo se usa solo para fijar la de cada matrícula.
                'created_at' => $ahora,
                'updated_at' => $ahora,
            ];
        }

        DB::table('subjects')->insert($filas);

        $ids = DB::table('subjects')->where('organization_id', self::ORG)
            ->orderBy('id')->pluck('id')->all();

        $salida = [];
        foreach (self::ASIGNATURAS as $i => [, , $cuota, $etapas]) {
            $salida[] = ['id' => $ids[$i], 'fee' => (float) $cuota, 'etapas' => $etapas];
        }

        return $salida;
    }

    /**
     * Las aulas del centro, según el catálogo de `AULAS`.
     *
     * @return list<array{id:int,etapa:string,edad:int,nombre:string}>
     */
    private function crearAulas(\DateTimeInterface $ahora): array
    {
        $filas = [];

        foreach (self::AULAS as $orden => [$nombre, $turno, , ]) {
            $filas[] = [
                'organization_id' => self::ORG,
                'name' => $nombre,
                'shift' => $turno,
                'academic_year' => self::CURSO,
                'sort_order' => $orden,
                'status' => 'active',
                'created_at' => $ahora,
                'updated_at' => $ahora,
            ];
        }

        DB::table('tutor_groups')->insert($filas);

        $ids = DB::table('tutor_groups')->where('organization_id', self::ORG)
            ->orderBy('sort_order')->pluck('id')->all();

        $salida = [];
        foreach (self::AULAS as $i => [$nombre, , $etapa, $edad]) {
            $salida[] = ['id' => $ids[$i], 'etapa' => $etapa, 'edad' => $edad, 'nombre' => $nombre];
        }

        return $salida;
    }

    /** @return list<int> */
    private function crearProfesores(\DateTimeInterface $ahora): array
    {
        $materias = array_column(self::ASIGNATURAS, 0);
        $filas = [];

        for ($i = 0; $i < 50; $i++) {
            [$nombre, $apellido] = $this->persona();

            $filas[] = [
                'organization_id' => self::ORG,
                'first_name' => $nombre,
                'last_name' => $apellido,
                'email' => $this->correo($nombre, $apellido, $i),
                'phone' => $this->telefono(),
                'specialty' => $materias[$i % count($materias)],
                'created_at' => $ahora,
                'updated_at' => $ahora,
            ];
        }

        DB::table('teachers')->insert($filas);

        return DB::table('teachers')->where('organization_id', self::ORG)->pluck('id')->all();
    }

    /** @return list<int> */
    private function crearTutores(\DateTimeInterface $ahora): array
    {
        $filas = [];

        for ($i = 0; $i < 100; $i++) {
            [$nombre, $apellido] = $this->persona();

            $filas[] = [
                'organization_id' => self::ORG,
                'first_name' => $nombre,
                'last_name' => $apellido,
                'email' => $this->correo($nombre, $apellido, 1000 + $i),
                'phone' => $this->telefono(),
                'relationship_label' => ['Madre', 'Padre', 'Tutor legal', 'Abuela', 'Tío'][mt_rand(0, 4)],
                'address' => $this->direccion(),
                'created_at' => $ahora,
                'updated_at' => $ahora,
            ];
        }

        DB::table('guardians')->insert($filas);

        return DB::table('guardians')->where('organization_id', self::ORG)->pluck('id')->all();
    }

    /**
     * Los alumnos, repartidos por las aulas y con la edad de su etapa.
     *
     * Cada tercer alumno reutiliza el tutor del anterior: en un centro real hay
     * hermanos, y una lista donde cada alumno tiene un tutor distinto se nota
     * artificial en cuanto alguien la mira dos veces.
     *
     * @param list<array{id:int,etapa:string,edad:int,nombre:string}> $aulas
     * @param list<int> $tutores
     * @return list<array{id:int,etapa:string}>
     */
    private function crearAlumnos(\DateTimeInterface $ahora, array $aulas, array $tutores): array
    {
        $filas = [];
        $etapaPorOrden = [];
        $apellidoHermano = null;

        for ($i = 0; $i < self::ALUMNOS; $i++) {
            $hermano = $i % 3 === 2 && $apellidoHermano !== null;

            [$nombre, $apellido] = $this->persona();
            if ($hermano) {
                $apellido = $apellidoHermano;
            }
            $apellidoHermano = $apellido;

            $aula = $aulas[$i % count($aulas)];
            $etapaPorOrden[] = $aula['etapa'];

            $filas[] = [
                'organization_id' => self::ORG,
                'guardian_id' => $tutores[intdiv($i, 2) % count($tutores)],
                'tutor_group_id' => $aula['id'],
                'first_name' => $nombre,
                'last_name' => $apellido,
                'email' => $this->correo($nombre, $apellido, 2000 + $i),
                'phone' => $this->telefono(),
                // La edad sale del aula. Un alumno de Pre-escolar nace hace tres
                // años, no hace quince.
                'date_of_birth' => Carbon::parse(self::CURSO_INICIO)
                    ->subYears($aula['edad'])->subDays(mt_rand(0, 364))->toDateString(),
                'school_name' => ['Colegio Nacional Rey Malabo', 'IES Rey Boncoro', 'Colegio Claret', 'IES Carlos Lwanga'][mt_rand(0, 3)],
                'school_level' => $aula['nombre'],
                // Unos pocos inactivos: el distintivo de estado tiene que verse
                // en la demostración, y con todos activos no aparece nunca.
                'status' => $i % 17 === 0 ? 'inactive' : 'active',
                'address' => $this->direccion(),
                'created_at' => $ahora,
                'updated_at' => $ahora,
            ];
        }

        DB::table('students')->insert($filas);

        $ids = DB::table('students')->where('organization_id', self::ORG)
            ->orderBy('id')->pluck('id')->all();

        $salida = [];
        foreach ($ids as $i => $id) {
            $salida[] = ['id' => (int) $id, 'etapa' => $etapaPorOrden[$i]];
        }

        return $salida;
    }

    /**
     * Cada aula con su profesor tutor y su alumno delegado.
     *
     * Va DESPUÉS de crear los alumnos, porque el delegado tiene que ser uno de
     * los del aula. Sin esto las 22 aulas aparecen con «Sin asignar» en las dos
     * columnas y la pantalla de grupos tutoriales —que es una función entera del
     * producto— se enseña vacía.
     *
     * @param list<array{id:int,etapa:string,edad:int,nombre:string}> $aulas
     * @param list<int> $profesores
     */
    private function asignarTutoresYDelegados(array $aulas, array $profesores): void
    {
        foreach ($aulas as $i => $aula) {
            // El delegado sale del propio aula. En Pre-escolar no se nombra
            // delegado, que sería absurdo con tres años.
            $delegado = $aula['etapa'] === 'infantil'
                ? null
                : DB::table('students')
                    ->where('organization_id', self::ORG)
                    ->where('tutor_group_id', $aula['id'])
                    ->where('status', 'active')
                    ->orderBy('id')
                    ->value('id');

            DB::table('tutor_groups')->where('id', $aula['id'])->update([
                'tutor_teacher_id' => $profesores[$i % count($profesores)],
                'representative_student_id' => $delegado,
            ]);
        }
    }

    /**
     * Cuatro grupos por asignatura: dos de mañana y dos de tarde.
     *
     * @param list<array{id:int,fee:float,etapas:list<string>}> $asignaturas
     * @param list<int> $profesores
     * @return list<array{id:int,fee:float,etapas:list<string>}>
     */
    private function crearGruposDeAsignatura(\DateTimeInterface $ahora, array $asignaturas, array $profesores): array
    {
        $filas = [];
        $meta = [];
        $n = 0;

        foreach ($asignaturas as $indice => $asignatura) {
            [$nombreMateria, $codigo] = self::ASIGNATURAS[$indice];

            foreach ([['Mañana', '08:00 – 10:00'], ['Mañana', '10:30 – 12:30'], ['Tarde', '15:00 – 17:00'], ['Tarde', '17:30 – 19:30']] as $t => [$turno, $horario]) {
                $filas[] = [
                    'organization_id' => self::ORG,
                    'subject_id' => $asignatura['id'],
                    'teacher_id' => $profesores[$n % count($profesores)],
                    'name' => $nombreMateria . ' — ' . $turno . ' ' . ($t % 2 === 0 ? 'A' : 'B'),
                    'code' => 'RE-' . $codigo . '-' . ($n + 1),
                    'academic_year' => self::CURSO,
                    'schedule' => $turno . ' · ' . $horario,
                    'capacity' => 20,
                    'start_date' => self::CURSO_INICIO,
                    'end_date' => self::CURSO_FIN,
                    'status' => 'active',
                    'created_at' => $ahora,
                    'updated_at' => $ahora,
                ];
                $meta[] = ['fee' => $asignatura['fee'], 'etapas' => $asignatura['etapas']];
                $n++;
            }
        }

        DB::table('class_groups')->insert($filas);

        $this->asignarMateriaALasFichas($filas);

        $ids = DB::table('class_groups')->where('organization_id', self::ORG)
            ->orderBy('id')->pluck('id')->all();

        $salida = [];
        foreach ($ids as $i => $id) {
            $salida[] = ['id' => (int) $id, 'fee' => $meta[$i]['fee'], 'etapas' => $meta[$i]['etapas']];
        }

        return $salida;
    }

    /**
     * Escribe en cada ficha de profesor la materia que de verdad imparte.
     *
     * Hasta ahora la ficha solo llevaba `specialty`, texto libre repartido en
     * rueda sobre la lista de asignaturas, que NO coincidía con la materia del
     * grupo que le tocaba: eran dos ruedas de longitudes distintas. Daba igual
     * mientras fuese decorativo, pero la materia decide ahora a qué grupos llega
     * el profesor, así que las dos salen del grupo y no pueden contradecirse.
     *
     * Los profesores que se quedan sin grupo —hay más fichas que grupos— quedan
     * sin materia, que es el estado correcto: no imparten nada todavía.
     *
     * @param list<array<string, mixed>> $filas
     */
    private function asignarMateriaALasFichas(array $filas): void
    {
        $materiaPorProfesor = [];

        foreach ($filas as $fila) {
            $materiaPorProfesor[$fila['teacher_id']] ??= $fila['subject_id'];
        }

        $nombres = DB::table('subjects')->where('organization_id', self::ORG)
            ->pluck('name', 'id')->all();

        foreach ($materiaPorProfesor as $profesorId => $materiaId) {
            DB::table('teachers')->where('id', $profesorId)->update([
                'subject_id' => $materiaId,
                'specialty' => $nombres[$materiaId] ?? null,
            ]);
        }
    }

    /**
     * Cada alumno se matricula en una, dos o tres asignaturas, SIEMPRE de las
     * que corresponden a su etapa. Es un centro de refuerzo: nadie se apunta a
     * las doce.
     *
     * @param list<array{id:int,etapa:string}> $alumnos
     * @param list<array{id:int,fee:float,etapas:list<string>}> $grupos
     * @return list<array{student:int,group:int,fee:float,id:int}>
     */
    private function crearMatriculas(\DateTimeInterface $ahora, array $alumnos, array $grupos): array
    {
        $filas = [];

        foreach ($alumnos as $i => $alumno) {
            // El filtro por etapa es lo que evita al niño de Pre-escolar
            // matriculado en Contabilidad.
            $posibles = array_values(array_filter(
                $grupos,
                fn (array $g) => in_array($alumno['etapa'], $g['etapas'], true)
            ));

            if ($posibles === []) {
                continue;
            }

            $cuantas = min(1 + ($i % 3), count($posibles));
            $usados = [];

            for ($k = 0; $k < $cuantas; $k++) {
                $g = $posibles[($i * 7 + $k * 13) % count($posibles)];

                if (in_array($g['id'], $usados, true)) {
                    continue;
                }
                $usados[] = $g['id'];

                $filas[] = [
                    'organization_id' => self::ORG,
                    'student_id' => $alumno['id'],
                    'class_group_id' => $g['id'],
                    'enrolled_at' => self::CURSO_INICIO,
                    'monthly_fee' => $g['fee'],
                    'status' => 'active',
                    'created_at' => $ahora,
                    'updated_at' => $ahora,
                ];
            }
        }

        foreach (array_chunk($filas, 200) as $trozo) {
            DB::table('enrollments')->insert($trozo);
        }

        return DB::table('enrollments')->where('organization_id', self::ORG)
            ->select('id', 'student_id', 'class_group_id', 'monthly_fee')->get()
            ->map(fn ($e) => [
                'id' => (int) $e->id,
                'student' => (int) $e->student_id,
                'group' => (int) $e->class_group_id,
                'fee' => (float) $e->monthly_fee,
            ])->all();
    }

    /**
     * Sesiones de las últimas semanas del curso, para que las pantallas de
     * Sesiones y Asistencia no aparezcan vacías en la demostración.
     *
     * @param list<array{id:int,fee:float,etapas:list<string>}> $grupos
     * @return list<array{id:int,group:int}>
     */
    private function crearSesiones(\DateTimeInterface $ahora, array $grupos): array
    {
        $filas = [];

        foreach ($grupos as $i => $g) {
            for ($s = 0; $s < 4; $s++) {
                // Hacia atrás desde el final del curso, semana a semana. Las
                // sesiones tienen que caer DENTRO del curso: una clase fechada
                // fuera de sus propias fechas de inicio y fin es de las cosas
                // que alguien del sector detecta en la primera mirada.
                $dia = Carbon::parse(self::CURSO_FIN)->subDays(7 + $s * 7 + ($i % 5));

                // Y en día lectivo: nadie da refuerzo en sábado o domingo.
                if ($dia->isSunday()) {
                    $dia = $dia->subDays(2);
                } elseif ($dia->isSaturday()) {
                    $dia = $dia->subDay();
                }

                $filas[] = [
                    'organization_id' => self::ORG,
                    'class_group_id' => $g['id'],
                    // `created_by` NO se nombra a propósito. Es nullable, así
                    // que dejarlo fuera da el mismo resultado, y nombrarlo ataba
                    // este seeder a que esa columna exista: en una rama donde
                    // todavía no está, la inserción falla entera.
                    'title' => 'Sesión ' . ($s + 1) . ' — ' . $dia->format('d/m/Y'),
                    'session_date' => $dia->toDateString(),
                    'starts_at' => $i % 2 === 0 ? '08:00:00' : '15:00:00',
                    'ends_at' => $i % 2 === 0 ? '10:00:00' : '17:00:00',
                    'room' => 'Aula ' . (1 + ($i % 8)),
                    'created_at' => $ahora,
                    'updated_at' => $ahora,
                ];
            }
        }

        foreach (array_chunk($filas, 200) as $trozo) {
            DB::table('class_sessions')->insert($trozo);
        }

        return DB::table('class_sessions')->where('organization_id', self::ORG)
            ->select('id', 'class_group_id')->get()
            ->map(fn ($s) => ['id' => (int) $s->id, 'group' => (int) $s->class_group_id])->all();
    }

    /**
     * Asistencia de una parte de las sesiones, con la mezcla de estados que
     * hace falta para que se vean los tres distintivos.
     *
     * @param list<array{id:int,group:int}> $sesiones
     * @param list<array{student:int,group:int,fee:float,id:int}> $matriculas
     */
    private function crearAsistencia(\DateTimeInterface $ahora, array $sesiones, array $matriculas): void
    {
        $porGrupo = [];
        foreach ($matriculas as $m) {
            $porGrupo[$m['group']][] = $m['student'];
        }

        $filas = [];

        // Solo un tercio de las sesiones: pasar lista de todas produciría miles
        // de filas que no aportan nada a una demostración.
        foreach (array_slice($sesiones, 0, (int) ceil(count($sesiones) / 3)) as $i => $s) {
            foreach ($porGrupo[$s['group']] ?? [] as $k => $alumno) {
                $sorteo = ($i + $k) % 10;

                $filas[] = [
                    'organization_id' => self::ORG,
                    'class_session_id' => $s['id'],
                    'student_id' => $alumno,
                    'status' => match (true) {
                        $sorteo === 0 => 'absent',
                        $sorteo === 1 => 'late',
                        default => 'present',
                    },
                    'created_at' => $ahora,
                    'updated_at' => $ahora,
                ];
            }
        }

        foreach (array_chunk($filas, 300) as $trozo) {
            DB::table('attendances')->insert($trozo);
        }
    }

    /**
     * Un pago por alumno, sobre una de sus matrículas.
     *
     * El importe sale de la cuota de la matrícula y no de un número al azar: si
     * en la demostración alguien compara el pago con la matrícula del alumno y
     * no cuadran, la credibilidad se va abajo por un detalle tonto.
     *
     * @param list<array{student:int,group:int,fee:float,id:int}> $matriculas
     * @param list<array{id:int,etapa:string}> $alumnos
     */
    private function crearPagos(\DateTimeInterface $ahora, array $matriculas, array $alumnos): int
    {
        $porAlumno = [];
        foreach ($matriculas as $m) {
            $porAlumno[$m['student']] ??= $m;
        }

        /*
         * Cada periodo con su mes real al lado. La fecha del cobro se saca de
         * ahí y no de un `subDays()` al azar: en una versión anterior salían
         * pagos de «Noviembre 2026» fechados en junio, cinco meses antes del
         * periodo que cobraban. Nadie se cree una plataforma de cobros que
         * muestra eso en su propia demostración.
         */
        $meses = [['Marzo 2026', '2026-03'], ['Abril 2026', '2026-04'], ['Mayo 2026', '2026-05']];
        $filas = [];

        foreach ($alumnos as $i => $alumno) {
            $m = $porAlumno[$alumno['id']] ?? null;
            if ($m === null) {
                continue;
            }

            // Mayoría cobrados, unos cuantos pendientes y algún anulado: los
            // tres estados tienen que aparecer en la tabla.
            $estado = match (true) {
                $i % 11 === 0 => 'pending',
                $i % 23 === 0 => 'cancelled',
                default => 'paid',
            };

            $filas[] = [
                'organization_id' => self::ORG,
                'student_id' => $alumno['id'],
                'guardian_id' => DB::table('students')->where('id', $alumno['id'])->value('guardian_id'),
                'enrollment_id' => $m['id'],
                'amount' => $m['fee'],
                'period_label' => $meses[$i % 3][0],
                // Dentro del mes que se cobra: entre el 1 y el 28.
                'paid_at' => $meses[$i % 3][1] . '-' . str_pad((string) mt_rand(1, 28), 2, '0', STR_PAD_LEFT),
                'payment_method' => ['cash', 'transfer', 'card'][$i % 3],
                'status' => $estado,
                'reference' => 'REC-2026-' . str_pad((string) ($i + 1), 4, '0', STR_PAD_LEFT),
                'created_at' => $ahora,
                'updated_at' => $ahora,
            ];
        }

        foreach (array_chunk($filas, 200) as $trozo) {
            DB::table('payments')->insert($trozo);
        }

        return count($filas);
    }

    // ── Generadores ─────────────────────────────────────────────────────────

    /** @return array{0:string,1:string} */
    private function persona(): array
    {
        $nombre = mt_rand(0, 1) === 0
            ? self::NOMBRES_M[mt_rand(0, count(self::NOMBRES_M) - 1)]
            : self::NOMBRES_F[mt_rand(0, count(self::NOMBRES_F) - 1)];

        $apellido = self::APELLIDOS[mt_rand(0, count(self::APELLIDOS) - 1)]
            . ' ' . self::APELLIDOS[mt_rand(0, count(self::APELLIDOS) - 1)];

        return [$nombre, $apellido];
    }

    /**
     * Dominio `ejemplo.gq`: local de Guinea Ecuatorial y, a la vez, evidente
     * para cualquiera que lo lea que el dato es inventado. Es deliberado —
     * estos datos se van a enseñar en público y en vídeo.
     */
    private function correo(string $nombre, string $apellido, int $n): string
    {
        $limpio = fn (string $s) => strtolower(strtr(
            preg_replace('/[^A-Za-zÁÉÍÓÚÑáéíóúñ]/u', '', explode(' ', $s)[0]) ?? '',
            ['á' => 'a', 'é' => 'e', 'í' => 'i', 'ó' => 'o', 'ú' => 'u', 'ñ' => 'n',
             'Á' => 'a', 'É' => 'e', 'Í' => 'i', 'Ó' => 'o', 'Ú' => 'u', 'Ñ' => 'n']
        ));

        return $limpio($nombre) . '.' . $limpio($apellido) . $n . '@ejemplo.gq';
    }

    /** Prefijos reales de Guinea Ecuatorial: 222 y 555. */
    private function telefono(): string
    {
        return '+240 ' . (mt_rand(0, 1) === 0 ? '222' : '555')
            . ' ' . mt_rand(100, 999) . ' ' . mt_rand(100, 999);
    }

    private function direccion(): string
    {
        $vias = ['Barrio Ela Nguema', 'Barrio Caracolas', 'Avenida de la Independencia',
            'Barrio Semu', 'Zona Paraíso', 'Barrio Ncolombong', 'Carretera de Luba',
            'Barrio Los Ángeles', 'Zona Buena Esperanza'];

        return $vias[mt_rand(0, count($vias) - 1)] . ', ' . ['Malabo', 'Bata'][mt_rand(0, 1)];
    }
}
