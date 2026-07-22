# Choix du langage et du framework

## Contexte et contraintes

HiPay expose son API via un contrat Swagger et communique avec des outils qui fonctionnent nativement avec **Gherkin**, **JavaScript** et **TypeScript**.

Il fallait donc un langage qui :
- permet d'écrire des scénarios Gherkin lisibles par des non-développeurs (PO, testeurs métier)
- s'intègre nativement avec l'écosystème JS/TS de HiPay
- peut être lancé dans un **pipeline CI quotidien** sans configuration complexe
- génère un **rapport HTML** exploitable sans outil tiers supplémentaire

---

## Choix retenu : JavaScript + CucumberJS

Après recherches, la solution **CucumberJS** ([@cucumber/cucumber](https://github.com/cucumber/cucumber-js)) sur **Node.js** a été retenue comme la plus adaptée.

### Pourquoi JavaScript plutôt que TypeScript ?

TypeScript aurait apporté la sécurité du typage statique, mais au prix d'une configuration supplémentaire (`tsconfig.json`, transpilation, `ts-node`). Pour un projet de démonstration orienté tests API, JavaScript suffit et réduit la friction à l'entrée.

### Pourquoi CucumberJS plutôt qu'une alternative ?

| Critère | CucumberJS | Robot Framework | Playwright Test | Jest |
|---|---|---|---|---|
| Gherkin natif | ✅ | ✅ (via plugin) | ❌ | ❌ |
| Écosystème JS | ✅ | ❌ (Python) | ✅ | ✅ |
| Rapport HTML natif | ✅ | ✅ | ✅ | ❌ |
| Adapté tests API REST | ✅ | ✅ | ✅ | ✅ |
| Courbe d'apprentissage | Faible | Moyenne | Faible | Faible |

CucumberJS est **l'unique solution** qui réunit Gherkin natif + écosystème JS + rapport HTML sans couche d'adaptation.

---

## Architecture technique

```
DEMO_Hipay/
├── features/
│   ├── *.feature                  ← Scénarios en Gherkin
│   ├── step_definitions/          ← Implémentation JS des phrases Gherkin
│   ├── support/
│   │   └── parameter_types.js     ← Types de paramètres personnalisés ({boolean})
│   └── support-scripts/
│       └── run-tests.js           ← Runner cross-platform (contournement Windows)
├── environment/
│   └── Connexion_param.js         ← Credentials API + pool PostgreSQL
├── data/
│   └── create_order.json          ← JDD (Jeu De Données) de référence
├── reports/
│   ├── generate-report.js         ← Génération rapport HTML via cucumber-html-reporter
│   └── cucumber-report.html       ← Rapport généré
├── cucumber.js                    ← Configuration CucumberJS
└── .github/workflows/ci.yml       ← Pipeline GitHub Actions
```

---

## Dépendances

### Production

| Package | Version | Rôle |
|---|---|---|
| `pg` | ^8.11.0 | Connexion PostgreSQL — vérification des données en base |

### Développement

| Package | Version | Rôle |
|---|---|---|
| `@cucumber/cucumber` | ^10.0.0 | Framework BDD — exécution des scénarios Gherkin |
| `chai` | ^4.3.10 | Bibliothèque d'assertions (`expect`, `should`, `assert`) |
| `cucumber-html-reporter` | ^7.2.0 | Génération du rapport HTML à partir du JSON Cucumber |
| `dotenv` | ^16.3.1 | Chargement des variables d'environnement depuis un fichier `.env` |

---

## Points d'implémentation notables

### Rapport HTML

CucumberJS génère nativement un rapport au format **JSON** (`reports/cucumber.json`).  
`cucumber-html-reporter` transforme ce JSON en rapport HTML (thème Bootstrap) avec :
- horodatage de chaque scénario
- attachements (curl, order_id, réponse JSON) directement dans le rapport
- métadonnées d'environnement (version, plateforme, etc.)

Le rapport est **toujours généré**, même si des tests échouent.

### Runner cross-platform (`run-tests.js`)

Sur Windows, l'opérateur `||` utilisé pour forcer la génération du rapport après un échec n'est pas reconnu dans `npm scripts`. Un script Node.js dédié (`features/support-scripts/run-tests.js`) a été créé pour contourner ce problème. Il utilise `spawnSync` pour lancer CucumberJS puis appelle `generate-report.js` inconditionnellement avant de propager le code de sortie vers la CI.

### Type de paramètre `{boolean}`

CucumberJS ne reconnaît pas nativement `true` / `false` (sans guillemets) dans les phrases Gherkin.  
Un type de paramètre personnalisé est déclaré dans `features/support/parameter_types.js` :

```js
defineParameterType({
  name: 'boolean',
  regexp: /true|false/,
  transformer: (s) => s === 'true',
});
```

Cela permet d'écrire dans une `.feature` :

```gherkin
When je soumets la requête ... avec une authorization invalide présente true
```

### Gestion des secrets

Les credentials (API HiPay et base de données) ne sont jamais écrits en clair dans le code.  
Ils sont injectés via :
- un fichier **`.env`** en local (non commité, listé dans `.gitignore`)
- des **GitHub Secrets** en CI (`API_USERNAME`, `API_PASSWORD`, `LOGIN_BDD`, `PWS_BDD`)

---

## Pipeline CI/CD (GitHub Actions)

Le workflow `.github/workflows/ci.yml` est déclenché :

| Déclencheur | Détail |
|---|---|
| **Planification quotidienne** | Tous les jours à **9h00 (Paris)** — `cron: '0 7 * * *'` |
| **Push** | Sur les branches `main` et `develop` |
| **Pull Request** | Vers `main` |
| **Manuel** | Depuis l'onglet GitHub Actions — avec option pour cibler une feature précise ou désactiver les tests |

Le pipeline :
1. Installe Node.js 24 et les dépendances (`npm ci`)
2. Exécute les tests (feature complète ou ciblée)
3. Génère le rapport HTML
4. Uploade les artefacts (JSON brut conservé 7 jours, rapport HTML conservé 30 jours)
5. Publie le rapport HTML sur **GitHub Pages** (job `publish-report`)

> La variable `CI=true` est injectée automatiquement pour désactiver la vérification BDD et l'ouverture automatique du rapport dans le navigateur.
