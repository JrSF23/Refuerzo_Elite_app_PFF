import { PublicLayout } from '../components/PublicLayout'
import { contactDetails, publicImages } from '../content/publicContent'

export function ContactPage() {
  return (
    <PublicLayout>
      <main>
        <section
          className="public-section page-hero page-hero--svg"
          style={{ backgroundImage: `url(${publicImages.contact})` }}
        >
          <div className="page-copy">
            <div className="section-label">Contacto</div>
            <h1>Una primera conversación para entender lo que necesita cada alumno.</h1>
            <p>
              Refuerzo Elite acompaña a las familias con un primer contacto sencillo, claro y cercano. El objetivo es
              identificar el nivel, las prioridades escolares y el tipo de seguimiento más adecuado.
            </p>
          </div>
        </section>

        <section className="public-section reveal">
          <div className="section-head public-section-head">
            <div>
              <div className="section-label">Datos de contacto</div>
              <h2>Elija el canal que le resulte más cómodo para contactar con nosotros.</h2>
            </div>
            <p className="hint">
              El centro puede orientarle sobre las asignaturas, los horarios, el nivel del alumno y los siguientes
              pasos de la matrícula.
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

          <div className="public-actions contact-actions">
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
