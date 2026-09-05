<?php

namespace App\Http\Controllers\Api;

use App\Models\Payment;
use App\Models\Student;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

/**
 * Estado de cobros por alumno.
 *
 * Es lo que conecta la cuota de la etapa con los pagos: hasta ahora la etapa
 * sabía cuánto cuesta el curso y los pagos sabían cuánto se había ingresado,
 * pero nadie restaba una cosa de la otra. La pregunta que un centro se hace a
 * diario —«¿quién debe y cuánto?»— no tenía respuesta en la aplicación.
 *
 * ── La cuota sale del AULA, no del alumno ni de la matrícula ────────────────
 *
 * El alumno está en un aula, el aula declara su etapa y la etapa lleva el
 * importe del curso. Un alumno sin aula, o cuya aula no tenga etapa todavía, no
 * tiene cuota: se devuelve `null` y NO cero. Son cosas distintas — cero es «no
 * paga nada», nulo es «el centro aún no ha dicho cuánto» — y confundirlas
 * pondría a media escuela en la lista de morosos el día que alguien cree un aula
 * sin clasificar.
 *
 * `enrollments.monthly_fee` sigue existiendo y ya NO se usa para esto. Era el
 * cobro por asignatura, que no es como cobra el centro: producía un importe por
 * cada materia del alumno cuando la cuota es una y del curso entero.
 *
 * ── Todo agregado en la base ────────────────────────────────────────────────
 *
 * Lo pagado sale de una subconsulta agregada por alumno, no de recorrer sus
 * pagos en PHP. Con 150 alumnos y 150 pagos daría igual; con los 500 de un
 * centro real y varios cursos de historial, sumar en el cliente significa traer
 * miles de filas para enseñar una columna.
 *
 * Todo pasa por Eloquent, de modo que el global scope de organización se aplica
 * también dentro de la subconsulta: un `join` a pelo sumaría aquí los pagos de
 * otros centros.
 */
class BillingController extends Controller
{
    use AuthorizesRequests;

    public function __invoke(Request $request): JsonResponse
    {
        // Es información de cobros, así que se autoriza como tal: la policy de
        // pagos es exclusiva de la administración del centro (FR-016). La ruta
        // ya lo impone, y esto lo cierra por si alguna futura se registrara sin
        // el middleware.
        $this->authorize('viewAny', Payment::class);

        $query = Student::query()
            ->with('tutorGroup.stage')
            // Solo lo COBRADO cuenta como pagado. Un pago pendiente o anulado no
            // reduce lo que se debe, y meterlo en la suma haría desaparecer de la
            // lista justo a quien hay que reclamar.
            ->withSum(
                ['payments as paid_total' => fn ($payments) => $payments->where('status', 'paid')],
                'amount'
            );

        if ($request->filled('search')) {
            $search = $request->string('search')->toString();

            $query->where(function ($builder) use ($search): void {
                $builder->orWhere('first_name', 'like', "%{$search}%")
                    ->orWhere('last_name', 'like', "%{$search}%");
            });
        }

        // Solo quien debe algo, cuando se pide. Es la vista que de verdad se usa
        // para reclamar, y tenerla a un parámetro evita que el centro la
        // reconstruya a ojo sobre la lista completa.
        $onlyDebtors = $request->boolean('pending');

        $page = $query->orderBy('last_name')->orderBy('first_name')
            ->paginate(min((int) $request->integer('per_page', 20), 50));

        $rows = collect($page->items())
            ->map(fn (Student $student) => $this->summarise($student))
            ->when($onlyDebtors, fn ($rows) => $rows->filter(
                fn (array $row) => $row['outstanding'] !== null && $row['outstanding'] > 0
            )->values());

        return response()->json([
            'data' => $rows,
            'current_page' => $page->currentPage(),
            'last_page' => $page->lastPage(),
            'per_page' => $page->perPage(),
            'total' => $page->total(),
            'from' => $page->firstItem(),
            'to' => $page->lastItem(),
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function summarise(Student $student): array
    {
        $stage = $student->tutorGroup?->stage;
        $fee = $stage?->fee === null ? null : (float) $stage->fee;
        $paid = (float) ($student->paid_total ?? 0);

        return [
            'id' => $student->getKey(),
            'full_name' => $student->full_name,
            'tutor_group' => $student->tutorGroup?->name,
            'stage' => $stage?->name,
            'fee' => $fee,
            'paid' => $paid,
            // Nulo cuando no hay cuota: restar sobre un importe que nadie ha
            // fijado daría una deuda inventada.
            'outstanding' => $fee === null ? null : round($fee - $paid, 2),
        ];
    }
}
