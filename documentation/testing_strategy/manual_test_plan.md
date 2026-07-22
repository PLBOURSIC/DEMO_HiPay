# Plan de test manuel — API HiPay Connector

> **Endpoint testé** : `POST https://cloudrun-api-yugcnet4yq-ew.a.run.app/v1/connector/order`  
> **Authentification** : Basic Auth (`Authorization: Basic <base64(login:password)>`)  
> **Format** : JSON (`Content-Type: application/json`)
>
> **Légende** : `CP` = Cas Passant · `CNP` = Cas Non Passant  
> **Statuts** : ⬜ Non joué · ✅ Passé · ❌ Échoué · ⏭ Ignoré

---

## Sommaire

| # | Identifiant | Intitulé | Type |
|---|---|---|---|---|
| 1 | 01.01.CP | Cas nominal — 1 seul article | CP |
| 2 | 01.02.CP | Cas nominal — données minimales (sans panier) | CP |
| 3 | 02.01.CP | Plusieurs articles dans le panier | CP |
| 4 | 03.01.CP | Réaliser un crédit | CP |
| 5 | 04.01.CP | Annulation de débit / crédit | CP |
| 6 | 05.01.CNP | Order avec des valeurs négatives | CNP |
| 7 | 06.01.CP | Paiement en statut Failed | CP |
| 8 | 07.01.CNP | URL différente dans les notifications | CNP |
| 9 | 08.01.CNP | Devises non conformes | CNP |
| 10 | 09.01.CP | Gestion des caractères spéciaux | CP |
| 11 | 10.01.CP | Valeur monétaire très grande | CP |
| 12 | 10.02.CNP | Valeur non monétaire / tax_rate / discount incohérents | CNP |
| 13 | 10.03.CNP | Order incohérent / inconnu | CNP |
| 14 | 11.01.CP | Custom Data dans la description | CP |
| 15 | 12.01.CP | Validation format customer | CP |
| 16 | 13.01.CP | Unicité numéro de série du POS | CP |
| 17 | 14.01.CP | Protocoles terminal_transaction_display | CP |
| 18 | 15.01.CP | force_authorization à true ou false | CP |
| 19 | 16.01.CP | Deux fois le même paiement (même order_id) | CP |
| 20 | 17.01.CNP | Injection SQL et failles de sécurité | CNP |
| 21 | 18.01.CNP | Vérification du timeout | CNP |
| 22 | 19.01.CNP | Bad Request | CNP |
| 23 | 20.01.CNP | Bad Gateway | CNP |
| 24 | 21.01.CNP | Application HiPay down | CNP |
| 25 | 22.01.CNP | Invalid credential / autorisation manquante | CNP |

---

## 01.01.CP — Cas nominal — 1 seul article

> **Objectif** : Création d'un ordre de paiement avec tous les éléments possibles et vérification complète de la réponse.

**Priorité** : 🔴 Critique | **Type** : CP

#### Données d'entrée

Utiliser le body complet de [`data/create_order.json`](../../data/create_order.json) avec un `order_id` unique.

#### Résultats attendus

- [ ] Statut HTTP : **200 OK**
- [ ] L'ordre est enregistré en base de données (`bdd_HiPay`) avec les bonnes informations
- [ ] `response.paymentStatus` = `"Success"`
- [ ] `response.receipt` présent et encodé en **Base64**
- [ ] Une notification est reçue sur `https://hipay.com/notify` (URL définie par défaut dans le back office)
- [ ] `response.order_id` présent, de type **string**, identique à celui envoyé
- [ ] `order.price.amount` présent, exprimé en **centimes** (plus petite unité de la devise — entier)
- [ ] `order.price.currency` = `"EUR"` au format **ISO 4217**
- [ ] `order.basket` présent et non vide, contenant les champs obligatoires par article :
  - [ ] `discount` est toujours `≤ 0`
  - [ ] `total_amount` = `unit_price × quantity − |discount|`
- [ ] `pos_technical_info.device_information` présent avec :
  - [ ] `serial_number` — identifiant unique
  - [ ] `manufacturer` présent
- [ ] `terminal_transaction_display.protocol` présent (par défaut `ConcertV3.1`)
- [ ] `terminal_transaction_display.force_authorization` présent (booléen)

---

## 01.02.CP — Cas nominal — données minimales (sans panier)

> **Objectif** : Vérifier qu'un paiement peut être effectué sans fournir de panier.

**Type** : Cas Passant

#### Données modifiées

Supprimer le champ `basket` du body envoyé.

#### Résultats attendus

- [ ] Statut HTTP : **200 OK**
- [ ] `response.paymentStatus` = `"Success"`
- [ ] Le champ `basket` est **absent** de la réponse

---

## 02.01.CP — Plusieurs articles dans le panier

> **Objectif** : Vérifier le traitement d'un panier multi-articles utilisant les 3 types d'articles possibles.
**Type** : Cas Passant

#### Données modifiées

Fournir un panier avec au moins 3 articles utilisant les enums de type :

| `type` |
|---|
| `good` |
| `discount` |
| `fee` |

#### Résultats attendus

- [ ] Statut HTTP : **200 OK**
- [ ] La somme des `total_amount` de chaque article correspond au `price.amount` total
- [ ] Les arrondis sont correctement gérés (2 décimales)

---

## 03.01.CP — Réaliser un crédit

> **Objectif** : Vérifier que l'API accepte une transaction de type `Credit`.

**Type** : Cas Passant

#### Données modifiées

```json
"transaction_type": "Credit"
```

#### Résultats attendus

- [ ] Statut HTTP : **200 OK**
- [ ] `response.paymentStatus` = `"Success"`
- [ ] Le type de transaction est bien `Credit` en base

---

## 04.01.CP — Annulation de débit / crédit

> **Objectif** : Vérifier que l'API accepte une transaction de type `Cancel` (annulation d'un débit ou d'un crédit précédent).

**Type** : Cas Passant

#### Prérequis

Un ordre de débit ou de crédit préalablement créé (récupérer son `order_id`).

#### Résultats attendus

- [ ] Statut HTTP : **200 OK**
- [ ] La transaction est annulée et visible en base

---

## 05.01.CNP — Order avec des valeurs négatives

> **Objectif** : Vérifier que l'API rejette un order contenant des valeurs négatives.

**Type** : Cas Non Passant

#### Données modifiées

```json
"price": { "amount": -100, "currency": "EUR" }
```

#### Résultats attendus

- [ ] Statut HTTP : **4xx**
- [ ] Message d'erreur explicite sur le champ incriminé
- [ ] Aucun ordre créé en base

---

## 06.01.CP — Paiement en statut Failed

> **Objectif** : Vérifier le comportement de l'API lorsque le paiement est refusé par le TPE, carte invalide, etc.

**Type** : Cas Passant

#### Résultats attendus

- [ ] Statut HTTP : **200 OK** (la transaction est traitée)
- [ ] `response.paymentStatus` = `"Failed"`
- [ ] `response.errorCode` présent et non vide
- [ ] `response.errorData` présent avec une description de l'erreur

---

## 07.01.CP — URL différente dans les notifications

> **Objectif** : Vérifier que les notifications sont bien envoyées vers une URL personnalisée différente de celle du back office.

**Type** : Cas Passant

#### Prérequis

Disposer d'un endpoint client capable de recevoir les notifications.

#### Données modifiées

```json
"notify_url": "https://mon-endpoint-custom/notify"
```

#### Résultats attendus

- [ ] La notification est reçue sur l'URL fournie et **non** sur l'URL par défaut du back office
- [ ] Le payload de la notification est conforme

---

## 08.01.CNP — Devises non conformes

> **Objectif** : Vérifier que les devises mal formatées ou non supportées sont rejetées.

**Type** : Cas Non Passant

#### Jeux de données à tester

| Valeur `currency` | Scénario |
|---|---|
| `"eur"` | Minuscules — non conforme ISO 4217 |
| `"euro"` | Libellé long — non conforme |
| `"€"` | Symbole — non conforme |
| `"XYZ"` | Devise inconnue |

#### Résultats attendus (pour chaque valeur)

- [ ] Statut HTTP : **4xx**
- [ ] Message d'erreur indiquant une devise invalide
- [ ] Aucun ordre créé en base

---

## 09.01.CP — Gestion des caractères spéciaux

> **Objectif** : Vérifier que l'API gère correctement les caractères spéciaux dans les champs texte.

**Type** : Cas Passant

#### Données modifiées

Utiliser des caractères spéciaux dans les champs suivants :

| Champ | Valeur de test |
|---|---|
| `order.description` | `"Commande & test — éàü <spécial> 'apostrophe'"` |
| `order.basket[n].name` | `"Produit #1 / Réf. (A+B)"` |
| `customer.first_name` | `"Jean-François"` |
| `customer.last_name` | `"O'Brien"` |

#### Résultats attendus

- [ ] Statut HTTP : **200 OK**
- [ ] Les caractères spéciaux sont correctement persistés en base et retournés dans la réponse car ce sont des strings

---

## 10.01.CP — Valeur monétaire très grande

> **Objectif** : Tester le comportement de l'API avec un montant extrêmement élevé.

**Type** : Cas Passant

#### Données modifiées

```json
"price": { "amount": 999999999, "currency": "EUR" }
```

#### Résultats attendus

- [ ] Statut HTTP : **200 OK** ou **4xx** selon les limites métier définies
- [ ] Si refusé : message explicite sur le dépassement de plafond

---

## 10.02.CNP — Valeur non monétaire / incohérences dans le panier

> **Objectif** : Vérifier la validation des règles de cohérence du panier.

**Type** : Cas Non Passant

#### Jeux de données à tester

| Champ modifié | Valeur | Résultat attendu |
|---|---|---|
| `price.amount` | `"cent euros"` (string) | 4xx — type invalide |
| `basket[n].tax_rate` | `0.2` (décimal au lieu de %) | 4xx ou comportement à documenter |
| `basket[n].discount` | `+5` (discount positif) | 4xx — discount doit être ≤ 0 |

#### Résultats attendus

- [ ] Statut HTTP : **4xx** pour chaque cas
- [ ] Message d'erreur explicite par champ

---

## 10.03.CNP — Order incohérent

> **Objectif** : Tester la robustesse de l'API face à des `order_id` mal formés.

**Type** : Cas Non Passant

#### Prérequis

Uniquement si il existe une règle de formatage de l'order_id, dans le swagger il est indiqué en {string}

#### Jeux de données à tester

| Scénario | `order_id` |
|---|---|
| Identifiant très long | Chaîne de 500 caractères |
| Identifiant inconnu (annulation) | `"coucou"` |

#### Résultats attendus

- [ ] Statut HTTP : **4xx** avec message explicite

---

## 11.01.CP — Custom Data dans la description

> **Objectif** : Vérifier que les données personnalisées (`custom_data`) sont bien visibles dans le back office HiPay.

**Type** : Cas Passant

#### Données modifiées

```json
"custom_data": {
  "internal_reference": "ORD_987465",
  "customer_first_order": true,
  "other_sample_parameter": "Other sample value"
}
```

#### Résultats attendus

- [ ] Statut HTTP : **200 OK**
- [ ] Les `custom_data` sont visibles dans les **détails de la transaction** du back office HiPay

---

## 12.01.CP — Validation format customer

> **Objectif** : Vérifier que l'API valide les formats des données client.

**Type** : Cas Passant

#### Jeux de données à tester

| Champ | Valeur invalide | Résultat attendu |
|---|---|---|
| `customer.phone` | `"abc123"` ou `"0612"` | 4xx — format téléphone invalide |
| `customer.email` | `"pas-un-email"` | 4xx — format email invalide |
| `customer.last_name` | _(champ absent)_ | 4xx ou 200 selon caractère obligatoire |

---

## 13.01.CP — Vérification de l'unicité du numéro de série du POS

> **Objectif** : Vérifier qu'un même numéro de série associé à un fabricant différent est accepté ou rejeté.

**Type** : Cas Passant

#### Données modifiées

Utiliser un `serial_number` déjà utilisé dans un ordre précédent mais avec un `manufacturer` différent.

```json
"device_information": {
  "serial_number": "1850320198",
  "manufacturer": "INGENICO"
}
```

#### Résultats attendus

- [ ] Statut HTTP : **4xx** avec message explicite

---

## 14.01.CP — Protocoles terminal_transaction_display

> **Objectif** : Vérifier le comportement de l'API pour chacun des protocoles supportés.

**Type** : Cas Passant

#### Jeux de données à tester

| `protocol` | Résultat attendu |
|---|---|
| `"AppNepting"` | 200 — protocole présent dans la réponse |
| `"ConcertV3.1"` | 200 — protocole présent dans la réponse |
| `"ConcertV3.2"` | 200 — protocole présent dans la réponse |
| _(champ absent)_ | 200 — `protocol` renseigné avec la valeur par défaut `"ConcertV3.1"` |
| `"PROTOCOLE_INCONNU"` | 4xx — erreur sur l'enum invalide |

---

## 15.01.CP — force_authorization à true ou false

> **Objectif** : Vérifier le comportement du booléen `force_authorization`.

**Type** : Cas Passant

#### Jeux de données à tester

| `force_authorization` | Résultat attendu |
|---|---|
| `true` | 200 — valeur présente dans la réponse |
| `false` | 200 — valeur présente dans la réponse |
| _(champ absent)_ | 200 — champ absent de la réponse (pas de valeur par défaut injectée) |

---

## 16.01.CP — Deux fois le même paiement (même order_id)

> **Objectif** : Vérifier le comportement de l'API lorsqu'un `order_id` déjà traité est renvoyé.

**Type** : Cas Passant

#### Étapes

1. Envoyer un premier ordre avec `order_id = "ORDER_DOUBLON_001"` → noter la réponse
2. Renvoyer exactement le même body sans modifier l'`order_id`

#### Résultats attendus

- rejet : code 4xx et message d'erreur de doublon

---

## 17.01.CNP — Injection SQL et failles de sécurité

> **Objectif** : Vérifier que l'API résiste aux tentatives d'injection et d'exploitation.

**Type** : Cas Non Passant

#### Jeux de données à tester (dans les champs texte)

| Vecteur | Exemple |
|---|---|
| Injection SQL | `"'; DROP TABLE orders; --"` |
| Injection JSON | `"{\"malicious\": true}"` |
| Caractères de contrôle | `"\u0000\u001f"` |
| Payload XSS | `"<script>alert(1)</script>"` |

#### Résultats attendus

- [ ] Statut HTTP : **200** (données échappées) ou **4xx** (rejet)
- [ ] Aucun effet de bord côté base de données
- [ ] Les données ne sont pas exécutées

---

## 18.01.CNP — Vérification du timeout

> **Objectif** : Vérifier que l'API renvoie une erreur si le TPE ne répond pas dans les délais.

**Type** : Cas Non Passant

#### Prérequis

Simuler un TPE lent via WireMock ou en introduisant un délai artificiel dans le code.

#### Résultats attendus

- [ ] Statut HTTP : **504 Gateway Timeout** si le délai dépasse **10 secondes**
- [ ] Message d'erreur explicite

---

## 19.01.CNP — Bad Request

> **Objectif** : Vérifier le rejet de requêtes malformées.

**Type** : Cas Non Passant

#### Jeux de données à tester

| Scénario | Détail |
|---|---|
| JSON invalide | Body non parseable (accolade manquante, virgule en trop) |
| Enum invalide | `"transaction_type": "VIREMENT"` |
| Type de champ incorrect | `"amount": "cent"` (string au lieu de number) |
| Body vide | `{}` |

#### Résultats attendus

- [ ] Statut HTTP : **400 Bad Request**
- [ ] Message d'erreur décrivant le champ ou la valeur incriminée

---

## 20.01.CNP — Bad Gateway

> **Objectif** : Vérifier le comportement de l'API lorsque le TPE est inaccessible.

**Type** : Cas Non Passant

#### Cas de figure à couvrir

- TPE éteint
- TPE sans accès Internet
- TPE non connecté au serveur
- TPE déconnecté en cours de communication

#### Résultats attendus

- [ ] Statut HTTP : **502 Bad Gateway**
- [ ] Message d'erreur attendu

---

## 21.01.CNP — Application HiPay down

> **Objectif** : Vérifier le comportement lorsque le service HiPay est indisponible.

**Type** : Cas Non Passant

#### Résultats attendus

- [ ] Statut HTTP : **500 Internal Server Error**
- [ ] Message d'erreur générique — aucune information interne exposée

---

## 22.01.CNP — Invalid credential / autorisation manquante

> **Objectif** : Vérifier que l'authentification est obligatoire et que les credentials invalides sont rejetés.

**Type** : Cas Non Passant

#### Jeux de données à tester

| Scénario | Header `Authorization` | Résultat attendu |
|---|---|---|
| Header absent | _(absent)_ | 401 — `"Invalid authorization header"` |
| Credentials invalides | `Basic <base64(wronglogin:wrongpassword)>` | 401 — `"invalid credentials"` |
| Token malformé | `Basic NOTBASE64!!!` | 401 — `"Invalid authorization header" |

#### Résultats attendus (pour chaque cas)

- [ ] Statut HTTP : **401 Unauthorized**
- [ ] Aucun ordre créé en base
