/**
 * Tarjeta: superficie con borde para agrupar contenido.
 *
 * `as` permite que el elemento sea el semánticamente correcto —`section`,
 * `article`, `li`— en lugar de un `div` en todos los casos.
 */
export function Card({ as: Tag = 'div', className = '', children, ...rest }) {
  return (
    <Tag className={`card ${className}`.trim()} {...rest}>
      {children}
    </Tag>
  )
}

/**
 * Cabecera de tarjeta: título a la izquierda, acciones a la derecha.
 *
 * El título es un encabezado real y su nivel se pasa desde fuera: el orden de
 * los encabezados debe seguir la estructura de la página, y una tarjeta no puede
 * saber a qué profundidad se está usando.
 */
export function CardHeader({ title, level = 2, description, actions }) {
  const Heading = `h${level}`

  return (
    <div className="card__header">
      <div className="card__heading">
        <Heading className="card__title">{title}</Heading>
        {description ? <p className="card__description">{description}</p> : null}
      </div>

      {actions ? <div className="card__actions">{actions}</div> : null}
    </div>
  )
}

export function CardBody({ className = '', children }) {
  return <div className={`card__body ${className}`.trim()}>{children}</div>
}
