import { Link } from 'react-router-dom'
import { useSession } from '../context/SessionContext'

const services = [
  {
    image: '/brand/service-accompagnement.jpg',
    title: 'Cours de renforcement',
    text: 'Un accompagnement cible pour consolider les bases, combler les lacunes et redonner confiance a l eleve.',
  },
  {
    image: '/brand/service-methodologie.jpg',
    title: 'Methodologie de travail',
    text: 'Organisation, techniques de revision, autonomie et preparation concrete aux evaluations.',
  },
  {
    image: '/brand/service-parentalite.jpg',
    title: 'Suivi avec les familles',
    text: 'Une communication claire pour suivre la progression et ajuster l accompagnement quand cela est necessaire.',
  },
]

const pillars = [
  {
    title: 'Encadrement de proximite',
    text: 'Des groupes a taille humaine et une attention reelle a chaque parcours.',
  },
  {
    title: 'Cadre exigeant et rassurant',
    text: 'Une ambiance serieuse, accueillante et tournee vers la progression.',
  },
  {
    title: 'Pedagogie active',
    text: 'Des explications claires, des exercices reguliers et un suivi concret des acquis.',
  },
]

const methodSteps = [
  {
    title: 'Observer',
    text: 'Identifier les besoins reels de l eleve, sa classe, son rythme et ses blocages.',
  },
  {
    title: 'Accompagner',
    text: 'Construire une progression lisible avec des objectifs atteignables et des seances coherentes.',
  },
  {
    title: 'Mesurer',
    text: 'Verifier l evolution des competences, de la confiance et de la regularite au fil du temps.',
  },
]

export function PublicHomePage() {
  const { isAuthenticated, isStaff } = useSession()
  const staffLink = isAuthenticated && isStaff ? '/espace' : '/connexion'
  const staffLabel = isAuthenticated && isStaff ? "Ouvrir l espace equipe" : 'Connexion equipe'

  return (
    <div className="public-shell">
      <header className="public-header">
        <div className="public-brand">
          <img alt="Refuerzo Elite" className="public-logo" src="/brand/logo-refuerzo-elite.png" />
          <div>
            <div className="eyebrow">Centre d accompagnement scolaire</div>
            <strong>Refuerzo Elite</strong>
          </div>
        </div>

        <nav className="public-nav">
          <a href="#accueil">Accueil</a>
          <a href="#centre">Le centre</a>
          <a href="#services">Services</a>
          <a href="#methode">Methode</a>
          <a href="#contact">Contact</a>
        </nav>

        <Link className="ghost-btn link-btn" to={staffLink}>
          {staffLabel}
        </Link>
      </header>

      <main>
        <section className="public-hero" id="accueil">
          <div className="public-hero-grid">
            <div className="hero-stack">
              <div className="hero-chip">Accompagnement scolaire personnalise</div>
              <h1 className="hero-title">Un centre de soutien ancre dans la proximite, la rigueur et la reussite.</h1>
              <p className="hero-copy">
                Refuerzo Elite accompagne les eleves dans un cadre humain et exigeant, avec une attention particuliere
                a la confiance, a la regularite et aux progres visibles.
              </p>

              <div className="public-actions">
                <a className="primary-btn link-btn" href="#contact">Demander des informations</a>
                <a className="secondary-btn link-btn" href="#services">Decouvrir l accompagnement</a>
              </div>

              <div className="metrics-grid">
                <article className="metric-card">
                  <div className="section-label">Public</div>
                  <strong>Primaire, college et lycee</strong>
                </article>
                <article className="metric-card">
                  <div className="section-label">Approche</div>
                  <strong>Suivi, methode et regularite</strong>
                </article>
                <article className="metric-card">
                  <div className="section-label">Cadre</div>
                  <strong>Centre moderne inspire de l identite historique</strong>
                </article>
              </div>
            </div>

            <div className="hero-visual">
              <div className="hero-image-frame">
                <img alt="Communaute Refuerzo Elite" src="/brand/hero-community.jpg" />
              </div>
            </div>
          </div>
        </section>

        <section className="public-section" id="centre">
          <div className="section-head public-section-head">
            <div>
              <div className="section-label">Le centre</div>
              <h2>Une identite plus nette, toujours fidele a Refuerzo Elite.</h2>
            </div>
            <p className="hint">
              La plateforme moderne reprend les codes visuels historiques du centre: fond sombre, vert signature et
              communication directe avec les familles.
            </p>
          </div>

          <div className="feature-grid">
            {pillars.map((pillar) => (
              <article className="feature-card" key={pillar.title}>
                <h3>{pillar.title}</h3>
                <p>{pillar.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="public-section" id="services">
          <div className="section-head public-section-head">
            <div>
              <div className="section-label">Services</div>
              <h2>Un accompagnement pense pour la progression de chaque eleve.</h2>
            </div>
          </div>

          <div className="service-grid">
            {services.map((service) => (
              <article className="service-card" key={service.title}>
                <img alt={service.title} src={service.image} />
                <div className="service-card-content">
                  <h3>{service.title}</h3>
                  <p>{service.text}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="public-section" id="methode">
          <div className="section-head public-section-head">
            <div>
              <div className="section-label">Methode</div>
              <h2>Une demarche simple: comprendre, accompagner, verifier.</h2>
            </div>
          </div>

          <div className="method-grid">
            {methodSteps.map((step, index) => (
              <article className="method-card" key={step.title}>
                <span className="method-index">0{index + 1}</span>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="public-section contact-section" id="contact">
          <div className="contact-grid">
            <div className="contact-panel">
              <div className="section-label">Contact</div>
              <h2>Parlons de votre besoin scolaire.</h2>
              <p className="hint">
                Le site public est pense pour les visiteurs, les familles et les eleves. L equipe reste joignable par
                telephone, e-mail ou WhatsApp.
              </p>
            </div>

            <div className="contact-cards">
              <article className="contact-card">
                <div className="section-label">Telephone</div>
                <strong>+240 222 862 579</strong>
              </article>
              <article className="contact-card">
                <div className="section-label">E-mail</div>
                <strong>refuerzoelite@gmail.com</strong>
              </article>
              <article className="contact-card">
                <div className="section-label">Adresse</div>
                <strong>B/ Sumco (Ela-Nguema)</strong>
              </article>
            </div>
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

      <footer className="public-footer">
        <p>Refuerzo Elite - Centre d accompagnement scolaire.</p>
      </footer>
    </div>
  )
}
