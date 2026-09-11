<?php

namespace App\Support;

use App\Models\Attendance;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Carbon;

/**
 * Quién está por debajo del umbral de asistencia, y con qué criterio.
 *
 * Existe por una razón concreta: el panel AVISA de cuántos hay y la lista de
 * alumnos tiene que enseñar EXACTAMENTE a esos. Si cada uno llevara su copia del
 * umbral, de la ventana y del mínimo de registros, el día que se ajuste
 * cualquiera de los tres el panel diría 5 y la lista enseñaría 9 — y las dos
 * pantallas serían defendibles por separado, que es lo peor que puede pasar.
 *
 * Aquí viven el criterio y la consulta; el panel y el filtro solo los usan.
 *
 * ── El mínimo de registros no es un detalle ─────────────────────────────────
 *
 * Con dos faltas de dos sesiones el porcentaje es 0 % y ese alumno encabezaría
 * la lista aunque acabe de matricularse. Eso no es un problema de asistencia, es
 * falta de datos, y mezclarlos vacía el aviso de sentido.
 *
 * Aun con el mínimo, el porcentaje solo no basta para juzgar: 50 % sobre 4
 * registros y 72,7 % sobre 22 son situaciones muy distintas y la segunda es la
 * accionable. Por eso la lista muestra la fracción además del porcentaje, y
 * ordena por faltas absolutas en vez de por porcentaje.
 */
class LowAttendance
{
    /** Días hacia atrás que se miran. */
    public const WINDOW_DAYS = 30;

    /** Por debajo de este porcentaje de presencias, el alumno entra. */
    public const THRESHOLD = 75.0;

    /** Registros mínimos para que el porcentaje signifique algo. */
    public const MIN_RECORDS = 4;

    public static function windowStart(): Carbon
    {
        return Carbon::now()->subDays(self::WINDOW_DAYS)->startOfDay();
    }

    /**
     * Acota una consulta de asistencias a la ventana vigente.
     *
     * Se expone porque los recuentos que la lista muestra —registros y faltas—
     * tienen que medirse sobre la MISMA ventana con la que se decidió que el
     * alumno entra. Medirlos sobre todo el histórico daría una fracción que no
     * explica por qué está en la lista.
     */
    public static function inWindow(Builder $attendances): Builder
    {
        return $attendances->whereHas(
            'classSession',
            fn (Builder $sessions) => $sessions->whereBetween(
                'session_date',
                [self::windowStart(), Carbon::now()]
            )
        );
    }

    /**
     * Los identificadores de quienes están por debajo del umbral.
     *
     * Va sobre `Attendance`, que lleva el scope de organización, de modo que la
     * subconsulta ya nace acotada al centro: no hay forma de que un alumno de
     * otra organización se cuele en el `whereIn`.
     */
    public static function studentIds(): Builder
    {
        /*
         * Los umbrales van INCRUSTADOS en el SQL, no como parámetros, y no es
         * descuido.
         *
         * Laravel vincula los enteros con `PDO::PARAM_INT` y todo lo demás como
         * cadena, así que un umbral float viaja como `'75'`. En SQLite cualquier
         * número es menor que cualquier texto —NULL < números < texto < blob—,
         * de modo que `100 < '75'` es VERDADERO y la condición del porcentaje
         * deja de filtrar: entran todos los alumnos con registros suficientes,
         * tengan la asistencia que tengan.
         *
         * En MySQL la misma consulta funciona, porque convierte la cadena a
         * número antes de comparar. Es decir: el fallo es invisible en
         * producción y total en la suite, que corre sobre SQLite. Lo descubrió
         * una prueba nueva de este filtro; el recuento del panel arrastraba la
         * misma comparación desde el principio.
         *
         * Son constantes de esta clase, no entrada del usuario, así que
         * incrustarlas no abre ninguna vía de inyección — y de paso la consulta
         * pasa a comportarse igual en los dos motores.
         */
        return self::inWindow(Attendance::query())
            ->selectRaw('student_id')
            ->groupBy('student_id')
            ->havingRaw(sprintf('COUNT(*) >= %d', self::MIN_RECORDS))
            ->havingRaw(sprintf(
                "SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) * 100.0 / COUNT(*) < %.2f",
                self::THRESHOLD
            ));
    }
}
