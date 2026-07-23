# Plan de test automatisé

## Objectif

Valider à chaque livraison les parcours essentiels de l'API HiPay (création d'ordre, authentification, cohérence fonctionnelle), avec des scénarios stables et rejouables en CI.

Le plan distingue volontairement les campagnes de **démonstration technique** des campagnes de **validation réelle**, afin de ne pas mélanger absence de prérequis et défaut produit.

## Principes

- Tous les cas ne sont pas éligibles à l'automatisation.
- L'automatisation couvre la non-régression fonctionnelle de base.
- Les cas exploratoires, limites complexes ou dépendants d'un contexte externe restent en manuel.
- Un run sans credentials API ne qualifie pas le produit : il qualifie la capacité du framework à journaliser un échec attendu.

## Couches de couverture

### 1. Contrat API

Vérifier les éléments transport et contrat de service :

- code HTTP attendu
- structure de la réponse
- présence des champs obligatoires
- messages d'erreur fonctionnels et techniques

### 2. Cohérence métier

Vérifier la logique métier minimale portée par le payload et la réponse :

- présence et cohérence de `order_id`
- statut de paiement (`Success` / `Failed`)
- cohérence de montant, devise et panier
- unicité et intégrité des données clefs

### 3. Intégration

Vérifier les dépendances externes lorsqu'elles sont accessibles :

- persistance BDD
- notifications
- nettoyage des données de test

## Cas retenus pour l'automatisation

| ID | Cas | Statut |
|---|---|---|
| 01.01.CP | Cas nominal - 1 seul article | ✅ |
| 01.02.CP | Cas nominal - sans panier | A automatiser |
| 02.01.CP | Cas avec plusieurs articles dans le panier | A automatiser |
| 03.01.CP | Réaliser un crédit | A automatiser |
| 04.01.CP | Réaliser une annulation de débit/crédit | A automatiser |
| 06.01.CP | Paiement avec statut Failed | A automatiser |
| 11.01.CP | Custom Data dans la description | A automatiser |
| 13.01.CP | Unicité du numéro de série POS | A automatiser |
| 16.01.CP | Deux fois le même paiement (même order_id) | A automatiser |
| 22.01.CNP | Credentials invalides / autorisation manquante | ✅ |

## Couverture attendue

Pour les cas automatisés, vérifier selon le scénario :

- code HTTP attendu
- présence et cohérence de order_id
- statut de paiement (Success/Failed)
- structure de la réponse (champs obligatoires)
- cohérence métier minimale (montants, devise, panier)
- persistance BDD lorsque applicable
- notifications lorsque applicable

## Modes d'exécution

| Mode | Finalité | Attendu |
|---|---|---|
| `demo` | Jouer les scénarios taggés `@demo` (KO auth + simulation) | Le framework doit produire un rapport lisible sans dépendre d'un accès complet à l'environnement |
| `non_regression` | Jouer les scénarios taggés `@non_regression` | Vérification de la non-régression fonctionnelle |
| `CP` | Jouer les scénarios taggés `@CP` | Validation des cas passants |
| `CNP` | Jouer les scénarios taggés `@CNP` | Validation des cas non passants |

## Exécution - voir page sur automatisation

- Exécution locale via npm scripts selon le mode choisi.
- Exécution CI quotidienne, sur push/PR et en lancement manuel.
- Rapport HTML généré systématiquement, y compris en cas d'échec attendu.
- CI séparée en deux campagnes avec artefacts distincts :
   - `non_regression` -> `cucumber-report-non-regression-<run_number>`
   - `demo` -> `cucumber-report-demo-<run_number>`

## Rôle des hooks

Les hooks Cucumber servent à préparer et nettoyer l'exécution des tests autour des scénarios.

- BeforeAll: initialise le contexte global et vérifie l'état de la BDD (hors CI).
- Before: journalise le démarrage de chaque scénario.
- After: purge les données créées pendant le scénario (exemple: order_id) pour éviter les effets de bord.
- AfterAll: ferme proprement les connexions (pool PostgreSQL) en fin de campagne.

Implémentation: voir features/step_definitions/hook.js.

## Priorités de mise en oeuvre

1. Priorité 1 :
    - Cas nominal - 1 seul article
    - Deux fois le même paiement (même order_id)
    - Credentials invalides / autorisation manquante

2. Priorité 2 :
   - Cas avec plusieurs articles dans le panier
   - Cas nominal - sans panier
   - Paiement avec statut Failed
   - Réaliser un crédit
   - Réaliser une annulation de débit/crédit

3. Priorité 3 :
   - Custom Data dans la description
   - Unicité du numéro de série POS


