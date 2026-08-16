import { PublicLayout } from '../components/PublicLayout'
import { publicImages, serviceBenefits, servicePrograms } from '../content/publicContent'

export function ServicesPage() {
  return (
    <PublicLayout contactHref="/#contacto">
      <main>
        <section
          className="public-section page-hero"
          style={{ backgroundImage: `url(${publicImages.services})` }}
        >
          <div className="page-copy">
            <div className="section-label">Servicios</div>
            <h1>Formas de acompañamiento adaptadas a las necesidades escolares más habituales.</h1>
            <p>
              El centro combina refuerzo académico, metodología y comunicación con las familias para que el alumno
              recupere el control de su trabajo y vuelva a asentar lo que aprende.
            </p>
          </div>
        </section>

        <section className="public-section reveal">
          <div className="section-head public-section-head">
            <div>
              <div className="section-label">Itinerarios disponibles</div>
              <h2>Cada servicio responde a una necesidad concreta del día a día escolar.</h2>
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
              <div className="section-label">Lo que buscan las familias</div>
              <h2>Una ayuda clara, con seguimiento y útil a lo largo del tiempo.</h2>
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
