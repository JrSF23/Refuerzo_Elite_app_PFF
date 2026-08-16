import { PublicLayout } from '../components/PublicLayout'
import { methodTimeline, methodTools, publicImages } from '../content/publicContent'

export function MethodPage() {
  return (
    <PublicLayout contactHref="/#contacto">
      <main>
        <section
          className="public-section page-hero"
          style={{ backgroundImage: `url(${publicImages.method})` }}
        >
          <div className="page-copy">
            <div className="section-label">Método</div>
            <h1>Una pedagogía sencilla de entender, activa en la práctica y con seguimiento en el tiempo.</h1>
            <p>
              El método de Refuerzo Elite busca hacer concreto el aprendizaje: se observa, se planifica, se hace
              trabajar al alumno de forma activa y se mide con regularidad lo que de verdad cambia.
            </p>
          </div>
        </section>

        <section className="public-section reveal">
          <div className="section-head public-section-head">
            <div>
              <div className="section-label">Progresión</div>
              <h2>Cuatro etapas para convertir el apoyo en progreso duradero.</h2>
            </div>
          </div>

          <div className="timeline-grid stagger-grid">
            {methodTimeline.map((item) => (
              <article className="method-card timeline-card reveal" key={item.step}>
                <span className="method-index">{item.step}</span>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="public-section reveal">
          <div className="feature-grid stagger-grid">
            {methodTools.map((item) => (
              <article className="feature-card info-card reveal" key={item.title}>
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
