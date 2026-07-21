Feature: Authentification KO

  En tant qu'utilisateur
  Je veux creer un ordre de paiement sur un article
  Afin d'initier le paiement dans mon applicatif et renvoyer un statut OK-pourPaiement au client

  Scenario:  Header authorization absent
    Given je construit le body de paiement avec les informations de l'article
    When je soumets la requête de création d'ordre de paiement sans header authorization
    Then je reçois un code code et un message d'erreur error

  Scenario:  Header authorization invalide
    Given je construit le body de paiement avec les informations de l'article
    When je soumets la requête de création d'ordre de paiement avec un header authorization invalide
    Then je reçois un code code et un message d'erreur error

  Scenario:  Invalid Credentials
    Given je construit le body de paiement avec les informations de l'article
    When je soumets la requête de création d'ordre de paiement avec des identifiants invalides
    Then je reçois un code code et un message d'erreur error