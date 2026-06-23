import { Link } from 'react-router-dom'
import { PublicLayout } from '../components/PublicLayout'
import { contactDetails, overviewCards } from '../content/publicContent'

export function PublicHomePage() {
  return (
    <PublicLayout>
      <main>
        <section className="public-hero" id="accueil">
          <div className="public-hero-centered">
            <div className="hero-stack">
              <div className="hero-chip">Accompagnement scolaire personnalise</div>
              <h1 className="hero-title">Une experience plus claire pour decouvrir Refuerzo Elite.</h1>
              <p className="hero-copy">
                Le centre accompagne les eleves dans un cadre rassurant, structurant et ambitieux, avec une attention
                particuliere a la regularite, a la methode et aux progres observables.
              </p>

              <div className="public-actions">
                <Link className="primary-btn link-btn" to="/contact">Demander des informations</Link>
                <Link className="secondary-btn link-btn" to="/services">Explorer les services</Link>
              </div>

              <div className="metrics-grid">
                <article className="metric-card">
                  <div className="section-label">Public</div>
                  <strong>Primaire, college et lycee</strong>
                </article>
                <article className="metric-card">
                  <div className="section-label">Approche</div>
                  <strong>Suivi, methode et progression durable</strong>
                </article>
                <article className="metric-card">
                  <div className="section-label">Relation</div>
                  <strong>Dialogue clair entre eleves, centre et familles</strong>
                </article>
              </div>
            </div>
          </div>
        </section>

        <section className="public-section reveal">
          <div className="section-head public-section-head">
            <div>
              <div className="section-label">Explorer</div>
              <h2>Trois facons de comprendre le projet pedagogique du centre.</h2>
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
                    En savoir plus
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="public-section contact-section reveal" id="contact">
          <div className="section-head public-section-head">
            <div>
              <div className="section-label">Contact</div>
              <h2>Parlons du besoin scolaire de votre enfant.</h2>
            </div>
            <p className="hint">
              Refuerzo Elite reste disponible pour orienter les familles, presenter ses modalites de suivi et construire
              un accompagnement adapte.
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
