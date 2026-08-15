<?php

namespace App\Providers;

use App\Models\Attendance;
use App\Models\ClassGroup;
use App\Models\ClassSession;
use App\Models\Enrollment;
use App\Models\Guardian;
use App\Models\Organization;
use App\Models\Payment;
use App\Models\Student;
use App\Models\Subject;
use App\Models\Teacher;
use App\Policies\AttendancePolicy;
use App\Policies\ClassGroupPolicy;
use App\Policies\ClassSessionPolicy;
use App\Policies\EnrollmentPolicy;
use App\Policies\GuardianPolicy;
use App\Policies\OrganizationPolicy;
use App\Policies\PaymentPolicy;
use App\Policies\StudentPolicy;
use App\Policies\SubjectPolicy;
use App\Policies\TeacherPolicy;
use App\Support\OrganizationContext;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        // Singleton de petición: el contenedor se reconstruye en cada una, de modo
        // que la organización activa no puede filtrarse entre peticiones.
        $this->app->singleton(OrganizationContext::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Las nueve entidades con endpoint necesitan policy: BaseApiController
        // autoriza en los cinco métodos y `authorize()` deniega cuando no hay
        // ninguna registrada. `audit_events` no aparece porque no tiene
        // controlador; su aislamiento lo garantiza el global scope.
        Gate::policy(Organization::class, OrganizationPolicy::class);
        Gate::policy(Guardian::class, GuardianPolicy::class);
        Gate::policy(Subject::class, SubjectPolicy::class);
        Gate::policy(Teacher::class, TeacherPolicy::class);
        Gate::policy(Enrollment::class, EnrollmentPolicy::class);
        Gate::policy(Payment::class, PaymentPolicy::class);
        Gate::policy(ClassGroup::class, ClassGroupPolicy::class);
        Gate::policy(Student::class, StudentPolicy::class);
        Gate::policy(ClassSession::class, ClassSessionPolicy::class);
        Gate::policy(Attendance::class, AttendancePolicy::class);
    }
}
