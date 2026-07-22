# Lexique des phrases clefs — Cucumber / Gherkin

Ce fichier recense l'ensemble des **phrases Gherkin** (steps) disponibles dans le projet,  
leur rôle, leur implémentation et leur usage dans les fichiers `.feature`.

> **Convention** : `{boolean}` / `{int}` / `{string}` sont des **paramètres dynamiques** injectés automatiquement par CucumberJS depuis la phrase Gherkin.

---

## Sommaire

| Mot-clef | Phrase | Fichier |
|---|---|---|
| `Given` | [je construit le body de paiement avec les informations de l'article](#given--je-construit-le-body-de-paiement-avec-les-informations-de-larticle) | `create_order.steps.js` |
| `When` | [je soumets la requête de création d'ordre de paiement](#when--je-soumets-la-requête-de-création-dordre-de-paiement) | `create_order.steps.js` |
| `When` | [je soumets la requête de création d'ordre de paiement sans header authorization](#when--je-soumets-la-requête-de-création-dordre-de-paiement-sans-header-authorization) | `create_order.steps.js` |
| `When` | [je soumets la requête de création d'ordre de paiement avec une authorization invalide présente {boolean}](#when--je-soumets-la-requête-de-création-dordre-de-paiement-avec-une-authorization-invalide-présente-boolean) | `authentification.steps.js` |
| `Then` | [je reçois un statut 200 et un identifiant d'ordre](#then--je-reçois-un-statut-200-et-un-identifiant-dordre) | `create_order.steps.js` |
| `Then` | [je reçois un statut {int} et un message d'erreur {string}](#then--je-reçois-un-statut-int-et-un-message-derreur-string) | `authentification.steps.js` |
| `Then` | [je vérifie que la réponse respecte le schéma JSON attendu](#then--je-vérifie-que-la-réponse-respecte-le-schéma-json-attendu) | `verification_body_response.js` |
| `Then` | [l'enregistrement avec l'order_id existe en base](#then--lenregistrement-avec-lorder_id-existe-en-base) | `bdd_request.js` |
| `Then` | [les notifications ont été reçues sur l'url notify](#then--les-notifications-ont-été-reçues-sur-lurl-notify) | `bdd_request.js` |
| `Hook` | [BeforeAll](#hook--beforeall) | `hook.js` |
| `Hook` | [Before](#hook--before) | `hook.js` |
| `Hook` | [After](#hook--after) | `hook.js` |
| `Hook` | [AfterAll](#hook--afterall) | `hook.js` |

---

## Given — `je construit le body de paiement avec les informations de l'article`

**Fichier** : `features/step_definitions/create_order.steps.js`

### Description

Initialise le body de la requête en chargeant le fichier de données de référence et en générant un `order_id` unique basé sur le timestamp courant.

### Ce que fait le step

1. Lit le fichier [`data/create_order.json`](../../data/create_order.json)
2. Parse son contenu en objet JavaScript
3. Remplace `order.order_id` par une valeur unique de la forme `ORDER_<timestamp>` (via `jdd.js`)
4. Stocke le body dans le contexte du scénario (`this.body`)

---

## When — `je soumets la requête de création d'ordre de paiement`

**Fichier** : `features/step_definitions/create_order.steps.js`

### Description

Envoie le body préparé en `Given` vers l'endpoint de création d'ordre avec des **credentials valides**.

### Ce que fait le step

1. Construit l'URL : `POST https://cloudrun-api-yugcnet4yq-ew.a.run.app/v1/connector/order`
2. Ajoute les headers : `Content-Type: application/json`, `accept: application/json`, `Authorization: Basic <token>`
3. Le token est généré via `API_CREDENTIAL()` — encode `login:password` en Base64 depuis les variables d'environnement
4. Stocke dans le contexte : `this.statusCode`, `this.response`, `this.orderId`
5. Attache au rapport HTML : la commande `curl` équivalente (sans credentials), l'`order_id` et la réponse JSON

---

## When — `je soumets la requête de création d'ordre de paiement avec une authorization invalide présente {boolean}`

**Fichier** : `features/step_definitions/authentification.steps.js`

### Description

Envoie la requête avec un header `Authorization` dont la présence et la validité dépendent du paramètre `{boolean}`.

### Ce que fait le step

| Valeur du `{boolean}` | Comportement |
|---|---|
| `true` | Envoie le header `Authorization: Basic <credentials_erronés>` (login/password invalides encodés en Base64) |
| `false` | N'envoie **pas** le header `Authorization` |

Les credentials erronés sont fournis par `jdd.js > API_CREDENTIAL_ERRONNE()` qui encode `invalid_login:invalid_password`.

> **Note** : CucumberJS convertit automatiquement `true` / `false` (sans guillemets dans le fichier `.feature`) en booléen JavaScript.

---

## Then — `je reçois un statut 200 et un identifiant d'ordre`

**Fichier** : `features/step_definitions/create_order.steps.js`

### Description

Vérifie qu'une création d'ordre s'est bien déroulée en validant le statut HTTP et les champs clefs de la réponse.

### Assertions effectuées

| Assertion | Valeur attendue |
|---|---|
| `this.statusCode` | `200` |
| `response.order_id` | Identique à l'`order_id` envoyé dans la requête |
| `response.paymentStatus` | `"Success"` |

---

## Then — `je reçois un statut {int} et un message d'erreur {string}`

**Fichier** : `features/step_definitions/authentification.steps.js`

### Description

Vérifie qu'une requête non autorisée retourne le bon statut HTTP et le bon message d'erreur.

### Paramètres

| Paramètre | Type | Exemple |
|---|---|---|
| `{int}` | Entier | `401` |
| `{string}` | Chaîne entre guillemets | `"Invalid authorization header"` |

### Assertions effectuées

| Champ vérifié | Valeur attendue |
|---|---|
| `this.statusCode` | Valeur du `{int}` fourni |
| `response.error.code` | `"connector.api.login.unauthorized"` |
| `response.error.message` | `"Unauthorized"` |
| `response.error.description` | `"The login has been rejected."` |
| `response.error.details` | Valeur du `{string}` fourni |

---

## Then — `je vérifie que la réponse respecte le schéma JSON attendu`

**Fichier** : `features/step_definitions/verification_body_response.js`

### Description

Effectue une validation complète et détaillée du body de réponse.

### Assertions effectuées

| # | Champ | Règle |
|---|---|---|
| 1 | `response.receipt` | Présent et encodé en **Base64** (regex `/^[A-Za-z0-9+/]+={0,2}$/`) |
| 2 | `body.order.price` | Présent |
| 3 | `body.order.price.amount` | De type `number`, entier (`Number.isInteger`), `≥ 0` |
| 4 | `body.order.price.currency` | Présent, format **ISO 4217** (`/^[A-Z]{3}$/`), valeur `"EUR"` |
| 5 | `body.order.basket` | Présent, de type `array`, non vide |
| 6 | `basket[n].product_reference` | Présent (obligatoire) |
| 7 | `basket[n].name` | Présent (obligatoire) |
| 8 | `basket[n].type` | Présent (obligatoire) |
| 9 | `basket[n].quantity` | Présent (obligatoire) |
| 10 | `basket[n].unit_price` | Présent (obligatoire) |
| 11 | `basket[n].discount` | Présent, valeur `≤ 0` |
| 12 | `basket[n].total_amount` | `= unit_price × quantity − \|discount\|` (arrondi à 2 décimales) |
| 13 | `pos_technical_info.device_information` | Présent |
| 14 | `device_information.serial_number` | Présent, string non vide |
| 15 | `device_information.manufacturer` | Présent, string non vide |
| 16 | `terminal_transaction_display` | Présent |
| 17 | `terminal_transaction_display.protocol` | Présent, parmi `["ConcertV3.1", "AppNepting", "ConcertV3.2"]` |
| 18 | `terminal_transaction_display.force_authorization` | Présent, de type `boolean` |

---

## Then — `l'enregistrement avec l'order_id existe en base`

**Fichier** : `features/step_definitions/bdd_request.js`

### Description

Interroge la base de données (SQL ?) pour vérifier que l'ordre créé a bien été persisté.

### Ce que fait le step

1. Récupère l'`order_id` depuis `this.response.order.order_id`
2. Exécute la requête SQL : `SELECT * FROM orders WHERE order_id = $1`
3. Vérifie que le résultat contient au moins une ligne

### Prérequis

La base de données `bdd_HiPay` doit être accessible (connexion configurée dans `environment/Connexion_param.js` via les variables d'environnement `LOGIN_BDD` et `PWS_BDD`).

> En environnement CI (`process.env.CI = true`), la vérification BDD est automatiquement ignorée (voir `hook.js`).

---

## Then — `les notifications ont été reçues sur l'url notify`

**Fichier** : `features/step_definitions/bdd_request.js`

### Description

Vérifie en base de données que la notification de paiement a bien été envoyée vers l'URL configurée.

### Ce que fait le step

1. Récupère `notify_url` depuis `this.body.pos_technical_info.notify_url`
2. Récupère `order_id` depuis `this.body.order.order_id`
3. Exécute la requête SQL : `SELECT * FROM notifications WHERE order_id = $1 AND notify_url = $2`
4. Vérifie que le résultat contient au moins une ligne

---

## Hook — `BeforeAll`

**Fichier** : `features/step_definitions/hook.js`

### Description

S'exécute une seule fois avant tous les scénarios.

### Ce que fait le hook

1. Le projet étant ficitf, si `CI=true`, il marque la santé BDD à `SKIP` (pas de check DB en CI)
2. Sinon, il appelle `checkDatabaseHealth()` pour tester la connectivité BDD
3. Log le démarrage de la campagne CucumberJS

---

## Hook — `Before`

**Fichier** : `features/step_definitions/hook.js`

### Description

S'exécute avant chaque scénario.

### Ce que fait le hook

1. Récupère les métadonnées du scénario (`scenario.pickle.name`)
2. Écrit un log de début d'exécution en consolen avec le nom du cas de test 

---

## Hook — `After`

**Fichier** : `features/step_definitions/hook.js`

### Description

S'exécute après chaque scénario pour nettoyer la base de données.

### Ce que fait le hook

1. Récupère `order_id` depuis `this.body.order.order_id` (si absent, ne fait rien = permet d'éviter d'avoir une requete sql en erreur car l'ordre de paiement n'a pas été créé)
2. Si la BDD est disponible (`dbHealth === 'OK'`), supprime l'ordre créé :
	- `DELETE FROM orders WHERE order_id = $1`
3. Log la purge en console

> Objectif : éviter d'encombrer la base entre les scénarios.

---

## Hook — `AfterAll`

**Fichier** : `features/step_definitions/hook.js`

### Description

S'exécute une seule fois après tous les scénarios.

### Ce que fait le hook

1. ferme le pool BDD via `pool.end()`
2. Log la fermeture de la connexion

---

## Annexe — Utilitaires internes

Ces fonctions ne sont pas des steps Gherkin mais sont utilisées par les steps ci-dessus.

### `jdd.js > order_id()`

Génère un identifiant d'ordre unique à chaque appel.

```js
// Résultat : "ORDER_1753178412345"
const id = `ORDER_${Date.now()}`;
```

### `jdd.js > API_CREDENTIAL_ERRONNE()`

Retourne un token Basic Auth encodé en Base64 avec des credentials volontairement invalides.

```js
Buffer.from('invalid_login:invalid_password').toString('base64')
```

### `Connexion_param.js > API_CREDENTIAL()`

Retourne le token Basic Auth valide depuis les variables d'environnement `.env`.

```js
Buffer.from(`${process.env.API_username}:${process.env.API_password}`).toString('base64')
```

### `hook.js > Hooks globaux`

Le fichier contient les hooks `BeforeAll`, `Before`, `After` et `AfterAll`.

### `bdd_request.js > checkDatabaseHealth()`

Effectue un `SELECT 1` sur la base pour vérifier la connectivité.  
Retourne `{ healthCheck: 'OK' }` ou `{ healthCheck: 'FAIL' }`.
