import { PublicLayout } from '../components/PublicLayout'
import { centreHighlights, centreSpaces, publicImages } from '../content/publicContent'

export function CentrePage() {
  return (
    <PublicLayout contactHref="/#contact">
      <main>
        <section
          className="public-section page-hero"
          style={{ backgroundImage: `url(${publicImages.centre})` }}
        >
          <div className="page-copy">
            <div className="section-label">Le centre</div>
            <h1>Un environnement stable pour apprendre, reprendre confiance et progresser.</h1>
            <p>
              Refuerzo Elite ne se limite pas a donner des cours. Le centre construit un cadre de travail lisible,
              humain et exigeant, dans lequel chaque eleve peut retrouver des repaires, mieux comprendre ses
              difficultes et se remettre en mouvement.
            </p>
          </div>
        </section>

        <section className="public-section reveal">
          <div className="section-head public-section-head">
            <div>
              <div className="section-label">Ce qui fait le centre</div>
              <h2>Une identite claire, orientee vers la proximite et la progression.</h2>
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
              <div className="section-label">Cadre de travail</div>
              <h2>Un centre pense pour rassurer sans baisser l'exigence.</h2>
              <p>
                Les espaces, les rythmes de travail et l'accompagnement humain sont organises pour que l'eleve sache ou
                il va, ce que l'on attend de lui et comment il peut avancer sans se sentir perdu.
              </p>
            </article>

            <article className="content-card">
              <div className="section-label">Points forts</div>
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
