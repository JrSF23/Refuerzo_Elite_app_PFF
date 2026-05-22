import { PublicLayout } from '../components/PublicLayout'
import { methodTimeline, methodTools, publicImages } from '../content/publicContent'

export function MethodPage() {
  return (
    <PublicLayout contactHref="/#contact">
      <main>
        <section className="public-section page-hero">
          <div className="page-hero-grid">
            <div className="page-copy">
              <div className="section-label">Methode</div>
              <h1>Une pedagogie simple a lire, active dans la pratique et suivie dans le temps.</h1>
              <p>
                La methode de Refuerzo Elite cherche a rendre l'apprentissage concret. On observe, on planifie, on fait
                travailler l'eleve activement et l'on mesure regulierement ce qui change vraiment.
              </p>
            </div>

            <div className="hero-image-frame page-hero-image">
              <img alt="Photo d'eleves en situation d'apprentissage guide" src={publicImages.method} />
            </div>
          </div>
        </section>

        <section className="public-section">
          <div className="section-head public-section-head">
            <div>
              <div className="section-label">Progression</div>
              <h2>Quatre etapes pour transformer le soutien en progression durable.</h2>
            </div>
          </div>

          <div className="timeline-grid">
            {methodTimeline.map((item) => (
              <article className="method-card timeline-card" key={item.step}>
                <span className="method-index">{item.step}</span>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="public-section">
          <div className="feature-grid">
            {methodTools.map((item) => (
              <article className="feature-card info-card" key={item.title}>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </article>
            ))}
          </div>
        </section>
      </main>
    </PublicLayout>
  )
}
