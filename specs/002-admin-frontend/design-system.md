# Design System

**Feature**: `002-admin-frontend` | **Fecha**: 2026-08-16

Fuente única del lenguaje visual. Ningún color, espaciado, radio ni tamaño de letra debe escribirse suelto en un
componente (FR-054): todo pasa por los tokens de `styles/tokens.css`.

**Intención**: confianza, control, eficiencia, precisión. La interfaz debe desaparecer detrás de la tarea. El azul es
acento, no protagonista: si una pantalla parece azul, está mal (FR-056).

---

## 1. Color

### Tokens base

```css
:root {
  /* Superficies */
  --color-bg:            #F8FAFC;   /* fondo de la aplicación */
  --color-surface:       #FFFFFF;   /* tarjetas, tablas, formularios */
  --color-surface-sunken: #F1F5F9;  /* cabecera de tabla, filas alternas */
  --color-sidebar:       #111827;   /* barra lateral */

  /* Texto */
  --color-text:          #111827;
  --color-text-muted:    #64748B;
  --color-text-inverse:  #F8FAFC;   /* sobre sidebar y botón primario */

  /* Estructura */
  --color-border:        #E5E7EB;
  --color-border-strong: #CBD5E1;   /* bordes de campo, más contraste */

  /* Acento */
  --color-primary:       #2563EB;
  --color-primary-hover: #1D4ED8;
  --color-primary-soft:  #EFF6FF;   /* fondo de estado activo */

  /* Estados */
  --color-success:       #16A34A;
  --color-warning:       #D97706;
  --color-error:         #DC2626;
  --color-info:          #0284C7;
}
```

Los cuatro colores de estado llevan además una variante `-soft` para fondos de distintivo, derivada de cada tono. El
verde **solo** aparece como éxito (FR-057); no es color de identidad.

### Reglas de uso

| Uso | Token |
|---|---|
| Acción principal de una pantalla (una sola) | `--color-primary` |
| Acción secundaria | superficie con `--color-border-strong` |
| Acción destructiva | `--color-error`, y siempre tras confirmación |
| Sección activa en la navegación | `--color-primary-soft` de fondo **más** un indicador de forma |
| Anillo de foco | `--color-primary`, 2 px, con separación de 2 px |

**El color nunca es el único portador de información** (FR-051). Todo estado —asistencia, pago, organización— se
acompaña de texto. Un distintivo rojo sin la palabra «Anulado» no es válido.

### Contraste

Objetivo WCAG 2.1 AA (FR-050): 4,5:1 en texto normal, 3:1 en texto grande y en los límites de los controles.

Ratios calculados sobre la paleta definitiva, no estimados:

| Combinación | Ratio | Veredicto |
|---|---|---|
| Texto principal `#111827` sobre superficie | 17,74:1 | Válido |
| Texto inverso `#F8FAFC` sobre sidebar | 16,96:1 | Válido |
| Primario `#2563EB` sobre blanco, y blanco sobre primario | 5,17:1 | Válido |
| Error `#DC2626` sobre blanco | 4,83:1 | Válido |
| Texto secundario `#64748B` sobre superficie | 4,76:1 | Válido, al límite |
| Texto secundario `#64748B` sobre fondo `#F8FAFC` | 4,55:1 | Válido, muy al límite |
| **Información `#0284C7` sobre blanco** | **4,10:1** | **Insuficiente para texto normal** |
| **Éxito `#16A34A` sobre blanco** | **3,30:1** | **Insuficiente para texto normal** |
| **Aviso `#D97706` sobre blanco** | **3,19:1** | **Insuficiente para texto normal** |

**Consecuencia obligatoria.** Los tres colores de estado en rojo de la tabla —información, éxito y aviso— **NO DEBEN
usarse como color de texto sobre blanco**. Cumplen el 3:1 de elementos de interfaz, así que valen para bordes, iconos y
fondos de distintivo, pero el texto de un distintivo debe ir en un tono oscurecido de la misma familia sobre el fondo
suave, no en el color puro. Es la trampa más común de esta paleta y la que haría fallar SC-006 al final.

`--color-text-muted` pasa por poco en ambos fondos, así que **no debe usarse por debajo de 14 px** ni para información
esencial: queda para texto de apoyo.

## 2. Tipografía

Inter, servida localmente (D10, FR-058). Grosores 400, 500, 600 y 700 en `woff2`. Nada de peticiones externas.

```css
--font-sans: 'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif;
--font-mono: ui-monospace, 'Cascadia Code', monospace;  /* identificadores, referencias */

--text-xs:   0.75rem;   /* rótulos de tarjeta móvil, texto legal */
--text-sm:   0.875rem;  /* tablas, texto de apoyo — tamaño de trabajo */
--text-base: 1rem;      /* cuerpo, campos de formulario */
--text-lg:   1.125rem;
--text-xl:   1.25rem;   /* título de sección */
--text-2xl:  1.5rem;    /* título de página */

--leading-tight:  1.25;
--leading-normal: 1.5;
```

Los campos de formulario van a `--text-base` (16 px) como mínimo: por debajo, Safari en iOS hace zoom automático al
enfocar, y eso rompe la maquetación en móvil, que es el dispositivo principal del profesor.

Las cifras de tablas y de indicadores usan `font-variant-numeric: tabular-nums`, para que las columnas de importes
queden alineadas y comparables de un vistazo.

## 3. Espaciado, radio y elevación

Escala de 4 px. No se usan valores fuera de ella.

```css
--space-1: 0.25rem;  --space-2: 0.5rem;   --space-3: 0.75rem;
--space-4: 1rem;     --space-5: 1.25rem;  --space-6: 1.5rem;
--space-8: 2rem;     --space-10: 2.5rem;  --space-12: 3rem;

--radius-sm: 4px;    /* distintivos */
--radius-md: 6px;    /* botones, campos */
--radius-lg: 8px;    /* tarjetas, tablas */
--radius-full: 9999px;

--shadow-sm: 0 1px 2px rgb(15 23 42 / 0.05);
--shadow-md: 0 4px 6px -1px rgb(15 23 42 / 0.08);
--shadow-lg: 0 10px 20px -5px rgb(15 23 42 / 0.12);  /* diálogo y panel deslizante */
```

La elevación es sobria a propósito: el software administrativo se lee mejor con jerarquía por borde y superficie que por
sombra. `--shadow-lg` se reserva a lo que flota de verdad.

## 4. Layout

```css
--sidebar-width: 264px;
--header-height: 56px;
--content-max:  1440px;
```

**Escritorio**: barra lateral fija, contenido a su derecha con `--content-max` y margen automático.

**Estrecho**: la barra lateral se convierte en panel deslizante sobre el contenido, con una capa de oscurecimiento
(FR-018, FR-019).

### Puntos de ruptura

FR-060 exige que se deriven del contenido, no de dispositivos. Los que se usan y su justificación medible:

| Punto | Qué cambia | Por qué ahí |
|---|---|---|
| `--bp-sidebar: 1024px` | La barra lateral pasa a panel deslizante | 264 px de barra más 720 px de contenido mínimo útil para una tabla de trabajo, más el espaciado |
| `--bp-form: 640px` | Los formularios pasan de dos columnas a una | Dos campos legibles necesitan ~280 px cada uno más la separación |

**Las tablas no usan puntos de ruptura de pantalla.** Cada `DataTable` cambia a tarjetas según el ancho **de su propio
contenedor**, medido con `ResizeObserver` (D8). Una tabla de tres columnas y otra de ocho no deben cambiar de forma al
mismo ancho de ventana, y el número de columnas lo decide cada pantalla.

## 5. Componentes

Anatomía y estados obligatorios. Todos los textos vienen de `t()`.

### Button

Variantes: `primary`, `secondary`, `ghost`, `danger`. Tamaños: `sm`, `md`.

Estados: reposo, hover, foco visible, activo, deshabilitado y **cargando**. En carga muestra indicador, conserva su
ancho —para que la maquetación no salte— y queda deshabilitado (FR-036).

Altura mínima táctil de 40 px. Un botón solo con icono lleva `aria-label`.

### Input · Select · Textarea

Se componen siempre dentro de `Field`, que agrupa etiqueta, control, texto de ayuda y error, y los enlaza con
`aria-describedby` (FR-032). En error: borde `--color-error`, `aria-invalid`, y mensaje debajo. El asterisco de campo
obligatorio va acompañado de `aria-required`, porque el asterisco solo es una convención visual (FR-033).

### DataTable

Composición: barra de herramientas (búsqueda, acción principal) · tabla · paginación.

Estados: cargando (esqueleto que **reserva la altura de las filas**, FR-042), vacío inicial, vacío por búsqueda, error
con reintento, y con datos.

En modo tarjeta cada fila es una tarjeta con rótulo sobre valor y las acciones al pie. La búsqueda solo se renderiza si
la pantalla la declara soportada (FR-024).

### Modal · Drawer

Foco atrapado mientras están abiertos, cierre con `Escape` y al pulsar fuera, y devolución del foco al elemento que los
abrió (FR-049). `role="dialog"`, `aria-modal="true"` y título enlazado con `aria-labelledby`. El fondo bloquea el
desplazamiento.

`ConfirmDialog` se construye sobre `Modal`: nombra **qué** se va a eliminar, y su acción de confirmar es `danger`
(FR-035).

### Toast

Esquina inferior derecha en escritorio, superior en móvil. Se cierra solo a los 5 segundos, salvo los de error, que
esperan al usuario. Vive en una región `aria-live="polite"` —`assertive` para errores— de modo que el lector de pantalla
lo anuncie (FR-046). No es el único canal: un error de formulario se muestra además junto al campo.

### Badge

Tonos: neutro, éxito, aviso, error, información. Siempre con texto (FR-051).

Correspondencia fija de estados, resuelta por `t()`:

| Dominio | Valor | Tono |
|---|---|---|
| Alumno, grupo, matrícula | `active` / `inactive` | éxito / neutro |
| Asistencia | `present` / `late` / `absent` | éxito / aviso / error |
| Pago | `paid` / `pending` / `cancelled` | éxito / aviso / neutro |
| Organización | `active` / `suspended` | éxito / error |

Un pago anulado usa tono **neutro**, no error: es un estado administrativo legítimo, no un fallo. El rojo se reserva a
lo que exige atención.

### EmptyState · ErrorState · LoadingState

Tres componentes distintos y visualmente distinguibles (FR-041). `EmptyState` diferencia «aún no hay registros» —con la
acción de crear el primero— de «la búsqueda no encontró nada» —con la acción de limpiar la búsqueda— (FR-043).
`ErrorState` siempre ofrece reintentar sin recargar (FR-044).

### Pagination

Anterior, siguiente, posición y total (FR-027). No se muestra con una sola página. En móvil se reduce a anterior,
siguiente y posición.

## 6. Formato de datos

Todo a través de `i18n/index.js`, con la configuración regional del idioma activo (FR-073). Nunca formato fijo escrito a
mano.

- **Fechas**: `Intl.DateTimeFormat`. Formato corto en tablas, largo en detalle.
- **Horas**: `HH:MM`, recortando los segundos que devuelve la API.
- **Importes**: `Intl.NumberFormat` con separador de millar y dos decimales (FR-024 de la spec de tenancy, SC-010 de
  esta). El dato se almacena sin divisa asociada —deuda XII.b, ajena a esta feature—, así que el símbolo procede de la
  configuración de presentación, no del registro.
- **Vacíos**: guion largo `—`, nunca cadena vacía ni `null` a la vista.

## 7. Movimiento

Transiciones de 150 ms para color y de 200 ms para desplazamiento. El panel deslizante entra en 250 ms.

Sin animación decorativa: el `fadeUp`, el `glowPulse` y el revelado por desplazamiento del frontend actual pertenecen al
concepto promocional y no se trasladan. En una herramienta de uso diario, la animación es coste.

Todo movimiento se cancela bajo `@media (prefers-reduced-motion: reduce)`.
