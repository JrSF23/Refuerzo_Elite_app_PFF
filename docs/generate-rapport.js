const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, HeadingLevel, BorderStyle, WidthType,
  ShadingType, PageNumber, PageBreak, LevelFormat, TableOfContents,
  ExternalHyperlink, VerticalAlign
} = require('docx');
const fs = require('fs');

// ── Palette verte OFPPT ───────────────────────────────────────────────────────
const GREEN_DARK   = '1A5C38';   // vert foncé titres
const GREEN_MID    = '27AE60';   // vert moyen accents
const GREEN_LIGHT  = 'D5F5E3';   // fond vert pâle
const GREEN_STRIPE = '196F3D';   // bande décorative
const GRAY_TEXT    = '444444';
const BORDER_G     = 'A9DFBF';

// ── Helpers ───────────────────────────────────────────────────────────────────
const brd = (color = BORDER_G) => ({ style: BorderStyle.SINGLE, size: 1, color });
const allBorders = (c = BORDER_G) => ({ top: brd(c), bottom: brd(c), left: brd(c), right: brd(c) });
const cm = { top: 100, bottom: 100, left: 150, right: 150 };

const h1 = (text) => new Paragraph({
  heading: HeadingLevel.HEADING_1,
  pageBreakBefore: true,
  children: [new TextRun({ text, bold: true, size: 36, color: GREEN_DARK, font: 'Arial' })],
  spacing: { before: 240, after: 200 },
  border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: GREEN_MID } },
});

const h2 = (text) => new Paragraph({
  heading: HeadingLevel.HEADING_2,
  children: [new TextRun({ text, bold: true, size: 28, color: GREEN_STRIPE, font: 'Arial' })],
  spacing: { before: 200, after: 120 },
});

const h3 = (text) => new Paragraph({
  heading: HeadingLevel.HEADING_3,
  children: [new TextRun({ text, bold: true, size: 24, color: GRAY_TEXT, font: 'Arial' })],
  spacing: { before: 160, after: 80 },
});

const p = (text, opts = {}) => new Paragraph({
  children: [new TextRun({ text, size: 22, font: 'Arial', color: GRAY_TEXT, ...opts })],
  spacing: { before: 60, after: 100 },
  alignment: opts.justify ? AlignmentType.JUSTIFIED : AlignmentType.LEFT,
});

const pj = (text) => p(text, { justify: true });
const empty = () => new Paragraph({ children: [], spacing: { before: 60, after: 60 } });

const bullet = (text, level = 0) => new Paragraph({
  numbering: { reference: 'bullets', level },
  children: [new TextRun({ text, size: 22, font: 'Arial', color: GRAY_TEXT })],
  spacing: { before: 40, after: 40 },
});

const codeBlock = (text) => new Paragraph({
  children: [new TextRun({ text, font: 'Courier New', size: 18, color: '2C3E50' })],
  spacing: { before: 40, after: 40 },
  indent: { left: 720 },
  shading: { fill: 'F2F9F4', type: ShadingType.CLEAR },
  border: { left: { style: BorderStyle.SINGLE, size: 12, color: GREEN_MID } },
});

function headerRow(cells, widths) {
  return new TableRow({
    tableHeader: true,
    children: cells.map((text, i) => new TableCell({
      borders: allBorders(GREEN_MID),
      width: { size: widths[i], type: WidthType.DXA },
      margins: cm,
      shading: { fill: GREEN_DARK, type: ShadingType.CLEAR },
      children: [new Paragraph({
        children: [new TextRun({ text, bold: true, size: 20, font: 'Arial', color: 'FFFFFF' })],
        alignment: AlignmentType.CENTER,
      })],
    })),
  });
}

function dataRow(cells, widths, shade = false) {
  return new TableRow({
    children: cells.map((text, i) => new TableCell({
      borders: allBorders(),
      width: { size: widths[i], type: WidthType.DXA },
      margins: cm,
      shading: { fill: shade ? GREEN_LIGHT : 'FFFFFF', type: ShadingType.CLEAR },
      children: [new Paragraph({
        children: [new TextRun({ text: text || '', size: 20, font: 'Arial', color: GRAY_TEXT })],
      })],
    })),
  });
}

function tbl(headers, rows, widths) {
  const total = widths.reduce((a, b) => a + b, 0);
  return new Table({
    width: { size: total, type: WidthType.DXA },
    columnWidths: widths,
    rows: [headerRow(headers, widths), ...rows.map((r, i) => dataRow(r, widths, i % 2 === 1))],
  });
}

// ── PAGE DE COUVERTURE ────────────────────────────────────────────────────────
// Bande verte décorative via shading sur des cellules d'un tableau 1 colonne
function coverBand(text, size, bg, fg, bold = true) {
  return new Table({
    width: { size: 9386, type: WidthType.DXA },
    columnWidths: [9386],
    rows: [new TableRow({
      children: [new TableCell({
        borders: { top: brd('FFFFFF'), bottom: brd('FFFFFF'), left: brd('FFFFFF'), right: brd('FFFFFF') },
        width: { size: 9386, type: WidthType.DXA },
        margins: { top: 140, bottom: 140, left: 200, right: 200 },
        shading: { fill: bg, type: ShadingType.CLEAR },
        children: [new Paragraph({
          children: [new TextRun({ text, size, font: 'Arial', color: fg, bold })],
          alignment: AlignmentType.CENTER,
        })],
        verticalAlign: VerticalAlign.CENTER,
      })],
    })],
  });
}

function coverLine(text, size = 22, bold = false, color = GRAY_TEXT, align = AlignmentType.CENTER) {
  return new Paragraph({
    children: [new TextRun({ text, size, font: 'Arial', bold, color })],
    alignment: align,
    spacing: { before: 80, after: 80 },
  });
}

const coverPage = [
  // ── En-tête OFPPT ──────────────────────────────────────────────────────────
  new Table({
    width: { size: 9386, type: WidthType.DXA },
    columnWidths: [4200, 5186],
    rows: [new TableRow({
      children: [
        new TableCell({
          borders: { top: brd('FFFFFF'), bottom: brd(GREEN_MID), left: brd('FFFFFF'), right: brd('FFFFFF') },
          width: { size: 4200, type: WidthType.DXA },
          margins: cm,
          children: [
            new Paragraph({ children: [new TextRun({ text: 'OFPPT', size: 32, bold: true, font: 'Arial', color: GREEN_DARK })], alignment: AlignmentType.LEFT }),
            new Paragraph({ children: [new TextRun({ text: 'Office de la Formation Professionnelle', size: 16, font: 'Arial', color: GRAY_TEXT })], alignment: AlignmentType.LEFT }),
            new Paragraph({ children: [new TextRun({ text: 'et de la Promotion du Travail', size: 16, font: 'Arial', color: GRAY_TEXT })], alignment: AlignmentType.LEFT }),
          ],
        }),
        new TableCell({
          borders: { top: brd('FFFFFF'), bottom: brd(GREEN_MID), left: brd('FFFFFF'), right: brd('FFFFFF') },
          width: { size: 5186, type: WidthType.DXA },
          margins: cm,
          children: [
            new Paragraph({ children: [new TextRun({ text: 'Institut Spécialisé de Technologies Appliquées', size: 18, font: 'Arial', color: GREEN_DARK, bold: true })], alignment: AlignmentType.RIGHT }),
            new Paragraph({ children: [new TextRun({ text: 'Sala Al Jadida', size: 20, font: 'Arial', color: GREEN_STRIPE, bold: true })], alignment: AlignmentType.RIGHT }),
          ],
        }),
      ],
    })],
  }),

  empty(), empty(), empty(),

  // ── Bande titre principale ─────────────────────────────────────────────────
  coverBand('RAPPORT DE PROJET DE FIN DE FORMATION', 40, GREEN_DARK, 'FFFFFF', true),
  new Paragraph({ children: [], spacing: { before: 0, after: 0 } }),
  coverBand('', 8, GREEN_MID, GREEN_MID, false),

  empty(), empty(),

  // ── Sous-titre projet ──────────────────────────────────────────────────────
  new Table({
    width: { size: 9386, type: WidthType.DXA },
    columnWidths: [9386],
    rows: [new TableRow({
      children: [new TableCell({
        borders: { top: brd(GREEN_MID), bottom: brd(GREEN_MID), left: { style: BorderStyle.SINGLE, size: 24, color: GREEN_MID }, right: brd('FFFFFF') },
        width: { size: 9386, type: WidthType.DXA },
        margins: { top: 200, bottom: 200, left: 300, right: 300 },
        shading: { fill: GREEN_LIGHT, type: ShadingType.CLEAR },
        children: [
          new Paragraph({ children: [new TextRun({ text: 'Refuerzo Elite V2', size: 48, bold: true, font: 'Arial', color: GREEN_DARK })], alignment: AlignmentType.CENTER }),
          new Paragraph({ children: [new TextRun({ text: 'Application web de gestion d\'un centre de soutien scolaire', size: 24, font: 'Arial', color: GREEN_STRIPE })], alignment: AlignmentType.CENTER, spacing: { before: 80, after: 0 } }),
        ],
      })],
    })],
  }),

  empty(), empty(), empty(),

  // ── Informations projet ────────────────────────────────────────────────────
  new Table({
    width: { size: 9386, type: WidthType.DXA },
    columnWidths: [2500, 6886],
    rows: [
      new TableRow({ children: [
        new TableCell({ borders: allBorders(GREEN_MID), width: { size: 2500, type: WidthType.DXA }, margins: cm, shading: { fill: GREEN_DARK, type: ShadingType.CLEAR },
          children: [new Paragraph({ children: [new TextRun({ text: 'Projet', bold: true, size: 20, font: 'Arial', color: 'FFFFFF' })], alignment: AlignmentType.CENTER })] }),
        new TableCell({ borders: allBorders(GREEN_MID), width: { size: 6886, type: WidthType.DXA }, margins: cm,
          children: [new Paragraph({ children: [new TextRun({ text: 'Application web fullstack — React 19 + Laravel 12 + MySQL + Docker', size: 20, font: 'Arial', color: GRAY_TEXT })] })] }),
      ]}),
      new TableRow({ children: [
        new TableCell({ borders: allBorders(GREEN_MID), width: { size: 2500, type: WidthType.DXA }, margins: cm, shading: { fill: GREEN_LIGHT, type: ShadingType.CLEAR },
          children: [new Paragraph({ children: [new TextRun({ text: 'Technologies', bold: true, size: 20, font: 'Arial', color: GREEN_DARK })], alignment: AlignmentType.CENTER })] }),
        new TableCell({ borders: allBorders(GREEN_MID), width: { size: 6886, type: WidthType.DXA }, margins: cm, shading: { fill: GREEN_LIGHT, type: ShadingType.CLEAR },
          children: [new Paragraph({ children: [new TextRun({ text: 'React 19, Vite, React Router v7, Laravel 12, PHP 8.2, Sanctum, Spatie Permission, MySQL 8.0, Nginx, Docker Compose', size: 20, font: 'Arial', color: GRAY_TEXT })] })] }),
      ]}),
      new TableRow({ children: [
        new TableCell({ borders: allBorders(GREEN_MID), width: { size: 2500, type: WidthType.DXA }, margins: cm, shading: { fill: GREEN_DARK, type: ShadingType.CLEAR },
          children: [new Paragraph({ children: [new TextRun({ text: 'Année', bold: true, size: 20, font: 'Arial', color: 'FFFFFF' })], alignment: AlignmentType.CENTER })] }),
        new TableCell({ borders: allBorders(GREEN_MID), width: { size: 6886, type: WidthType.DXA }, margins: cm,
          children: [new Paragraph({ children: [new TextRun({ text: '2025 — 2026', size: 20, font: 'Arial', color: GRAY_TEXT })] })] }),
      ]}),
    ],
  }),

  empty(), empty(), empty(), empty(),

  // ── Réalisé par / Encadré par ──────────────────────────────────────────────
  new Table({
    width: { size: 9386, type: WidthType.DXA },
    columnWidths: [4600, 4786],
    rows: [new TableRow({
      children: [
        new TableCell({
          borders: { top: brd(GREEN_MID), bottom: brd(GREEN_MID), left: brd(GREEN_MID), right: brd(GREEN_LIGHT) },
          width: { size: 4600, type: WidthType.DXA },
          margins: { top: 160, bottom: 160, left: 250, right: 250 },
          shading: { fill: GREEN_LIGHT, type: ShadingType.CLEAR },
          children: [
            new Paragraph({ children: [new TextRun({ text: 'RÉALISÉ PAR :', bold: true, size: 22, font: 'Arial', color: GREEN_DARK })], spacing: { before: 0, after: 80 } }),
            new Paragraph({ children: [new TextRun({ text: 'M. Salvador Filiberto Nsue Ekang', size: 22, font: 'Arial', color: GRAY_TEXT })], spacing: { before: 0, after: 60 } }),
            new Paragraph({ children: [new TextRun({ text: 'M. Martin Endje Mecheba Rondo', size: 22, font: 'Arial', color: GRAY_TEXT })], spacing: { before: 0, after: 0 } }),
          ],
        }),
        new TableCell({
          borders: { top: brd(GREEN_MID), bottom: brd(GREEN_MID), left: brd(GREEN_LIGHT), right: brd(GREEN_MID) },
          width: { size: 4786, type: WidthType.DXA },
          margins: { top: 160, bottom: 160, left: 250, right: 250 },
          shading: { fill: GREEN_LIGHT, type: ShadingType.CLEAR },
          children: [
            new Paragraph({ children: [new TextRun({ text: 'ENCADRÉ PAR :', bold: true, size: 22, font: 'Arial', color: GREEN_DARK })], spacing: { before: 0, after: 80 } }),
            new Paragraph({ children: [new TextRun({ text: 'Mme El Kholti Kamar', size: 22, font: 'Arial', color: GRAY_TEXT })], spacing: { before: 0, after: 0 } }),
          ],
        }),
      ],
    })],
  }),

  empty(), empty(),

  // ── Année de formation ─────────────────────────────────────────────────────
  coverBand('ANNÉE DE FORMATION : 2025 — 2026', 24, GREEN_DARK, 'FFFFFF', true),

  new Paragraph({ children: [new PageBreak()] }),
];

// ── DOCUMENT COMPLET ──────────────────────────────────────────────────────────
const doc = new Document({
  numbering: {
    config: [{
      reference: 'bullets',
      levels: [
        { level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } } },
        { level: 1, format: LevelFormat.BULLET, text: '◦', alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 1080, hanging: 360 } } } },
      ],
    }],
  },
  styles: {
    default: { document: { run: { font: 'Arial', size: 22 } } },
    paragraphStyles: [
      { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 36, bold: true, font: 'Arial', color: GREEN_DARK },
        paragraph: { spacing: { before: 240, after: 200 }, outlineLevel: 0 } },
      { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 28, bold: true, font: 'Arial', color: GREEN_STRIPE },
        paragraph: { spacing: { before: 200, after: 120 }, outlineLevel: 1 } },
      { id: 'Heading3', name: 'Heading 3', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 24, bold: true, font: 'Arial', color: GRAY_TEXT },
        paragraph: { spacing: { before: 160, after: 80 }, outlineLevel: 2 } },
    ],
  },
  sections: [
    // ── Section 1 : page de couverture (sans header/footer) ──────────────────
    {
      properties: {
        page: {
          size: { width: 11906, height: 16838 },
          margin: { top: 1080, right: 1260, bottom: 1080, left: 1260 },
        },
      },
      children: coverPage,
    },
    // ── Section 2 : corps du rapport ─────────────────────────────────────────
    {
      properties: {
        page: {
          size: { width: 11906, height: 16838 },
          margin: { top: 1440, right: 1260, bottom: 1440, left: 1260 },
        },
      },
      headers: {
        default: new Header({
          children: [new Paragraph({
            children: [
              new TextRun({ text: 'Refuerzo Elite V2  —  Rapport de Projet Fin de Formation  |  OFPPT · ISTA Sala Al Jadida', size: 16, color: '888888', font: 'Arial' }),
            ],
            alignment: AlignmentType.RIGHT,
            border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: GREEN_MID } },
            spacing: { after: 100 },
          })],
        }),
      },
      footers: {
        default: new Footer({
          children: [new Paragraph({
            children: [
              new TextRun({ text: 'Page ', size: 18, font: 'Arial', color: '888888' }),
              new TextRun({ children: [PageNumber.CURRENT], size: 18, font: 'Arial', color: GREEN_DARK }),
              new TextRun({ text: ' / ', size: 18, font: 'Arial', color: '888888' }),
              new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 18, font: 'Arial', color: GREEN_DARK }),
              new TextRun({ text: '   |   Année de formation 2025 — 2026', size: 16, font: 'Arial', color: '888888' }),
            ],
            alignment: AlignmentType.CENTER,
            border: { top: { style: BorderStyle.SINGLE, size: 4, color: GREEN_MID } },
            spacing: { before: 100 },
          })],
        }),
      },
      children: [
        // ── TABLE DES MATIÈRES ──────────────────────────────────────────────
        new Paragraph({
          children: [new TextRun({ text: 'Table des matières', bold: true, size: 36, font: 'Arial', color: GREEN_DARK })],
          alignment: AlignmentType.CENTER,
          spacing: { before: 0, after: 300 },
        }),
        new TableOfContents('Table des matières', { hyperlink: true, headingStyleRange: '1-3' }),
        new Paragraph({ children: [new PageBreak()] }),

        // ── 1. INTRODUCTION ────────────────────────────────────────────────
        h1('1. Introduction'),
        pj('Ce document constitue le rapport de projet de fin de formation relatif au développement de Refuerzo Elite V2, une application web de gestion pour un centre de soutien scolaire. Il présente le contexte du projet, les besoins identifiés dans le cahier des charges, les choix techniques effectués, le détail de l\'implémentation réalisée, les tests automatisés, la conteneurisation Docker ainsi qu\'un bilan global du travail accompli.'),
        pj('Le projet a été conçu comme une application fullstack moderne : une API REST développée avec Laravel 12 côté serveur, et une interface utilisateur en React 19 côté client. L\'ensemble est conteneurisé avec Docker pour garantir la reproductibilité du déploiement dans n\'importe quel environnement.'),

        // ── 2. CONTEXTE ET OBJECTIFS ───────────────────────────────────────
        h1('2. Contexte et objectifs'),
        h2('2.1 Contexte'),
        pj('Refuerzo Elite est un centre de soutien scolaire privé qui propose des cours de renforcement en mathématiques, langue espagnole et anglais pour des élèves du primaire, du secondaire et du baccalauréat. Avant ce projet, la gestion était assurée manuellement : présences sur cahier papier, tableurs pour les paiements, communications téléphoniques avec les tuteurs.'),
        pj('Ce projet est la version modernisée d\'une première application de gestion développée avec HTML, CSS, JavaScript, PHP et MySQL. Cette version V2 vise à refondre l\'architecture en séparant clairement le frontend du backend, à améliorer l\'ergonomie, la sécurité et la maintenabilité du système.'),
        h2('2.2 Objectifs'),
        bullet('Centraliser la gestion des élèves, tuteurs, professeurs, groupes, séances et paiements.'),
        bullet('Fournir deux interfaces adaptées aux rôles : administration et professeur.'),
        bullet('Sécuriser l\'accès aux données par authentification à token et contrôle de rôles.'),
        bullet('Permettre un déploiement simple et reproductible via Docker.'),
        bullet('Livrer un code testé, structuré et documenté.'),

        // ── 3. CAHIER DES CHARGES ──────────────────────────────────────────
        h1('3. Cahier des charges'),
        h2('3.1 Besoins fonctionnels'),
        h3('Authentification et sécurité'),
        bullet('Connexion par identifiant (username ou email) et mot de passe.'),
        bullet('Gestion des rôles et permissions par profil utilisateur.'),
        bullet('Protection des routes privées selon le rôle.'),
        h3('Gestion pédagogique'),
        bullet('CRUD complet pour les élèves, tuteurs, professeurs, matières, groupes de classe.'),
        bullet('Inscription des élèves aux groupes avec statut et tarif individuel.'),
        bullet('Planification des séances avec date, heure, salle.'),
        bullet('Saisie et consultation des présences par séance et par élève.'),
        h3('Gestion financière'),
        bullet('Enregistrement des paiements mensuels avec méthode et statut.'),
        bullet('Validation que l\'inscription indiquée appartient à l\'élève concerné.'),
        bullet('Visualisation des paiements par élève ou par tuteur.'),
        h3('Tableaux de bord'),
        bullet('Vue administrateur : métriques globales, dernières opérations.'),
        bullet('Vue professeur : ses groupes, ses prochaines séances, suivi de présence.'),
        h2('3.2 Exigences fonctionnelles (extrait du cahier des charges)'),
        empty(),
        tbl(
          ['Réf.', 'Exigence', 'Priorité', 'Statut'],
          [
            ['RF-01', 'Authentification des utilisateurs autorisés', 'Haute', 'Réalisé'],
            ['RF-02', 'Gestion des rôles et permissions par profil', 'Haute', 'Réalisé'],
            ['RF-03', 'CRUD complet des élèves', 'Haute', 'Réalisé'],
            ['RF-04', 'CRUD complet des tuteurs', 'Haute', 'Réalisé'],
            ['RF-05', 'CRUD complet des professeurs et matières', 'Haute', 'Réalisé'],
            ['RF-06', 'Inscriptions d\'un élève à plusieurs matières', 'Haute', 'Réalisé'],
            ['RF-07', 'Enregistrement de l\'assiduité par séance et par élève', 'Haute', 'Réalisé'],
            ['RF-08', 'Enregistrement des paiements mensuels', 'Haute', 'Réalisé'],
            ['RF-09', 'Tableau de bord avec métriques et statistiques', 'Haute', 'Réalisé'],
            ['RF-10', 'Interface adaptée au rôle professeur', 'Haute', 'Réalisé'],
          ],
          [1200, 4800, 1400, 1626]
        ),
        empty(),
        h2('3.3 Besoins non fonctionnels'),
        bullet('Réactivité : interface SPA sans rechargement de page.'),
        bullet('Sécurité : tokens Sanctum, contrôle de rôles, rate limiting, en-têtes HTTP sécurisés.'),
        bullet('Performance : index de base de données sur les colonnes fréquemment filtrées.'),
        bullet('Portabilité : déploiement via Docker, indépendant de l\'environnement local.'),
        bullet('Maintenabilité : code testé, structuré et documenté.'),

        // ── 4. ARCHITECTURE ────────────────────────────────────────────────
        h1('4. Architecture technique'),
        h2('4.1 Stack technologique'),
        empty(),
        tbl(
          ['Couche', 'Technologie', 'Version', 'Rôle'],
          [
            ['Base de données', 'MySQL', '8.0', 'Persistance transactionnelle'],
            ['Backend', 'Laravel', '12 (PHP 8.2)', 'API REST, logique métier, auth'],
            ['Auth', 'Laravel Sanctum', '4.x', 'Tokens Bearer stateless'],
            ['Rôles', 'Spatie Permission', '6.x', 'RBAC : admin, teacher'],
            ['Frontend', 'React', '19', 'SPA, interface utilisateur'],
            ['Router', 'React Router', 'v7', 'Navigation côté client'],
            ['HTTP client', 'Axios', 'latest', 'Appels à l\'API'],
            ['Build', 'Vite', '6.x', 'Compilation du frontend'],
            ['Serveur web', 'Nginx', '1.27', 'Reverse proxy + statiques'],
            ['Conteneurs', 'Docker Compose', 'v2', 'Orchestration des services'],
          ],
          [2200, 2200, 1500, 3126]
        ),
        empty(),
        h2('4.2 Architecture Docker'),
        pj('L\'application est décomposée en trois services Docker sur un réseau interne nommé app. Seul Nginx est exposé sur le port 8080 vers l\'extérieur.'),
        empty(),
        tbl(
          ['Service', 'Image', 'Rôle', 'Port'],
          [
            ['nginx', 'nginx:1.27-alpine', 'Sert le build React (/) et proxy /api vers PHP-FPM', '8080 → 80'],
            ['laravel', 'PHP 8.2-FPM custom', 'API Laravel, logique métier', 'Interne : 9000'],
            ['mysql', 'mysql:8.0', 'Base de données avec volume persistant', 'Interne uniquement'],
          ],
          [1500, 2500, 3500, 1526]
        ),
        empty(),
        h2('4.3 Séquence d\'une requête'),
        bullet('Le navigateur envoie une requête HTTP vers http://localhost:8080.'),
        bullet('Nginx reçoit la requête. Si le chemin commence par /api, il la transmet à PHP-FPM (port 9000). Sinon, il sert le fichier statique depuis /var/www/frontend/dist/.'),
        bullet('Laravel authentifie le token Sanctum, vérifie le rôle, exécute le contrôleur, retourne du JSON.'),
        bullet('React met à jour l\'interface via Axios sans rechargement de page.'),

        // ── 5. MODÈLE DE DONNÉES ───────────────────────────────────────────
        h1('5. Modèle de données'),
        h2('5.1 Tables métier'),
        empty(),
        tbl(
          ['Table', 'Description', 'Champs principaux'],
          [
            ['guardians', 'Tuteurs légaux', 'first_name, last_name, email, phone, relationship_label'],
            ['teachers', 'Professeurs', 'first_name, last_name, email, specialty, bio'],
            ['subjects', 'Matières', 'name, code (unique), level, monthly_fee'],
            ['students', 'Élèves', 'first_name, last_name, guardian_id, school_level, status'],
            ['class_groups', 'Groupes', 'subject_id, teacher_id, name, code, academic_year, capacity, status'],
            ['enrollments', 'Inscriptions', 'student_id, class_group_id, enrolled_at, monthly_fee, status'],
            ['class_sessions', 'Séances', 'class_group_id, title, session_date, starts_at, ends_at, room'],
            ['attendances', 'Présences', 'class_session_id, student_id, status (present/absent/late)'],
            ['payments', 'Paiements', 'student_id, enrollment_id, amount, period_label, payment_method, status'],
            ['audit_events', 'Journal', 'user_id, action, entity_type, entity_id, payload (JSON)'],
          ],
          [2000, 1800, 5226]
        ),
        empty(),
        h2('5.2 Suppression douce'),
        pj('Les tables students, guardians, teachers, class_groups, enrollments et payments utilisent la suppression douce (soft delete) de Laravel. Les enregistrements ne sont jamais physiquement supprimés. Un champ deleted_at les marque comme supprimés, préservant l\'historique des paiements et présences.'),
        h2('5.3 Index de performance'),
        pj('Une migration dédiée ajoute des index sur les colonnes les plus consultées : status (plusieurs tables), paid_at, session_date, academic_year, guardian_id, et les index composés (entity_type, entity_id) pour les audits.'),

        // ── 6. BACKEND ─────────────────────────────────────────────────────
        h1('6. Implémentation — Backend'),
        h2('6.1 Structure de l\'API REST'),
        empty(),
        tbl(
          ['Endpoint', 'Accès', 'Description'],
          [
            ['POST /api/v1/login', 'Public', 'Connexion par username ou email (throttle : 10/min)'],
            ['GET /api/v1/me', 'Authentifié', 'Profil de l\'utilisateur connecté'],
            ['POST /api/v1/logout', 'Authentifié', 'Invalidation du token courant'],
            ['GET /api/v1/dashboard', 'admin, teacher', 'Métriques adaptées au rôle'],
            ['CRUD /api/v1/students', 'admin (write) / teacher (read)', 'Gestion des élèves'],
            ['CRUD /api/v1/guardians', 'admin', 'Gestion des tuteurs légaux'],
            ['CRUD /api/v1/teachers', 'admin', 'Gestion des professeurs'],
            ['CRUD /api/v1/subjects', 'admin', 'Gestion des matières'],
            ['CRUD /api/v1/class-groups', 'admin (write) / teacher (read)', 'Groupes de classe'],
            ['CRUD /api/v1/class-sessions', 'admin, teacher', 'Séances planifiées'],
            ['CRUD /api/v1/attendances', 'admin, teacher', 'Présences'],
            ['CRUD /api/v1/enrollments', 'admin', 'Inscriptions'],
            ['CRUD /api/v1/payments', 'admin', 'Paiements'],
          ],
          [3200, 2200, 3626]
        ),
        empty(),
        h2('6.2 Validations'),
        pj('Tous les champs de type énuméré utilisent Rule::in() pour n\'accepter que les valeurs définies. De plus, lors de la création d\'un paiement, une règle de validation croisée vérifie que l\'inscription indiquée appartient bien à l\'élève du paiement.'),
        empty(),
        tbl(
          ['Champ', 'Valeurs autorisées'],
          [
            ['students.status / enrollments.status / class_groups.status', 'active, inactive'],
            ['attendances.status', 'present, absent, late'],
            ['payments.payment_method', 'cash, card, transfer'],
            ['payments.status', 'paid, pending, cancelled'],
          ],
          [4500, 4526]
        ),
        empty(),
        h2('6.3 Tableau de bord par rôle'),
        bullet('Admin : nombre total d\'élèves, professeurs, groupes, présences, paiements ; derniers élèves inscrits ; dernières séances et paiements.'),
        bullet('Professeur : ses groupes, ses prochaines séances, présences récentes de ses élèves, statistiques de sa classe. Le profil professeur est retrouvé par correspondance d\'email (sans FK directe entre users et teachers).'),

        // ── 7. FRONTEND ────────────────────────────────────────────────────
        h1('7. Implémentation — Frontend'),
        h2('7.1 Composants principaux'),
        empty(),
        tbl(
          ['Composant', 'Rôle'],
          [
            ['SessionContext.jsx', 'Gestion globale de l\'auth. Token en localStorage, vérification via /me au démarrage.'],
            ['AppShell.jsx', 'Barre latérale et topbar. Adapte le branding et les menus selon le rôle.'],
            ['DashboardPage.jsx', 'Affiche AdminDashboard ou TeacherDashboard selon data.role retourné par l\'API.'],
            ['ModulePage.jsx', 'Composant CRUD générique. Couvre les 9 modules à partir d\'une définition de champs.'],
            ['LoginPage.jsx', 'Formulaire de connexion avec gestion des erreurs API.'],
          ],
          [2800, 6226]
        ),
        empty(),
        h2('7.2 Corrections apportées'),
        bullet('isAuthenticated reste false pendant la vérification du token au démarrage (isBooting), évitant un flash d\'écran authentifié avant confirmation du serveur.'),
        bullet('Les champs optionnels vides sont envoyés comme null (et non omis) en mode édition, permettant d\'effacer une valeur existante en base.'),
        bullet('Les données auxiliaires des selects (listes de matières, professeurs) ne sont chargées que si l\'utilisateur peut créer ou modifier, évitant des erreurs 403 pour les rôles en lecture seule.'),

        // ── 8. SÉCURITÉ ────────────────────────────────────────────────────
        h1('8. Sécurité'),
        empty(),
        tbl(
          ['Mesure', 'Détail'],
          [
            ['Authentification par token', 'Sanctum génère un token opaque par connexion. Le logout le supprime physiquement en base.'],
            ['Contrôle de rôles', 'Middleware role.any sur chaque groupe de routes. Séparation stricte admin / teacher.'],
            ['Rate limiting', '10 req/min sur /login. 120 req/min sur les routes authentifiées.'],
            ['Validation stricte', 'Rule::in() sur tous les champs énumérés. Validation croisée enrollment-student dans les paiements.'],
            ['Suppression douce', 'Aucune suppression physique. L\'historique reste intact même après archivage.'],
            ['En-têtes HTTP', 'Nginx envoie X-Frame-Options, X-Content-Type-Options, Referrer-Policy.'],
            ['Fichiers cachés', 'Nginx bloque l\'accès aux fichiers commençant par un point (.env, .git, etc.).'],
            ['Secrets', '.env.docker dans .gitignore. Seul .env.docker.example (sans secrets) est versionné.'],
          ],
          [2600, 6426]
        ),
        empty(),

        // ── 9. TESTS ───────────────────────────────────────────────────────
        h1('9. Tests automatisés'),
        h2('9.1 Stratégie'),
        pj('Les tests sont des tests d\'intégration utilisant le trait RefreshDatabase de Laravel. Chaque test s\'exécute sur une base de données isolée. Les tests couvrent l\'authentification, le contrôle d\'accès, les validations et les opérations CRUD.'),
        empty(),
        tbl(
          ['Fichier', 'Tests', 'Périmètre'],
          [
            ['AuthTest.php', '10', 'Login, mauvais mot de passe, utilisateur inactif, rôle interdit, /me, logout avec invalidation du token.'],
            ['StudentTest.php', '14', 'Liste admin/teacher, recherche, création, permissions, validations, soft delete.'],
            ['PaymentTest.php', '10', 'Accès, création, enrollment croisé (422), méthodes invalides, soft delete.'],
            ['Total', '34', ''],
          ],
          [2500, 900, 5626]
        ),
        empty(),
        h2('9.2 Difficultés résolues'),
        bullet('Cache Sanctum : après logout, le token restait valide en mémoire dans le même processus de test. Solution : assertDatabaseMissing sur personal_access_tokens plutôt qu\'une deuxième requête HTTP.'),
        bullet('Contrainte UNIQUE en test : le helper createEnrolledStudent() insérait deux fois le même code de matière. Solution : utiliser uniqid() pour générer des codes uniques dans les helpers.'),

        // ── 10. DOCKER ─────────────────────────────────────────────────────
        h1('10. Conteneurisation Docker'),
        h2('10.1 Motivations'),
        pj('Sans Docker, le déploiement du projet nécessite PHP 8.2, Composer, Node.js, MySQL et un serveur web dans des versions compatibles. Toute différence d\'environnement peut provoquer des erreurs. Docker garantit que l\'environnement est identique sur toutes les machines.'),
        h2('10.2 Fichiers de configuration'),
        empty(),
        tbl(
          ['Fichier', 'Rôle'],
          [
            ['docker/php/Dockerfile', 'Image PHP 8.2-FPM avec extensions Laravel. Build en deux couches pour optimiser le cache Composer.'],
            ['docker/php/entrypoint.sh', 'Attend MySQL, met en cache la config et les routes Laravel, lance PHP-FPM.'],
            ['docker/nginx/default.conf', '/api → proxy FastCGI vers PHP-FPM. / → fichiers React avec try_files pour le routage SPA.'],
            ['docker-compose.yml', 'Définit les 3 services, le réseau interne app et les volumes persistants.'],
            ['docker-compose.override.yml', 'Développement : mode debug activé, code source monté en volume.'],
            ['.env.docker.example', 'Template des variables d\'environnement versionné dans git.'],
            ['Makefile', 'Raccourcis : make up, make down, make migrate, make seed, make test, etc.'],
          ],
          [2600, 6426]
        ),
        empty(),
        h2('10.3 Commandes de démarrage'),
        codeBlock('git clone https://github.com/JrSF23/Refuerzo_Elite_app_PFF.git'),
        codeBlock('cd Refuerzo_Elite_app_PFF'),
        codeBlock('copy .env.docker.example .env.docker'),
        codeBlock('docker compose --env-file .env.docker up -d'),
        codeBlock('docker compose exec laravel php artisan migrate --force'),
        codeBlock('docker compose exec laravel php artisan db:seed --force'),
        p('Application disponible sur http://localhost:8080', { italic: true }),

        // ── 11. RÉSULTATS ──────────────────────────────────────────────────
        h1('11. Résultats et bilan'),
        h2('11.1 Fonctionnalités livrées'),
        empty(),
        tbl(
          ['Fonctionnalité', 'État'],
          [
            ['API REST complète — 9 modules CRUD', 'Livré'],
            ['Authentification Sanctum + gestion des rôles (admin / teacher)', 'Livré'],
            ['Tableau de bord administrateur avec métriques globales', 'Livré'],
            ['Tableau de bord professeur avec vue personnalisée', 'Livré'],
            ['Interface SPA React — login, navigation, 9 modules', 'Livré'],
            ['Validations enum + validation croisée enrollment-student', 'Livré'],
            ['Rate limiting sur les routes API', 'Livré'],
            ['Index de performance en base de données', 'Livré'],
            ['34 tests automatiques — AuthTest, StudentTest, PaymentTest', 'Livré'],
            ['Conteneurisation Docker complète avec Makefile', 'Livré'],
            ['Données de démonstration (DemoSeeder)', 'Livré'],
            ['Documentation technique — README et IMPLEMENTATION.md', 'Livré'],
          ],
          [6500, 2526]
        ),
        empty(),
        h2('11.2 Améliorations possibles'),
        bullet('Export CSV / PDF des listes (présences, paiements).'),
        bullet('Journal d\'audit visible dans le frontend.'),
        bullet('Filtres avancés dans les listes (par statut, date, groupe).'),
        bullet('Indicateurs d\'élèves avec paiements en retard.'),
        bullet('Rappels de paiement par email.'),
        bullet('Vue dédiée pour les tuteurs / responsables légaux.'),

        // ── 12. CONCLUSION ─────────────────────────────────────────────────
        h1('12. Conclusion'),
        pj('Ce projet de fin de formation a permis de concevoir et de développer une application web complète, du modèle de données jusqu\'à l\'interface utilisateur, en passant par l\'API REST sécurisée, les tests automatisés et la conteneurisation Docker. Il couvre l\'ensemble des compétences d\'un développeur fullstack : conception de base de données relationnelle, développement backend avec Laravel, construction d\'une SPA React, écriture de tests d\'intégration et déploiement avec Docker.'),
        pj('La conteneurisation est l\'un des apports les plus concrets : elle garantit que l\'application peut être lancée sur n\'importe quelle machine disposant de Docker Desktop, sans configuration supplémentaire. L\'application est fonctionnelle, testée et déployable — une base solide et extensible pour un centre de soutien scolaire réel.'),

        // ── ANNEXES ────────────────────────────────────────────────────────
        h1('Annexes'),
        h2('A. Identifiants de démonstration'),
        empty(),
        tbl(
          ['Utilisateur', 'Mot de passe', 'Rôle', 'Accès'],
          [
            ['admin', 'Admin12345!', 'Administrateur', 'Accès complet'],
            ['mgarcia', 'Teacher12345!', 'Professeur', 'Groupes Mathématiques'],
            ['cmartinez', 'Teacher12345!', 'Professeur', 'Groupe Langue'],
          ],
          [1800, 2000, 2000, 3226]
        ),
        empty(),
        h2('B. Référentiel GitHub'),
        new Paragraph({
          children: [
            new TextRun({ text: 'Code source : ', size: 22, font: 'Arial' }),
            new ExternalHyperlink({
              children: [new TextRun({ text: 'https://github.com/JrSF23/Refuerzo_Elite_app_PFF', style: 'Hyperlink', size: 22, font: 'Arial' })],
              link: 'https://github.com/JrSF23/Refuerzo_Elite_app_PFF',
            }),
          ],
          spacing: { before: 60, after: 100 },
        }),
        h2('C. Stack complète'),
        empty(),
        tbl(
          ['Catégorie', 'Technologie', 'Version'],
          [
            ['Langage backend', 'PHP', '8.2'],
            ['Framework backend', 'Laravel', '12'],
            ['Auth', 'Laravel Sanctum', '4.x'],
            ['Rôles', 'Spatie Permission', '6.x'],
            ['Frontend', 'React', '19'],
            ['Router', 'React Router', 'v7'],
            ['HTTP client', 'Axios', 'latest'],
            ['Build', 'Vite', '6.x'],
            ['Base de données', 'MySQL', '8.0'],
            ['Serveur web', 'Nginx', '1.27'],
            ['Conteneurisation', 'Docker Compose', 'v2'],
            ['Contrôle de version', 'Git + GitHub', '-'],
          ],
          [2500, 4000, 2526]
        ),
      ],
    },
  ],
});

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync('rapport-refuerzo-elite-v2-final.docx', buffer);
  console.log('Rapport genere : rapport-refuerzo-elite-v2-final.docx');
});
