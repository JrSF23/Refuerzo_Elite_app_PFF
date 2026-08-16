import { PublicLayout } from '../components/PublicLayout'
import { centreHighlights, centreSpaces, publicImages } from '../content/publicContent'

export function CentrePage() {
  return (
    <PublicLayout contactHref="/#contacto">
      <main>
        <section
          className="public-section page-hero"
          style={{ backgroundImage: `url(${publicImages.centre})` }}
        >
          <div className="page-copy">
            <div className="section-label">El centro</div>
            <h1>Un entorno estable para aprender, recuperar la confianza y avanzar.</h1>
            <p>
              Refuerzo Elite no se limita a dar clases. El centro construye un marco de trabajo claro, cercano y
              exigente, en el que cada alumno recupera sus referencias, entiende mejor sus dificultades y vuelve a
              ponerse en marcha.
            </p>
          </div>
        </section>

        <section className="public-section reveal">
          <div className="section-head public-section-head">
            <div>
              <div className="section-label">Lo que define al centro</div>
              <h2>Una identidad clara, orientada a la cercanía y al progreso.</h2>
            </div>
          </div>

          <div className="feature-grid stagger-grid">
            {centreHighlights.map((item) => (
              <article className="feature-card info-card reveal" key={item.title}>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="public-section reveal">
          <div className="content-split">
            <article className="content-card">
              <div className="section-label">Entorno de trabajo</div>
              <h2>Un centro pensado para dar tranquilidad sin bajar el listón.</h2>
              <p>
                Los espacios, los ritmos de trabajo y el acompañamiento están organizados para que el alumno sepa hacia
                dónde va, qué se espera de él y cómo puede avanzar sin sentirse perdido.
              </p>
            </article>

            <article className="content-card">
              <div className="section-label">Puntos fuertes</div>
              <ul className="bullet-list">
                {centreSpaces.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
          </div>
        </section>
      </main>
    </PublicLayout>
  )
}
