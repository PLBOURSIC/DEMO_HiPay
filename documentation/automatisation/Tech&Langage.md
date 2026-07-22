# Choix du langage et du framework

## Contexte et contraintes

HiPay expose son API via un contrat Swagger et communique avec des outils qui fonctionnent nativement **JavaScript**, les bibliotheques de test présentes semblent fonntionner avec du Gherkin (indiqué dans l'énoncé).

Il fallait donc un langage qui :
- permet d'écrire des scénarios Gherkin lisibles par des non-développeurs (PO, testeurs métier)
- s'intègre nativement avec l'écosystème JS/TS de HiPay
- peut être lancé dans un **pipeline CI quotidien** sans configuration complexe
- génère un **rapport HTML** exploitable sans outil tiers supplémentaire

---

## Choix retenu : JavaScript + CucumberJS

Après recherches, la solution **CucumberJS** ([@cucumber/cucumber](https://github.com/cucumber/cucumber-js)) sur **Node.js** a été retenue comme la plus adaptée.

### Pourquoi CucumberJS plutôt qu'une alternative connue ?

| Critère | CucumberJS | Robot Framework | Playwright Test | Jest |
|---|---|---|---|---|
| Gherkin natif | ✅ | ✅ (via plugin) | ❌ | ❌ |
| Écosystème JS | ✅ | ❌ (Python) | ✅ | ✅ |
| Rapport HTML natif | ✅ | ✅ | ✅ | ❌ |
| Adapté tests API REST | ✅ | ✅ | ✅ | ✅ |

CucumberJS est **une solution** qui réunit Gherkin natif + écosystème JS + rapport HTML sans couche d'adaptation.

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
| `pg` | ^8.11.0 | Connexion BDD — vérification des données en base |

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

### Connexion centralisée API et BDD (`Connexion_param.js`)

Le fichier `environment/Connexion_param.js` centralise les accès techniques utilisés par les steps :
- `API_CREDENTIAL` construit le header Basic Auth de l'API à partir de `API_username` et `API_password` (encodage Base64).
- `pool` initialise une connexion BDD mutualisée (package `pg`) avec `LOGIN_BDD` et `PWS_BDD`.

Permet d'éviter de dupliquer la logique de connexion dans chaque step.

### Gestion des secrets

Les credentials (API HiPay et base de données) ne sont jamais écrits en clair dans le code.  
Ils sont injectés via :
- un fichier **`.env`** en local (non commité, listé dans `.gitignore`)
- des **GitHub Secrets** en CI (`API_USERNAME`, `API_PASSWORD`, `LOGIN_BDD`, `PWS_BDD`)

---


