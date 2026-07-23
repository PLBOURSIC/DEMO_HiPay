# CI/CD — Pipeline GitHub Actions

Ce document décrit le fonctionnement du fichier [`.github/workflows/ci.yml`](../../../.github/workflows/ci.yml).

---

## Vue d'ensemble

```
┌─────────────────────────────────────────────────────────┐
│              Déclencheurs du workflow                   │
│  schedule (9h/jour) │ push/PR │ workflow_dispatch       │
└──────────────────────────────┬──────────────────────────┘
                               │
                    ┌──────────▼──────────┐
                    │   cucumber-tests    │  Job 1
                    │  ubuntu-latest      │
                    │                     │
                    │ 1. Checkout         │
                    │ 2. Setup Node 24    │
                    │ 3. npm ci           │
                    │ 4. Run tests        │
                    │ 5. Upload JSON (7j) │
                    │ 6. Upload HTML (30j)│
                    └──────────┬──────────┘
                               │ needs + if: always()
                    ┌──────────▼──────────┐
                    │   publish-report    │  Job 2
                    │  ubuntu-latest      │
                    │                     │
                    │ 1. Download HTML    │
                    │ 2. Résumé workflow  │
                    │ 3. Upload final     │
                    └─────────────────────┘
```

---

## Déclencheurs

Le workflow se déclenche sur **4 événements** :

### 1. Planification automatique — `schedule`

```yaml
schedule:
  - cron: '0 7 * * *'
```

Lance les tests **tous les jours à 9h00 (heure de Paris)**.  
`07:00 UTC` correspond à `09:00 UTC+2` (heure d'été française).

### 2. Push sur une branche — `push`

```yaml
push:
  branches: [main, develop]
```

Déclenché automatiquement à chaque commit poussé sur `main` ou `develop`.

### 3. Pull Request — `pull_request`

```yaml
pull_request:
  branches: [main]
```

Permet de valider les tests **avant** la fusion du code.

### 4. Déclenchement manuel — `workflow_dispatch`

Permet de lancer le workflow à la demande depuis l'onglet **Actions** de GitHub avec deux paramètres :

| Paramètre | Type | Défaut | Description |
|---|---|---|---|
| `env` | choice (`Recette1` / `Recette2`) | `Recette1` | Environnement cible — sélectionne automatiquement les credentials API et BDD correspondants |
| `feature` | string | _(vide)_ | Nom du fichier `.feature` à cibler (ex. : `cas_nominal_OK.feature`). Si vide : toutes les features sont jouées |

---

## Job 1 — `cucumber-tests`

S'exécute sur `ubuntu-latest`.

**Environnement cible :**

```yaml
env:
  TARGET_ENV: ${{ github.event.inputs.env || 'Recette1' }}
```

La variable `TARGET_ENV` est positionnée en début de job. Elle vaut la valeur choisie manuellement, ou `Recette1` par défaut pour tous les déclenchements automatiques.

### Étapes détaillées

#### Checkout du code

```yaml
uses: actions/checkout@v4
```

Clone le dépôt dans l'environnement d'exécution GitHub.

#### Setup Node.js

```yaml
uses: actions/setup-node@v4
with:
  node-version: '24'
  cache: 'npm'
```

Installe Node.js 24. Le cache `npm` est activé pour accélérer les exécutions suivantes en réutilisant le dossier `node_modules` si `package-lock.json` n'a pas changé.

#### Installation des dépendances

```yaml
run: npm ci
```

`npm ci` (contrairement à `npm install`) installe **exactement** les versions définies dans `package-lock.json`.  
Cela garantit la reproductibilité entre les environnements local et CI.

#### Lancement des tests

```yaml
run: |
  FEATURE="${{ github.event.inputs.feature }}"
  if [ -n "$FEATURE" ]; then
    node features/support-scripts/run-tests.js "features/$FEATURE"
  else
    npm test
  fi
```

Si une feature est spécifiée en paramètre (`workflow_dispatch`), seule cette feature est exécutée.  
Sinon, `npm test` joue toutes les features (`features/` entier).

Le runner `run-tests.js` est utilisé à la place de `cucumber-js` directement pour deux raisons :
1. Il génère le rapport HTML **même si des tests échouent** (exit code non-zéro)
2. Il propage ensuite le code de sortie pour que la CI détecte les échecs

#### Variables d'environnement injectées

```yaml
env:
  API_username:  ${{ env.TARGET_ENV == 'Recette2' && secrets.API_USERNAME_R2  || secrets.API_USERNAME }}
  API_password:  ${{ env.TARGET_ENV == 'Recette2' && secrets.API_PASSWORD_R2  || secrets.API_PASSWORD }}
  LOGIN_BDD:     ${{ env.TARGET_ENV == 'Recette2' && secrets.LOGIN_BDD_R2     || secrets.LOGIN_BDD }}
  PWS_BDD:       ${{ env.TARGET_ENV == 'Recette2' && secrets.PWS_BDD_R2       || secrets.PWS_BDD }}
  API_BASE_URL:  ${{ env.TARGET_ENV == 'Recette2' && secrets.API_BASE_URL_R2  || secrets.API_BASE_URL }}
  CI: true
```

Les variables sont sélectionnées dynamiquement selon `TARGET_ENV` :

| Variable | Recette1 | Recette2 |
|---|---|---|
| `API_username` | `secrets.API_USERNAME` | `secrets.API_USERNAME_R2` |
| `API_password` | `secrets.API_PASSWORD` | `secrets.API_PASSWORD_R2` |
| `LOGIN_BDD` | `secrets.LOGIN_BDD` | `secrets.LOGIN_BDD_R2` |
| `PWS_BDD` | `secrets.PWS_BDD` | `secrets.PWS_BDD_R2` |
| `API_BASE_URL` | `secrets.API_BASE_URL` | `secrets.API_BASE_URL_R2` |
| `CI` | `true` (fixe) | `true` (fixe) |

> Les secrets sont configurés dans **Settings > Secrets and variables > Actions** du dépôt GitHub.  
> Ils ne sont jamais visibles dans les logs ni dans le code.

#### Upload des artefacts

Deux artefacts sont uploadés après les tests, **même en cas d'échec** (`if: always()`) :

| Artefact | Fichier | Rétention |
|---|---|---|
| `cucumber-json-<run_number>` | `reports/cucumber.json` | 7 jours |
| `cucumber-report-<run_number>` | `reports/cucumber-report.html` | 30 jours |

Le JSON brut est utile pour une analyse programmatique des résultats.  
Le rapport HTML est l'artefact principal pour la lecture humaine.

---

## Job 2 — `publish-report`

S'exécute sur `ubuntu-latest`, **après** `cucumber-tests`.

**Condition d'exécution :**

```yaml
needs: cucumber-tests
if: always() && needs.cucumber-tests.result != 'skipped'
```

Ce job s'exécute **toujours** (même si `cucumber-tests` a échoué), sauf s'il a été ignoré (via `skip_tests=true`).

### Étapes détaillées

#### Téléchargement du rapport HTML

```yaml
uses: actions/download-artifact@v4
with:
  name: cucumber-report-<run_number>
  path: rapport/
```

Récupère le rapport HTML généré par le job 1.

#### Résumé du workflow (`GITHUB_STEP_SUMMARY`)

Publie un résumé dans l'onglet **Actions > Résumé** du workflow GitHub :

- Numéro du run
- Lien vers l'artefact du rapport HTML
- Statut global : ✅ tous les tests ont réussi / ❌ des tests ont échoué

Ce résumé est visible directement dans l'interface GitHub sans télécharger l'artefact.

#### Re-upload du rapport final

```yaml
name: rapport-final-<run_number>
path: rapport/cucumber-report.html
retention-days: 30
```

Publie une copie du rapport sous le nom `rapport-final-<run_number>` pour le distinguer de l'artefact intermédiaire.

---

## Configurer les secrets GitHub

Pour que le pipeline fonctionne, les secrets suivants doivent être créés dans **Settings > Secrets and variables > Actions** :

### Recette 1 (défaut)

| Nom du secret | Valeur |
|---|---|
| `API_USERNAME` | Login de l'API HiPay |
| `API_PASSWORD` | Mot de passe de l'API HiPay |
| `API_BASE_URL` | URL de base de l'API (ex. : `https://cloudrun-api-yugcnet4yq-ew.a.run.app`) |
| `LOGIN_BDD` | Utilisateur PostgreSQL |
| `PWS_BDD` | Mot de passe PostgreSQL |

### Recette 2

| Nom du secret | Valeur |
|---|---|
| `API_USERNAME_R2` | Login de l'API HiPay (Recette 2) |
| `API_PASSWORD_R2` | Mot de passe de l'API HiPay (Recette 2) |
| `API_BASE_URL_R2` | URL de base de l'API (Recette 2) |
| `LOGIN_BDD_R2` | Utilisateur PostgreSQL (Recette 2) |
| `PWS_BDD_R2` | Mot de passe PostgreSQL (Recette 2) |
