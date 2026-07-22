# Plan de test automatisé

## Objectif

Valider à chaque livraison les parcours essentiels de l'API HiPay (création d'ordre, authentification, cohérence fonctionnelle), avec des scénarios stables et rejouables en CI.

## Principes

- Tous les cas ne sont pas éligibles à l'automatisation.
- L'automatisation couvre la non-régression fonctionnelle de base.
- Les cas exploratoires, limites complexes ou dépendants d'un contexte externe restent en manuel.

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

## Exécution - voir page sur automatisation

- Exécution locale via npm scripts.
- Exécution CI quotidienne et sur push/PR.
- Rapport HTML généré systématiquement.

## Priorités de mise en oeuvre

1. Priorité 1
Cas nominal - 1 seul article
Deux fois le même paiement (même order_id)
Credentials invalides / autorisation manquante

2. Priorité 2
Cas avec plusieurs articles dans le panier
Cas nominal - sans panier
Paiement avec statut Failed
Réaliser un crédit
Réaliser une annulation de débit/crédit

3. Priorité 3
Custom Data dans la description
Unicité du numéro de série POS


