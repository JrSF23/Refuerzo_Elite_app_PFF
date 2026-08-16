import { Link } from 'react-router-dom'
import { PublicLayout } from '../components/PublicLayout'
import { contactDetails, overviewCards } from '../content/publicContent'

export function PublicHomePage() {
  return (
    <PublicLayout>
      <main>
        <section className="public-hero" id="inicio">
          <div className="public-hero-centered">
            <div className="hero-stack">
              <div className="hero-chip">Apoyo escolar personalizado</div>
              <h1 className="hero-title">Una forma más clara de conocer Refuerzo Elite.</h1>
              <p className="hero-copy">
                El centro acompaña a los alumnos en un entorno que da seguridad, ordena el trabajo y mantiene la
                exigencia, con especial atención a la constancia, al método y a los avances que se pueden observar.
              </p>

              <div className="public-actions">
                <Link className="primary-btn link-btn" to="/contacto">Solicitar información</Link>
                <Link className="secondary-btn link-btn" to="/servicios">Ver los servicios</Link>
              </div>

              <div className="metrics-grid">
                <article className="metric-card">
                  <div className="section-label">A quién va dirigido</div>
                  <strong>Primaria, secundaria y bachillerato</strong>
                </article>
                <article className="metric-card">
                  <div className="section-label">Enfoque</div>
                  <strong>Seguimiento, método y progreso duradero</strong>
                </article>
                <article className="metric-card">
                  <div className="section-label">Relación</div>
                  <strong>Diálogo claro entre alumnos, centro y familias</strong>
                </article>
              </div>
            </div>
          </div>
        </section>

        <section className="public-section reveal">
          <div className="section-head public-section-head">
            <div>
              <div className="section-label">Descubrir</div>
              <h2>Tres formas de entender el proyecto pedagógico del centro.</h2>
            </div>
          </div>

          <div className="overview-grid stagger-grid">
            {overviewCards.map((card) => (
              <article className="media-card reveal" key={card.title}>
                <img alt={card.title} className="media-card-image" src={card.image} />
                <div className="media-card-body">
                  <div className="section-label">{card.eyebrow}</div>
                  <h3>{card.title}</h3>
                  <p>{card.text}</p>
                  <Link className="ghost-btn link-btn" to={card.to}>
                    Saber más
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="public-section contact-section reveal" id="contacto">
          <div className="section-head public-section-head">
            <div>
              <div className="section-label">Contacto</div>
              <h2>Hablemos de lo que su hijo necesita.</h2>
            </div>
            <p className="hint">
              Refuerzo Elite está a disposición de las familias para orientarlas, explicar cómo funciona el seguimiento
              y diseñar un acompañamiento adaptado.
            </p>
          </div>

          <div className="contact-cards contact-cards-wide">
            {contactDetails.map((item) => (
              <article className="contact-card" key={item.label}>
                <div className="section-label">{item.label}</div>
                <strong>{item.value}</strong>
              </article>
            ))}
          </div>

          <div className="public-actions">
            <a className="primary-btn link-btn" href="https://wa.me/240222862579" rel="noreferrer" target="_blank">
              Escribir por WhatsApp
            </a>
            <a className="secondary-btn link-btn" href="mailto:refuerzoelite@gmail.com">
              Enviar un correo
            </a>
          </div>
        </section>
      </main>
    </PublicLayout>
  )
}
