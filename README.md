# DEMO_HiPay

Projet de démonstration de tests automatisés sur l'API de paiement **HiPay**.  
Il couvre la création d'ordres de paiement via l'endpoint REST `POST /v1/connector/order` et valide :

- la campagne de non-régression pilotée par tags
- la campagne de démonstration (simulation sans secrets d'intégration)
- les contrôles d'authentification KO

NB : le projet a d'aborde été réféchi et réalisé partiellement sans l'aide de l'IA. Puis de facon incrémentive, consolidation, ajout amelrioration du code avec l'aide de l'IA.

## Stack technique

| Outil | Rôle |
|---|---|
| [Cucumber.js](https://cucumber.io/) | Framework BDD (Gherkin) |
| [Chai](https://www.chaijs.com/) | Assertions |
| [cucumber-html-reporter](https://github.com/gkushang/cucumber-html-reporter) | Génération de rapports HTML |
| Node.js / npm | Runtime et gestion des dépendances |

## Scénarios implémentés

- **`cas_nominal_OK.feature`** — Création d'un ordre de paiement : vérification du statut 200, de l'identifiant retourné, de la persistance en base, des notifications et de la conformité au schéma JSON. _(tags : `@smoke`, `@non_regression`, `@CP`)_
- **`authentification_KO.feature`** — Contrôle de l'authentification : header absent → 401, credentials invalides → 401. _(tags : `@smoke`, `@non_regression`, `@CNP`, `@demo`)_
- **`test_demo.feature`** — Simulation d'une réponse API 200 à partir de l'exemple Swagger pour valider le schéma sans credentials réels. _(tags : `@demo`, `@CP`)_

## Modes d'exécution

| Mode | Commande | Usage |
|---|---|---|
| `demo` | `npm run test:demo` | Exécute les scénarios taggés `@demo` (auth KO + simulation 200) pour démontrer le framework sans dépendre d'un accès complet aux secrets/BDD. |
| `non_regression` | `npm run test:non_regression` | Exécute les scénarios taggés `@non_regression` pour la campagne de non-régression. |
| `CP` | `npm run test:CP` | Exécute les scénarios taggés `@CP` (cas passants). |
| `CNP` | `npm run test:CNP` | Exécute les scénarios taggés `@CNP` (cas non passants). |

Le runner Cucumber transmet désormais correctement tous les arguments (`--tags`, expression de tags, chemins de features, etc.) et génère systématiquement le rapport HTML.

## Stratégie de validation

L'automatisation est structurée en trois couches :

- **Contrat API** : code HTTP, structure des objets retournés, présence des champs obligatoires, messages d'erreur.
- **Métier** : cohérence de `order_id`, `paymentStatus`, montant, devise et panier.
- **Intégration** : persistance BDD, notifications, nettoyage des données de test.

## Lancer les tests

```bash
npm install
npm test                        # tous les scénarios
npm run test:demo               # tags @demo
npm run test:non_regression     # tags @non_regression
npm run test:CP                 # tags @CP
npm run test:CNP                # tags @CNP
npm run test:cas_nominal_OK     # cas nominal uniquement
npm run test:authentification_KO
npm run test:smoke              # tag @smoke
npm run report                  # génération du rapport HTML
```

## Documentation

Pour plus de détails, consulter les fichiers dans [`documentation/`](documentation/) :

- [documentation/automatisation/CI_CD.md](documentation/automatisation/CI_CD.md) — Pipeline CI/CD
- [documentation/automatisation/Tech&Langage.md](documentation/automatisation/Tech&Langage.md) — Choix du langage et du framework
- [documentation/automatisation/lexique.md](documentation/automatisation/lexique.md) — Lexique des termes métier
- [documentation/testing_strategy/automation_test_plan.md](documentation/testing_strategy/automation_test_plan.md) — Plan de test automatisé
- [documentation/testing_strategy/manual_test_plan.md](documentation/testing_strategy/manual_test_plan.md) — Plan de test manuel

