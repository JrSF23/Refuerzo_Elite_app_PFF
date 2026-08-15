<!--
SYNC IMPACT REPORT
==================
Version change: TEMPLATE (sin versionar) → 1.0.0
Tipo de cambio: MAJOR — ratificación inicial. Se sustituyen todos los placeholders
del template por el contenido real del proyecto SmartWork.

Principios definidos (12, frente a los 5 del template):
  - AÑADIDO  I.    Producto antes que tecnología
  - AÑADIDO  II.   MVP primero
  - AÑADIDO  III.  Reutilización de Refuerzo Elite V2
  - AÑADIDO  IV.   Simplicidad (NO NEGOCIABLE)
  - AÑADIDO  V.    Seguridad por diseño (NO NEGOCIABLE)
  - AÑADIDO  VI.   Mobile-first
  - AÑADIDO  VII.  Bajo coste
  - AÑADIDO  VIII. Producción real
  - AÑADIDO  IX.   Multi-tenancy desde el núcleo
  - AÑADIDO  X.    Evolución incremental
  - AÑADIDO  XI.   Feedback real
  - AÑADIDO  XII.  Internacionalización preparada

Secciones renombradas desde el template:
  - [SECTION_2_NAME] → "Contexto de Producto y Restricciones Técnicas"
  - [SECTION_3_NAME] → "Flujo de Desarrollo y Puertas de Calidad"

Placeholders diferidos: ninguno. No quedan tokens sin resolver.

Follow-up TODOs: ninguno.

------------------------------------------------------------------------------
Version change: 1.0.0 → 1.1.0  (2026-08-14)
Tipo de cambio: MINOR — se modifica y amplía un principio existente. No se elimina
ningún principio ni se altera la gobernanza, por lo que no procede MAJOR.

Principios modificados:
  - MODIFICADO  IX. Multi-tenancy desde el núcleo

Detalle del cambio en IX:
  - ELIMINADA  la regla "un mismo usuario puede tener roles distintos en
               organizaciones distintas", que contradecía la decisión Q1 de
               specs/001-multi-org-tenancy/spec.md.
  - AÑADIDA    pertenencia única: cada usuario pertenece exactamente a una
               organización vía relación directa User → Organization
               (organization_id). Super administradores son la única excepción.
  - AÑADIDA    prohibición explícita de pertenencia múltiple; una persona en dos
               organizaciones usa cuentas independientes.
  - AÑADIDA    prohibición durante el MVP de tabla intermedia user_organizations
               y de selector de organización activa en la interfaz.
  - REESCRITA  la evaluación de roles (Spatie Permission) para el ámbito de la
               única organización del usuario.
  - AMPLIADA   la razón del principio, justificando la pertenencia única por los
               principios II (MVP primero) y IV (Simplicidad).

Secciones añadidas: ninguna.
Secciones eliminadas: ninguna.

Alineación externa: la spec specs/001-multi-org-tenancy/spec.md (FR-004, FR-004a)
queda ahora en coherencia con este principio. No se han modificado specs ni código
en esta enmienda, por decisión explícita del autor.

Follow-up TODOs: ninguno.
-->

# Constitución de SmartWork

SmartWork es un SaaS multi-organización para centros educativos, centros de apoyo, academias y
organizaciones académicas. Nace de **Refuerzo Elite V2**, una aplicación Laravel + React construida
para un único centro de apoyo educativo, y se transforma en un producto capaz de servir a muchas
organizaciones aisladas entre sí.

El mercado inicial es **Guinea Ecuatorial**. La estrategia de entrada es implementación gratuita más
un mes de prueba para los primeros centros piloto durante el periodo de matrícula. Superado el
piloto, el producto pasa a ser un SaaS comercial con suscripción mensual, y solo entonces se evalúa
la expansión a Marruecos y otros mercados.

Este documento gobierna todas las decisiones de producto, arquitectura y desarrollo. Prevalece sobre
cualquier preferencia técnica individual.

## Core Principles

### I. Producto antes que tecnología

Cada funcionalidad DEBE resolver una necesidad real y verificable de una organización educativa.
Toda propuesta de funcionalidad DEBE poder responder por escrito a: qué persona de un centro la
necesita, en qué momento de su trabajo, y qué hace hoy en su lugar. Si esa respuesta no existe o es
hipotética, la funcionalidad NO DEBE implementarse.

Está prohibido justificar trabajo por interés técnico, novedad de una herramienta o elegancia de
diseño. La curiosidad técnica se canaliza fuera del producto.

**Razón**: es el filtro que impide que un equipo pequeño con presupuesto cero gaste su capacidad en
software que nadie usará.

### II. MVP primero

El alcance del piloto define el límite de lo que se construye. Una funcionalidad que no sea
necesaria para que los centros piloto operen durante el periodo de matrícula NO DEBE desarrollarse,
aunque esté prevista para el producto comercial.

Todo trabajo propuesto DEBE clasificarse explícitamente como "necesario para el piloto" o
"posterior al piloto". Lo segundo se registra en el backlog y no se implementa.

**Razón**: el piloto tiene una ventana temporal fija (el periodo de matrícula); todo lo que no
contribuya a llegar a esa ventana la pone en riesgo.

### III. Reutilización de Refuerzo Elite V2

La arquitectura, modelos, migraciones, componentes y código existentes de Refuerzo Elite V2 son el
punto de partida por defecto. Antes de crear cualquier módulo, modelo, endpoint o componente nuevo,
DEBE comprobarse si ya existe algo equivalente que pueda extenderse o generalizarse.

Reescribir código existente que funciona REQUIERE justificación escrita del motivo por el cual
extenderlo no es viable.

**Razón**: el valor acumulado en Refuerzo Elite V2 es el activo principal del proyecto; descartarlo
equivale a empezar de cero sin presupuesto.

### IV. Simplicidad (NO NEGOCIABLE)

El código DEBE seguir los idiomas nativos de Laravel y React. Concretamente, NO DEBEN introducirse:
DDD, CQRS, arquitectura hexagonal, capa de repositorios sobre Eloquent, servicios de aplicación que
solo delegan, event sourcing, ni ninguna capa de abstracción sin un consumidor concreto y actual.

Eloquent, los controladores de Laravel, los Form Requests, las Policies y los componentes de React
son suficientes. Toda capa adicional REQUIERE justificación escrita en el plan de la feature,
nombrando el problema real que resuelve.

**Razón**: la complejidad arquitectónica prematura es el modo más común de fracaso en productos
pequeños; encarece cada cambio posterior sin aportar valor al centro educativo.

### V. Seguridad por diseño (NO NEGOCIABLE)

Los datos de una organización JAMÁS DEBEN ser accesibles desde otra organización. Esta garantía no
admite excepciones, ni temporales ni "solo en desarrollo".

Reglas de obligado cumplimiento:

- Toda consulta a datos pertenecientes a una organización DEBE estar filtrada por organización a
  nivel de modelo (global scope), no únicamente en el controlador.
- Todo endpoint que reciba un identificador DEBE verificar que el recurso pertenece a la
  organización del usuario autenticado, y responder 404 (no 403) cuando no sea así.
- Toda feature que exponga o modifique datos de organización DEBE incluir al menos una prueba
  automatizada que verifique que un usuario de la organización A no puede leer ni modificar datos de
  la organización B.
- Ninguna feature puede considerarse completa sin esa prueba en verde.

**Razón**: una única fuga entre centros destruye la confianza del mercado piloto de forma
irreversible, y el producto maneja datos de menores.

### VI. Mobile-first

El teléfono es el dispositivo principal de uso, no una adaptación posterior. Toda interfaz DEBE
diseñarse y verificarse primero en viewport de móvil (360 px de ancho como referencia mínima) y solo
después ampliarse a pantallas grandes.

Una pantalla que no sea plenamente usable en móvil —incluyendo formularios, tablas y flujos de
varios pasos— NO DEBE darse por terminada. Las tablas de datos DEBEN tener una representación móvil
propia; el desplazamiento horizontal no es una solución aceptable.

**Razón**: en el mercado inicial el acceso a internet y a la aplicación se produce mayoritariamente
desde teléfonos.

### VII. Bajo coste

La infraestructura inicial DEBE apoyarse en soluciones gratuitas o de coste mínimo. Cualquier
servicio de pago recurrente REQUIERE aprobación explícita antes de integrarse, con su coste mensual
estimado documentado.

Se prefieren, por defecto: alojamiento y base de datos en planes gratuitos o compartidos, colas y
tareas programadas basadas en la base de datos antes que servicios dedicados, y almacenamiento de
ficheros en el proveedor más barato disponible. Ninguna dependencia con coste variable puede
introducirse sin un límite de gasto conocido.

**Razón**: el presupuesto inicial es prácticamente cero y el producto no genera ingresos hasta
después del piloto.

### VIII. Producción real

SmartWork maneja datos reales de estudiantes, tutores, profesores y pagos desde el primer centro
piloto. NO es un prototipo ni una demostración.

En consecuencia, DEBEN cumplirse desde el inicio: validación de entrada en servidor para todo dato
persistido, uso de transacciones en operaciones que afecten a varias tablas, copias de seguridad de
la base de datos verificadas y restaurables, registro de errores accesible, y ausencia de datos de
prueba o credenciales en el entorno de producción.

Las operaciones sobre pagos DEBEN dejar traza auditable e inmutable de quién las ejecutó y cuándo.

**Razón**: los centros piloto confían datos de menores y dinero real; un fallo de integridad tiene
consecuencias legales y reputacionales, no solo técnicas.

### IX. Multi-tenancy desde el núcleo

La organización forma parte del modelo de autorización y de aislamiento de datos, no es un filtro
añadido a posteriori. Esto significa:

- Toda entidad de negocio DEBE pertenecer a una organización mediante una clave foránea explícita.
- La organización activa DEBE resolverse a partir del usuario autenticado en cada petición, nunca a
  partir de un parámetro enviado por el cliente.
- Cada usuario DEBE pertenecer exactamente a una organización, mediante una relación directa
  `User → Organization` (`organization_id`). Los usuarios de plataforma (super administradores) son la
  única excepción: NO pertenecen a ninguna organización.
- Un mismo usuario NO DEBE poder pertenecer a varias organizaciones ni tener roles distintos en
  organizaciones distintas. Una persona que trabaje para dos organizaciones DEBE usar cuentas
  independientes, una por cada organización.
- Durante el MVP NO DEBE introducirse una tabla intermedia `user_organizations` ni un selector de
  organización activa en la interfaz.
- Los roles y permisos (Spatie Permission) DEBEN evaluarse dentro del ámbito de la única organización a
  la que pertenece el usuario.
- Toda migración que cree una tabla de negocio DEBE incluir su columna de organización desde el
  primer momento.

**Razón**: retrofitear multi-tenancy sobre un esquema que no lo contempla obliga a reescribir el
modelo de datos completo; hacerlo desde el núcleo cuesta poco ahora y es inasumible después. La
pertenencia única se elige deliberadamente: la pertenencia múltiple multiplica la superficie de fuga
entre organizaciones y añade estado de sesión ("¿en cuál estoy?") sin resolver ninguna necesidad
demostrada de los centros piloto, en contra de los principios II (MVP primero) y IV (Simplicidad).

### X. Evolución incremental

El producto final no se construye de una vez. Cada incremento DEBE dejar el sistema en estado
desplegable y utilizable por un centro real.

NO DEBEN abrirse refactorizaciones amplias, migraciones de stack ni reorganizaciones estructurales
que dejen el sistema inoperativo durante varios días. Los cambios grandes se descomponen en pasos
independientes que aportan valor por sí mismos.

**Razón**: mantener el sistema siempre desplegable es lo que permite incorporar centros piloto
cuando aparezcan, sin depender del calendario de desarrollo.

### XI. Feedback real

Una vez entregado el MVP, las decisiones de producto DEBEN basarse principalmente en el uso
observado y en el feedback explícito de los centros piloto, por encima de la intuición del equipo.

Toda funcionalidad posterior al MVP DEBE citar la evidencia que la motiva: una petición concreta de
un centro, un problema observado en su uso, o un dato de uso medido. Las funcionalidades sin
evidencia asociada permanecen en el backlog.

**Razón**: es el mecanismo que convierte el piloto en aprendizaje real en lugar de en una validación
de suposiciones propias.

### XII. Internacionalización preparada

El diseño DEBE permitir posteriormente distintos idiomas, monedas, formatos de fecha y
configuraciones regionales sin reescribir el sistema. La preparación es estructural; las
traducciones adicionales no forman parte del MVP.

Reglas de obligado cumplimiento:

- Ningún texto visible al usuario DEBE estar escrito directamente en el código; todos pasan por el
  sistema de traducción, con español como idioma por defecto.
- Los importes monetarios DEBEN almacenarse con su moneda asociada, nunca como número desnudo.
- Las fechas y horas DEBEN almacenarse en UTC y formatearse en presentación.
- Ninguna regla de negocio DEBE acoplarse a Guinea Ecuatorial mediante valores fijos en el código;
  lo específico de un país (moneda, calendario escolar, formatos, idioma) es configuración de la
  organización.

**Razón**: la expansión a Marruecos y otros mercados está prevista, y el coste de desacoplar el país
más tarde es muy superior al de no acoplarlo ahora.

## Contexto de Producto y Restricciones Técnicas

**Stack obligatorio.** El stack existente se mantiene y NO DEBE sustituirse sin una razón técnica
fuerte, documentada y aprobada:

- Backend: **Laravel**
- Frontend: **React + Vite**
- Base de datos: **MySQL**
- Autenticación: **Laravel Sanctum**
- Roles y permisos: **Spatie Permission**

Añadir una dependencia nueva REQUIERE justificar por qué el stack actual no cubre la necesidad.
"Preferencia personal", "es más moderno" o "lo usa otro proyecto" no son razones válidas.

**Restricción presupuestaria.** El presupuesto inicial es prácticamente cero. Esta restricción
condiciona las decisiones de infraestructura, dependencias y servicios de terceros, y prevalece
sobre consideraciones de comodidad de desarrollo.

**Fases del producto.** Se reconocen tres fases y ninguna decisión debe adelantar trabajo de una
fase posterior:

1. **Piloto** — gratuito, un mes de prueba, primeros centros de Guinea Ecuatorial durante el
   periodo de matrícula. Objetivo: uso real y feedback.
2. **Comercial** — suscripción mensual, facturación, gestión de planes. Se aborda tras validar el
   piloto.
3. **Expansión** — evaluación de Marruecos y otros mercados. Se aborda tras validar el modelo
   comercial.

## Flujo de Desarrollo y Puertas de Calidad

**Puertas obligatorias antes de dar una feature por terminada:**

1. La feature declara la necesidad real que resuelve y el centro o rol que la solicita (Principio I).
2. La feature está clasificada como necesaria para el piloto (Principio II).
3. Se ha comprobado y documentado qué código existente se reutiliza (Principio III).
4. No introduce capas de abstracción no justificadas por escrito (Principio IV).
5. Incluye prueba automatizada de aislamiento entre organizaciones si toca datos de organización
   (Principio V).
6. Ha sido verificada en viewport móvil de 360 px (Principio VI).
7. No añade coste recurrente sin aprobación previa (Principio VII).
8. Valida la entrada en servidor y usa transacciones donde corresponde (Principio VIII).
9. Sus tablas nuevas incluyen la columna de organización (Principio IX).
10. Deja el sistema desplegable (Principio X).
11. Sus textos visibles pasan por el sistema de traducción y no fija valores propios de un país
    (Principio XII).

**Revisión.** Toda revisión de cambios DEBE verificar explícitamente el cumplimiento de estas
puertas. Un incumplimiento de los principios NO NEGOCIABLES (IV y V) bloquea la integración sin
excepción; el resto puede aceptarse solo con justificación escrita registrada en el plan de la
feature.

**Complejidad.** Cualquier desviación de la simplicidad DEBE registrarse en el plan de la feature
indicando qué alternativa más simple se descartó y por qué era insuficiente.

## Governance

Esta constitución prevalece sobre cualquier otra práctica, preferencia o convención del proyecto. En
caso de conflicto entre este documento y una decisión técnica concreta, prevalece este documento.

**Procedimiento de enmienda.** Toda modificación DEBE: (a) proponerse por escrito indicando el
principio afectado y el motivo, (b) documentar el impacto sobre el trabajo ya planificado, y (c)
registrarse en el Sync Impact Report situado al inicio de este fichero. Las enmiendas se aplican
únicamente sobre `.specify/memory/constitution.md`.

**Política de versionado.** Se aplica versionado semántico al propio documento:

- **MAJOR** — eliminación o redefinición incompatible de un principio o de las reglas de gobernanza.
- **MINOR** — incorporación de un principio o sección nueva, o ampliación material de una guía
  existente.
- **PATCH** — aclaraciones, correcciones de redacción y refinamientos sin cambio de significado.

**Cumplimiento.** Toda revisión de cambios verifica el cumplimiento de los principios y de las
puertas de calidad. La complejidad no justificada se rechaza. Los principios IV (Simplicidad) y V
(Seguridad por diseño) son no negociables y no admiten excepciones temporales.

**Guía en tiempo de ejecución.** Para el desarrollo diario, los agentes y colaboradores siguen esta
constitución junto con las plantillas de `.specify/templates/`, que la leen en tiempo de ejecución.

**Version**: 1.1.0 | **Ratified**: 2026-08-13 | **Last Amended**: 2026-08-14
