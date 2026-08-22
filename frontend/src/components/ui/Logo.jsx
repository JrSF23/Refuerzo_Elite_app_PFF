/**
 * Marca de SmartWork.
 *
 * Una red de nodos: tres puntos unidos entre sí. Alude a la conexión y al
 * trabajo inteligente que da nombre al producto, sin dibujar un cerebro.
 *
 * ── Por qué una red y no un cerebro ────────────────────────────────────────
 *
 * El tamaño real de la marca son 32 px en la barra lateral y 40 px en el acceso.
 * Un cerebro necesita surcos para leerse como tal, y a 32 px los surcos se
 * juntan y dejan una mancha. La red dice lo mismo con tres círculos y tres
 * líneas, que es lo que sí aguanta la reducción.
 *
 * ── Por qué TRES nodos y no cinco ──────────────────────────────────────────
 *
 * La primera versión eran cuatro nodos en las esquinas unidos a uno central. Al
 * renderizarla se vio el problema: las cuatro diagonales que salen del centro
 * forman un ASPA, y los travesaños de arriba y abajo la cerraban en un reloj de
 * arena. No se leía como una red; se leía como una X.
 *
 * El triángulo no tiene ese defecto porque ninguna pareja de líneas se cruza:
 * cada trazo une dos nodos visibles y el ojo reconstruye la figura entera. Es la
 * cantidad mínima de puntos con la que «estar conectados» se entiende.
 *
 * ── Por qué el color no está aquí ──────────────────────────────────────────
 *
 * Se pinta con `currentColor` y el cuadrado azul lo pone el contenedor
 * (`.sidebar__mark`, `.auth-card__mark`). Así la misma marca sirve sobre la barra
 * lateral oscura y sobre la tarjeta blanca sin duplicar el SVG, y el color sigue
 * saliendo de los tokens y no de un valor escrito aquí (FR-054).
 *
 * Decorativa: quien la envuelve ya lleva `aria-hidden`, y el nombre del producto
 * está a su lado como texto de verdad. No se anuncia dos veces.
 */
export function Logo() {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      height="18"
      viewBox="0 0 18 18"
      width="18"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/*
        * Las líneas van ANTES que los círculos para que estos las tapen: si se
        * dibujan encima, el trazo asoma por dentro del nodo y a tamaño pequeño
        * el punto deja de verse redondo.
        */}
      <g
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.5"
      >
        <line x1="9" x2="3.5" y1="3.8" y2="13.8" />
        <line x1="9" x2="14.5" y1="3.8" y2="13.8" />
        <line x1="3.5" x2="14.5" y1="13.8" y2="13.8" />
      </g>

      <g fill="currentColor">
        <circle cx="9" cy="3.8" r="2.3" />
        <circle cx="3.5" cy="13.8" r="2.3" />
        <circle cx="14.5" cy="13.8" r="2.3" />
      </g>
    </svg>
  )
}
