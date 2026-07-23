@smoke @regression @CNP
Feature: Authentification KO

  En tant que maintainer
  Je dois vérifier l'obligation de credentials pour pouvoir m'authentifier et créer un ordre de paiement

  Scenario:  Header authorization absent
    Given je construit le body de paiement avec les informations de l'article
    When je soumets la requête de création d'ordre de paiement avec une authorization invalide présente false
    Then je reçois un statut 401 et un message d'erreur "Invalid authorization header"

  Scenario:  Invalid Credentials
    Given je construit le body de paiement avec les informations de l'article
    When je soumets la requête de création d'ordre de paiement avec une authorization invalide présente true
    Then je reçois un statut 401 et un message d'erreur "invalid credentials"