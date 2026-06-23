import { PublicLayout } from '../components/PublicLayout'
import { contactDetails, publicImages } from '../content/publicContent'

export function ContactPage() {
  return (
    <PublicLayout>
      <main>
        <section className="public-section page-hero">
          <div className="page-hero-grid">
            <div className="page-copy">
              <div className="section-label">Contact</div>
              <h1>Un premier echange pour comprendre le besoin de chaque eleve.</h1>
              <p>
                Refuerzo Elite accompagne les familles avec une prise de contact simple, claire et humaine. L'objectif
                est d'identifier le niveau, les priorites scolaires et le type de suivi le plus adapte.
              </p>
            </div>

            <div className="hero-image-frame page-hero-image">
              <img alt="Photo d'un entretien avec une famille au centre" src={publicImages.contact} />
            </div>
          </div>
        </section>

        <section className="public-section reveal">
          <div className="section-head public-section-head">
            <div>
              <div className="section-label">Coordonnees</div>
              <h2>Choisissez le canal le plus pratique pour nous joindre.</h2>
            </div>
            <p className="hint">
              Le centre peut vous orienter sur les matieres, les horaires, le niveau de l'eleve et les prochaines
              etapes d'inscription.
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
              Ecrire sur WhatsApp
            </a>
            <a className="secondary-btn link-btn" href="mailto:refuerzoelite@gmail.com">
              Envoyer un e-mail
            </a>
          </div>
        </section>
      </main>
    </PublicLayout>
  )
}
