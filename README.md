# DEMO_HiPay

Projet de démonstration de tests automatisés sur l'API de paiement **HiPay**.  
Il couvre la création d'ordres de paiement via l'endpoint REST `POST /v1/connector/order` et valide les comportements nominaux et les cas d'erreur d'authentification.

## Stack technique

| Outil | Rôle |
|---|---|
| [Cucumber.js](https://cucumber.io/) | Framework BDD (Gherkin) |
| [Chai](https://www.chaijs.com/) | Assertions |
| [cucumber-html-reporter](https://github.com/gkushang/cucumber-html-reporter) | Génération de rapports HTML |
| Node.js / npm | Runtime et gestion des dépendances |

## Scénarios implémentés

- **`cas_nominal_OK.feature`** — Création d'un ordre de paiement : vérification du statut 200, de l'identifiant retourné, de la persistance en base, des notifications et de la conformité au schéma JSON. _(tags : `@smoke`, `@creation_order`, `@regression`)_
- **`authentification_KO.feature`** — Contrôle de l'authentification : header absent → 401, credentials invalides → 401. _(tags : `@smoke`, `@regression`, `@CNP`)_

## Lancer les tests

```bash
npm install
npm test                        # tous les scénarios
npm run test:cas_nominal_OK     # cas nominal uniquement
npm run test:authentification_KO
npm run test:smoke              # tag @smoke
npm run report                  # génération du rapport HTML
```

## Documentation

Pour plus de détails, consulter les fichiers dans [`documentation/`](documentation/) :

- [documentation/automatisation/CI_CD.md](documentation/automatisation/CI_CD.md) — Pipeline CI/CD
- [documentation/automatisation/langage.md](documentation/automatisation/langage.md) — Choix du langage et du framework
- [documentation/automatisation/lexique.md](documentation/automatisation/lexique.md) — Lexique des termes métier
- [documentation/testing_strategy/automation_test_plan.md](documentation/testing_strategy/automation_test_plan.md) — Plan de test automatisé
- [documentation/testing_strategy/manual_test_plan.md](documentation/testing_strategy/manual_test_plan.md) — Plan de test manuel

