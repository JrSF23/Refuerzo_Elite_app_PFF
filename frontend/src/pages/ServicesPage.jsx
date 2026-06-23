import { PublicLayout } from '../components/PublicLayout'
import { publicImages, serviceBenefits, servicePrograms } from '../content/publicContent'

export function ServicesPage() {
  return (
    <PublicLayout contactHref="/#contact">
      <main>
        <section className="public-section page-hero">
          <div className="page-hero-grid">
            <div className="page-copy">
              <div className="section-label">Services</div>
              <h1>Des formes d'accompagnement adaptees aux besoins scolaires les plus frequents.</h1>
              <p>
                Le centre articule renforcement academique, methodologie et communication avec les familles pour aider
                l'eleve a reprendre le controle de son travail et a retrouver de la solidite dans ses apprentissages.
              </p>
            </div>

            <div className="hero-image-frame page-hero-image">
              <img alt="Photo d'un atelier d'accompagnement scolaire" src={publicImages.services} />
            </div>
          </div>
        </section>

        <section className="public-section reveal">
          <div className="section-head public-section-head">
            <div>
              <div className="section-label">Parcours proposes</div>
              <h2>Chaque service repond a un besoin concret du quotidien scolaire.</h2>
            </div>
          </div>

          <div className="service-program-grid stagger-grid">
            {servicePrograms.map((item) => (
              <article className="service-program-card reveal" key={item.title}>
                <div className="section-label">{item.audience}</div>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="public-section reveal">
          <div className="content-card cta-panel">
            <div>
              <div className="section-label">Ce que les familles recherchent</div>
              <h2>Une aide lisible, suivie et utile sur la duree.</h2>
            </div>
            <ul className="bullet-list">
              {serviceBenefits.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </section>
      </main>
    </PublicLayout>
  )
}
