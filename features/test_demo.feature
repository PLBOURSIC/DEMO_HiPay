@demo @CP
Feature: test demo validation schéma API

  En tant qu'utilisateur
  Je ne possède pas les credential de l'API, je veux tout de même tester la réponse
  Afin de réaliser le test je prend donc la réponse donnée dans l'exemple du swagger 
  Et je simule une réponse 200 

  Scenario:  Creation d'un order OK
    Given je construit le body de paiement avec les informations de l'article
    Then je simule la requête de création d'ordre de paiement avec une réponse 200
    And je vérifie que la réponse respecte le schéma JSON attendu