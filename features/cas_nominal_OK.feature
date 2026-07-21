Feature: Cas nominal creation order

  En tant qu'utilisateur
  Je veux creer un ordre de paiement sur un article
  Afin d'initier le paiement dans mon applicatif et renvoyer un statut OK-pourPaiement au client

  Scenario:  Creation d'un order OK
    Given je construit le body de paiement avec les informations de l'article
    When je soumets la requête de création d'ordre de paiement
    Then je reçois un statut 200 et un identifiant d'ordre
    And l'enregistrement avec l'order_id existe en base
    And les notifications ont été reçues sur l'url notify
    And je vérifie que la réponse respecte le schéma JSON attendu
    After je purge la bdd pour eviter de l'encombrer