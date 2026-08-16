const path = require("path");
const pptxgen = require("pptxgenjs");

// ── Couleurs de la marque (sans prefixe #) ────────────────────────
const C = {
  darkBg:    "030805",
  accent:    "22c55e",
  accentMid: "15803d",
  accentDeep:"14532d",
  lightBg:   "F0FFF4",
  white:     "FFFFFF",
  textDark:  "0F172A",
  textMid:   "374151",
  textMuted: "6B7280",
  mint:      "A7F3D0",
};

// Relativa a este fichero: el script se versiona, asi que no puede depender
// de donde este clonado el repositorio.
const BRAND = path.join(__dirname, "..", "frontend", "public", "brand");
const makeShadow = () => ({ type: "outer", color: "000000", blur: 10, offset: 3, angle: 90, opacity: 0.09 });

const pres = new pptxgen();
pres.layout = "LAYOUT_16x9"; // 10" x 5.625"
pres.title  = "Refuerzo Elite - Presentation du Projet";
pres.author = "Refuerzo Elite";

// ════════════════════════════════════════════════════════════════════
// SLIDE 1 · COUVERTURE
// ════════════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: C.darkBg };

  // Photo droite (attenee)
  s.addImage({ path: `${BRAND}/bg-hero-home.jpg`, x: 4.4, y: 0, w: 5.6, h: 5.625, transparency: 45 });
  s.addShape(pres.shapes.RECTANGLE, {
    x: 4.4, y: 0, w: 5.6, h: 5.625,
    fill: { color: C.darkBg, transparency: 30 }, line: { color: C.darkBg, width: 0 },
  });

  // Logo cercle
  s.addShape(pres.shapes.OVAL, {
    x: 0.55, y: 0.42, w: 0.7, h: 0.7,
    fill: { color: C.accent }, line: { color: C.accent, width: 0 },
  });
  s.addText("RE", {
    x: 0.55, y: 0.42, w: 0.7, h: 0.7,
    fontSize: 18, bold: true, color: C.darkBg,
    align: "center", valign: "middle", margin: 0, fontFace: "Calibri",
  });

  // Eyebrow
  s.addText("PROJET FINAL · CENTRE DE SOUTIEN SCOLAIRE", {
    x: 0.5, y: 1.3, w: 4.5, h: 0.28,
    fontSize: 8.5, color: C.accent, bold: true, charSpacing: 3, align: "left", margin: 0,
  });

  // Titre principal
  s.addText("Refuerzo", {
    x: 0.5, y: 1.65, w: 4.5, h: 0.82,
    fontSize: 54, bold: true, color: C.white, align: "left", margin: 0, fontFace: "Calibri",
  });
  s.addText("Elite", {
    x: 0.5, y: 2.42, w: 4.5, h: 0.82,
    fontSize: 54, bold: true, color: C.accent, align: "left", margin: 0, fontFace: "Calibri",
  });

  // Sous-titre
  s.addText("Plateforme web pour centre de soutien scolaire", {
    x: 0.5, y: 3.35, w: 4.4, h: 0.42,
    fontSize: 13, color: C.mint, align: "left", margin: 0,
  });

  // Tags technologiques
  ["Laravel 12", "React 19", "Docker", "Vite 8"].forEach((tag, i) => {
    const tw = 1.07; const gap = 0.12;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: 0.5 + i * (tw + gap), y: 4.0, w: tw, h: 0.3,
      fill: { color: C.accentDeep }, line: { color: C.accentMid, width: 1 }, rectRadius: 0.06,
    });
    s.addText(tag, {
      x: 0.5 + i * (tw + gap), y: 4.0, w: tw, h: 0.3,
      fontSize: 8.5, color: C.accent, bold: true, align: "center", valign: "middle", margin: 0,
    });
  });

  // Pied de page
  s.addText("Malabo · Guinee Equatoriale · 2025", {
    x: 0.5, y: 4.95, w: 4.4, h: 0.28,
    fontSize: 8.5, color: "4B5563", align: "left", margin: 0,
  });

  s.addNotes(
    "Bienvenue au jury. Nous presentons Refuerzo Elite, une application web full-stack " +
    "developpee pour digitaliser la presence du centre de soutien scolaire. " +
    "Breve presentation de l'equipe avant de commencer."
  );
}

// ════════════════════════════════════════════════════════════════════
// SLIDE 2 · LE PROBLEME
// ════════════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: C.lightBg };

  s.addText("CONTEXTE", {
    x: 0.6, y: 0.35, w: 9, h: 0.25,
    fontSize: 9, color: C.accentMid, bold: true, charSpacing: 3, align: "left", margin: 0,
  });
  s.addText("Quel etait le probleme ?", {
    x: 0.6, y: 0.62, w: 8.8, h: 0.68,
    fontSize: 32, bold: true, color: C.textDark, align: "left", margin: 0, fontFace: "Calibri",
  });

  const problems = [
    {
      n: "01",
      title: "Sans presence numerique",
      text: "Le centre ne disposait d'aucun site web ni canal numerique propre pour informer les familles sur les services ou les horaires.",
    },
    {
      n: "02",
      title: "Sans canal avec les familles",
      text: "La communication se gerait uniquement par WhatsApp : informelle, sans structure, difficile a developper et a documenter.",
    },
    {
      n: "03",
      title: "Sans identite de marque",
      text: "Sans design coherent ni materiaux visuels propres, le centre ne pouvait pas se differencier de la concurrence locale.",
    },
  ];

  problems.forEach((p, i) => {
    const x = 0.55 + i * 3.05; const w = 2.85; const y = 1.55;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x, y, w, h: 3.55,
      fill: { color: C.white }, line: { color: "D1FAE5", width: 1 },
      rectRadius: 0.1, shadow: makeShadow(),
    });
    s.addText(p.n, {
      x: x + 0.22, y: y + 0.22, w: 0.55, h: 0.5,
      fontSize: 24, bold: true, color: C.accent, align: "left", margin: 0, fontFace: "Calibri",
    });
    s.addText(p.title, {
      x: x + 0.2, y: y + 0.86, w: w - 0.4, h: 0.58,
      fontSize: 14, bold: true, color: C.textDark, align: "left", margin: 0,
    });
    s.addText(p.text, {
      x: x + 0.2, y: y + 1.55, w: w - 0.4, h: 1.78,
      fontSize: 11, color: C.textMid, align: "left", margin: 0,
    });
  });

  s.addNotes(
    "Trois problemes concrets : absence de site web, communication informelle avec les familles " +
    "et absence d'identite visuelle. Ces trois points definissent le perimetre du projet."
  );
}

// ════════════════════════════════════════════════════════════════════
// SLIDE 3 · LA SOLUTION
// ════════════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: C.white };

  s.addText("LA SOLUTION", {
    x: 0.6, y: 0.35, w: 9, h: 0.25,
    fontSize: 9, color: C.accentMid, bold: true, charSpacing: 3, align: "left", margin: 0,
  });
  s.addText("Une SPA professionnelle\npour le centre", {
    x: 0.6, y: 0.62, w: 4.6, h: 1.1,
    fontSize: 30, bold: true, color: C.textDark, align: "left", margin: 0, fontFace: "Calibri",
  });
  s.addText(
    "Refuerzo Elite est une Single Page Application qui offre au centre une presence numerique " +
    "professionnelle avec 5 pages publiques, des animations fluides, des images propres du centre " +
    "et un design en marque.",
    { x: 0.6, y: 1.85, w: 4.5, h: 1.1, fontSize: 12, color: C.textMid, align: "left", margin: 0 }
  );

  // Statistiques
  [
    { val: "5", label: "pages publiques" },
    { val: "6", label: "teintes de vert" },
    { val: "∞", label: "animations" },
  ].forEach((st, i) => {
    const x = 0.6 + i * 1.52;
    s.addText(st.val, {
      x, y: 3.2, w: 1.35, h: 0.6,
      fontSize: 38, bold: true, color: C.accent, align: "left", margin: 0, fontFace: "Calibri",
    });
    s.addText(st.label, {
      x, y: 3.82, w: 1.35, h: 0.3,
      fontSize: 9.5, color: C.textMid, align: "left", margin: 0,
    });
  });

  // Maquette navigateur (droite)
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x: 5.45, y: 0.38, w: 4.1, h: 4.88,
    fill: { color: "F8FFFE" }, line: { color: "D1FAE5", width: 1.5 },
    rectRadius: 0.14, shadow: makeShadow(),
  });
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x: 5.45, y: 0.38, w: 4.1, h: 0.4,
    fill: { color: "E8F5E9" }, line: { color: "D1FAE5", width: 0 }, rectRadius: 0.14,
  });
  ["F87171", "FBBF24", "34D399"].forEach((c, i) => {
    s.addShape(pres.shapes.OVAL, {
      x: 5.6 + i * 0.23, y: 0.5, w: 0.13, h: 0.13,
      fill: { color: c }, line: { color: c, width: 0 },
    });
  });
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x: 6.32, y: 0.49, w: 2.75, h: 0.2,
    fill: { color: C.white }, line: { color: "D1FAE5", width: 1 }, rectRadius: 0.04,
  });
  s.addText("refuerzoelite.com", {
    x: 6.32, y: 0.49, w: 2.75, h: 0.2,
    fontSize: 7, color: "9CA3AF", align: "center", valign: "middle", margin: 0,
  });

  // Pages dans le navigateur
  [
    { name: "Home",       desc: "Hero · Cards · Contact rapide", active: true },
    { name: "Le Centre",  desc: "Histoire · Installations · Equipe" },
    { name: "Services",   desc: "Programmes · Avantages" },
    { name: "Methode",    desc: "Timeline · Outils pedagogiques" },
    { name: "Contact",    desc: "Canaux · WhatsApp · Email" },
  ].forEach((p, i) => {
    const py = 0.92 + i * 0.82;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: 5.6, y: py, w: 3.75, h: 0.68,
      fill: { color: p.active ? "F0FFF4" : C.white },
      line: { color: p.active ? C.accent : "E5E7EB", width: p.active ? 1.5 : 1 },
      rectRadius: 0.07,
    });
    s.addText(p.name, {
      x: 5.78, y: py + 0.08, w: 2, h: 0.26,
      fontSize: 11, bold: true, color: C.textDark, align: "left", margin: 0,
    });
    s.addText(p.desc, {
      x: 5.78, y: py + 0.37, w: 3, h: 0.2,
      fontSize: 8.5, color: C.textMuted, align: "left", margin: 0,
    });
    if (p.active) {
      s.addShape(pres.shapes.OVAL, {
        x: 9.15, y: py + 0.24, w: 0.13, h: 0.13,
        fill: { color: C.accent }, line: { color: C.accent, width: 0 },
      });
    }
  });

  s.addNotes(
    "La solution est une SPA complete avec React 19 et React Router v7. " +
    "5 routes publiques : Home, Le Centre, Services, Methode et Contact. " +
    "Chaque page a son propre hero, ses sections de contenu et ses animations."
  );
}

// ════════════════════════════════════════════════════════════════════
// SLIDE 4 · STACK TECHNIQUE
// ════════════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: C.darkBg };

  s.addText("ARCHITECTURE", {
    x: 0.6, y: 0.35, w: 9, h: 0.25,
    fontSize: 9, color: C.accent, bold: true, charSpacing: 3, align: "left", margin: 0,
  });
  s.addText("Stack Technique", {
    x: 0.6, y: 0.62, w: 8.8, h: 0.65,
    fontSize: 34, bold: true, color: C.white, align: "left", margin: 0, fontFace: "Calibri",
  });

  const techs = [
    { name: "Laravel 12",     role: "Backend",        desc: "API REST · Eloquent ORM · Migrations · Middlewares",               dot: "FF2D20" },
    { name: "React 19",       role: "Frontend SPA",   desc: "React Router v7 · Hooks · Composants reutilisables",               dot: "61DAFB" },
    { name: "Docker Compose", role: "Infrastructure",  desc: "nginx:8080 · PHP-FPM · MySQL — environnement reproductible en 1 cmd", dot: "2496ED" },
    { name: "Vite 8",         role: "Build System",   desc: "HMR en dev · bundle optimise · proxy dev server en prod",          dot: "BD34FE" },
    { name: "MySQL 8",        role: "Base de donnees", desc: "Relationnelle · migrations Laravel · seeds de test",               dot: "4479A1" },
  ];

  // Rangee 1 : 3 cartes
  techs.slice(0, 3).forEach((t, i) => {
    const x = 0.5 + i * 3.07; const w = 2.88; const y = 1.55;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x, y, w, h: 1.72,
      fill: { color: "071812" }, line: { color: "1A3A26", width: 1 }, rectRadius: 0.1,
    });
    s.addShape(pres.shapes.OVAL, {
      x: x + 0.22, y: y + 0.28, w: 0.22, h: 0.22,
      fill: { color: t.dot }, line: { color: t.dot, width: 0 },
    });
    s.addText(t.name, {
      x: x + 0.55, y: y + 0.16, w: 2.1, h: 0.32,
      fontSize: 13, bold: true, color: C.white, align: "left", margin: 0,
    });
    s.addText(t.role, {
      x: x + 0.55, y: y + 0.5, w: 2.1, h: 0.22,
      fontSize: 8.5, color: C.accent, bold: true, align: "left", margin: 0,
    });
    s.addText(t.desc, {
      x: x + 0.22, y: y + 0.88, w: w - 0.4, h: 0.72,
      fontSize: 9.5, color: "6B7280", align: "left", margin: 0,
    });
  });

  // Rangee 2 : 2 cartes centrees
  techs.slice(3).forEach((t, i) => {
    const x = 1.75 + i * 4.7; const w = 4.2; const y = 3.55;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x, y, w, h: 1.72,
      fill: { color: "071812" }, line: { color: "1A3A26", width: 1 }, rectRadius: 0.1,
    });
    s.addShape(pres.shapes.OVAL, {
      x: x + 0.22, y: y + 0.28, w: 0.22, h: 0.22,
      fill: { color: t.dot }, line: { color: t.dot, width: 0 },
    });
    s.addText(t.name, {
      x: x + 0.55, y: y + 0.16, w: 3, h: 0.32,
      fontSize: 13, bold: true, color: C.white, align: "left", margin: 0,
    });
    s.addText(t.role, {
      x: x + 0.55, y: y + 0.5, w: 3, h: 0.22,
      fontSize: 8.5, color: C.accent, bold: true, align: "left", margin: 0,
    });
    s.addText(t.desc, {
      x: x + 0.22, y: y + 0.88, w: w - 0.4, h: 0.72,
      fontSize: 9.5, color: "6B7280", align: "left", margin: 0,
    });
  });

  s.addNotes(
    "Stack complet : Laravel 12 comme backend API, React 19 comme SPA, " +
    "Docker Compose pour reproduire l'environnement en une seule commande, " +
    "Vite comme build tool avec HMR, et MySQL 8 comme base de donnees."
  );
}

// ════════════════════════════════════════════════════════════════════
// SLIDE 5 · DESIGN & UX
// ════════════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: C.lightBg };

  s.addText("FRONTEND & UX", {
    x: 0.6, y: 0.35, w: 9, h: 0.25,
    fontSize: 9, color: C.accentMid, bold: true, charSpacing: 3, align: "left", margin: 0,
  });
  s.addText("Design centre sur l'experience", {
    x: 0.6, y: 0.62, w: 8.8, h: 0.68,
    fontSize: 30, bold: true, color: C.textDark, align: "left", margin: 0, fontFace: "Calibri",
  });

  const features = [
    {
      icon: "◉",
      title: "Palette chromatique de marque",
      items: [
        "6 teintes de vert fonce (--g0 a --g5)",
        "Vert vif #22c55e comme accent principal",
        "Dark mode natif — fond #030805",
      ],
    },
    {
      icon: "◈",
      title: "Animations fluides",
      items: [
        "IntersectionObserver pour scroll-reveal sur chaque section",
        "Nav pill glissant avec cubic-bezier bounce",
        "keyframes : fadeUp, glowPulse, borderShimmer",
      ],
    },
    {
      icon: "◇",
      title: "Images propres du centre",
      items: [
        "Photos reelles des eleves et espaces du centre",
        "Cards de 420px de hauteur avec object-fit: cover",
        "Heroes de page avec overlay gradient sombre",
      ],
    },
  ];

  features.forEach((f, i) => {
    const x = 0.55 + i * 3.05; const w = 2.85;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x, y: 1.55, w, h: 3.65,
      fill: { color: C.white }, line: { color: "D1FAE5", width: 1 },
      rectRadius: 0.1, shadow: makeShadow(),
    });
    s.addText(f.icon, {
      x: x + 0.2, y: 1.75, w: 0.5, h: 0.46,
      fontSize: 22, color: C.accent, align: "left", margin: 0,
    });
    s.addText(f.title, {
      x: x + 0.2, y: 2.3, w: w - 0.4, h: 0.58,
      fontSize: 12.5, bold: true, color: C.textDark, align: "left", margin: 0,
    });
    s.addText(
      f.items.map((it, idx) => ({
        text: it,
        options: { bullet: true, breakLine: idx < f.items.length - 1, fontSize: 10.5, color: C.textMid },
      })),
      { x: x + 0.2, y: 2.98, w: w - 0.4, h: 2.0, align: "left", margin: 0 }
    );
  });

  s.addNotes(
    "Cote frontend : palette de 6 teintes de vert generee avec des variables CSS, " +
    "IntersectionObserver pour les effets scroll-reveal, nav pill glissant " +
    "et photographies du centre avec hauteur fixe et object-fit cover."
  );
}

// ════════════════════════════════════════════════════════════════════
// SLIDE 6 · DEMO EN DIRECT
// ════════════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: C.darkBg };

  s.addImage({ path: `${BRAND}/bg-services.jpg`, x: 0, y: 0, w: 10, h: 5.625, transparency: 78 });
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 0, w: 10, h: 5.625,
    fill: { color: C.darkBg, transparency: 18 }, line: { color: C.darkBg, width: 0 },
  });

  // Cercle vert lecture
  s.addShape(pres.shapes.OVAL, {
    x: 4.58, y: 0.55, w: 0.85, h: 0.85,
    fill: { color: C.accent }, line: { color: C.accent, width: 0 },
  });
  s.addText("▶", {
    x: 4.58, y: 0.55, w: 0.85, h: 0.85,
    fontSize: 22, color: C.darkBg, align: "center", valign: "middle", margin: 0,
  });

  s.addText("DEMO EN DIRECT", {
    x: 1, y: 1.58, w: 8, h: 1.1,
    fontSize: 58, bold: true, color: C.white,
    align: "center", margin: 0, fontFace: "Calibri", charSpacing: 5,
  });
  s.addText("Parcours complet de l'application :", {
    x: 1.5, y: 2.78, w: 7, h: 0.42,
    fontSize: 14, color: C.mint, align: "center", margin: 0,
  });
  s.addText("Home  →  Le Centre  →  Services  →  Methode  →  Contact", {
    x: 0.8, y: 3.3, w: 8.4, h: 0.42,
    fontSize: 13, color: C.accent, bold: true, align: "center", margin: 0,
  });

  s.addNotes(
    "PAUSE. Passer au navigateur avec l'app sur localhost:5173. " +
    "Parcourir : Home (hero anime + scroll-reveal des 3 cards) -> " +
    "Le Centre -> Services -> Methode (card avec Rubik's cube) -> Contact (SVG anime). " +
    "Mettre en valeur le nav pill glissant lors du changement de page."
  );
}

// ════════════════════════════════════════════════════════════════════
// SLIDE 7 · ET ENSUITE ?
// ════════════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: C.white };

  s.addText("ROADMAP", {
    x: 0.6, y: 0.35, w: 9, h: 0.25,
    fontSize: 9, color: C.accentMid, bold: true, charSpacing: 3, align: "left", margin: 0,
  });
  s.addText("Et ensuite ?", {
    x: 0.6, y: 0.62, w: 8.8, h: 0.65,
    fontSize: 34, bold: true, color: C.textDark, align: "left", margin: 0, fontFace: "Calibri",
  });

  const next = [
    {
      n: "01",
      title: "Panneau d'administration",
      text: "Tableau de bord pour gerer le contenu du site sans toucher au code. Routes protegees par authentification.",
    },
    {
      n: "02",
      title: "Gestion des inscriptions",
      text: "Module d'inscription en ligne avec suivi de l'etat de l'eleve et historique des seances.",
    },
    {
      n: "03",
      title: "Portail des familles",
      text: "Acces prive pour que les parents consultent les progres, les notes et les observations de l'eleve.",
    },
    {
      n: "04",
      title: "Module de communication",
      text: "Messagerie interne et notifications entre le centre et les familles, integree avec l'API WhatsApp.",
    },
  ];

  next.forEach((item, i) => {
    const col = i % 2; const row = Math.floor(i / 2);
    const x = 0.55 + col * 4.75; const y = 1.55 + row * 1.92;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x, y, w: 4.35, h: 1.72,
      fill: { color: row === 0 && col === 0 ? "F0FFF4" : C.white },
      line: { color: "D1FAE5", width: 1 }, rectRadius: 0.1, shadow: makeShadow(),
    });
    s.addText(item.n, {
      x: x + 0.22, y: y + 0.16, w: 0.5, h: 0.42,
      fontSize: 20, bold: true, color: C.accent, align: "left", margin: 0, fontFace: "Calibri",
    });
    s.addText(item.title, {
      x: x + 0.22, y: y + 0.6, w: 3.9, h: 0.38,
      fontSize: 13, bold: true, color: C.textDark, align: "left", margin: 0,
    });
    s.addText(item.text, {
      x: x + 0.22, y: y + 1.02, w: 3.9, h: 0.6,
      fontSize: 10, color: C.textMid, align: "left", margin: 0,
    });
  });

  s.addNotes(
    "Le projet actuel est la base du produit. " +
    "Panneau admin, module d'inscriptions, portail des familles et communications — " +
    "ce sont les 4 phases naturelles d'expansion deja identifiees."
  );
}

// ════════════════════════════════════════════════════════════════════
// SLIDE 8 · CLOTURE
// ════════════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: C.darkBg };

  s.addImage({ path: `${BRAND}/bg-centre.jpg`, x: 0, y: 0, w: 10, h: 5.625, transparency: 88 });
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 0, w: 10, h: 5.625,
    fill: { color: C.darkBg, transparency: 14 }, line: { color: C.darkBg, width: 0 },
  });

  // Logo
  s.addShape(pres.shapes.OVAL, {
    x: 4.37, y: 0.68, w: 1.25, h: 1.25,
    fill: { color: C.accent }, line: { color: C.accent, width: 0 },
  });
  s.addText("RE", {
    x: 4.37, y: 0.68, w: 1.25, h: 1.25,
    fontSize: 34, bold: true, color: C.darkBg,
    align: "center", valign: "middle", margin: 0, fontFace: "Calibri",
  });

  s.addText("Refuerzo Elite", {
    x: 1.5, y: 2.1, w: 7, h: 0.82,
    fontSize: 42, bold: true, color: C.white, align: "center", margin: 0, fontFace: "Calibri",
  });
  s.addText("Merci pour votre attention", {
    x: 1.5, y: 3.0, w: 7, h: 0.42,
    fontSize: 16, color: C.mint, align: "center", margin: 0,
  });

  // Separateur
  s.addShape(pres.shapes.RECTANGLE, {
    x: 3.8, y: 3.62, w: 2.4, h: 0.02,
    fill: { color: C.accentDeep }, line: { color: C.accentDeep, width: 0 },
  });

  // Coordonnees
  s.addText([
    { text: "refuerzoelite@gmail.com",                          options: { breakLine: true } },
    { text: "+240 222 862 579",                                  options: { breakLine: true } },
    { text: "B/ Sumco (Ela-Nguema) · Malabo, Guinee Equatoriale" },
  ], {
    x: 1.5, y: 3.8, w: 7, h: 1.0,
    fontSize: 11, color: "6B7280", align: "center", margin: 0,
  });

  s.addNotes(
    "Cloture. Disponibles pour les questions du jury. " +
    "Rappeler que la demo reste disponible pour approfondir tout aspect technique."
  );
}

// ── Generation du fichier ─────────────────────────────────────────
const OUT = "refuerzo-elite-presentacion-fr.pptx";
pres.writeFile({ fileName: OUT })
  .then(() => console.log(`Genere : ${OUT}`))
  .catch(err => { console.error("Erreur :", err); process.exit(1); });
