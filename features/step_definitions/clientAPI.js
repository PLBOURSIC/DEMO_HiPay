const { API_CREDENTIAL, BASE_API_URL } = require('../../environment/Connexion_param.js');

// endpoint métier de création d'ordre de paiement
const ORDER_ENDPOINT = '/v1/connector/order';

class HiPayClient {
  constructor(baseUrl = BASE_API_URL, token = API_CREDENTIAL()) {
    this.baseUrl = baseUrl;
    this.token = token;
  }

  // ça devient complexe ici, création de l'appel POST qui peut recevoir des options, headers et permet d'exporter le curl à imprimer dans la console et le rapport HTML
  // endpoint soumis en option, exemple const ORDER_ENDPOINT = '/v1/connector/order';
 
  async _request(endpoint, options = {}) {
    // withAuthorization / tokenOverride servent uniquement au scénario KO (header absent ou credentials invalides)
    const { withAuthorization = true, tokenOverride, headers: extraHeaders = {}, ...fetchOptions } = options;

    // header construit à chaque appel, auquel on peut ajouter dans l'appel de la fonction _request des extraHeader 
    const headers = {
      'Content-Type': 'application/json',
      accept: 'application/json',
      ...extraHeaders
    };

    // si withAuthorization est true, on ajoute le header Authorization avec le token par défaut (indiqué dans les secret du projet) 
    // ou celui passé en paramètre = tokenOverride
    if (withAuthorization) {
      headers['Authorization'] = `Basic ${tokenOverride || this.token}`;
    }

    // création de l'url complète pour l'appel fetch et récupération de la réponse et du body JSON
    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, { ...fetchOptions, headers });
    const body = await response.json().catch(() => null);

    return {
      statusCode: response.status,
      body,
      // curl affiché dans le rapport/logs, sans exposer les credentials, fetchOptions.method par défaut = POST, headers et body sont passés à la fonction _buildCurl pour construire le curl complet
      curlCmd: HiPayClient._buildCurl(fetchOptions.method || 'POST', url, headers, fetchOptions.body)
    };
  }

  // creation de la fonction pour définir le curlCmd, on lui passe en option le method, l'url, les headers et le body
  static _buildCurl(method, url, headers, body) {

    // pour cacher le token dans le curlCmd, on clone les headers et on remplace Authorization par 'Basic ***' si présent
    const safeHeaders = { ...headers };
    if (safeHeaders.Authorization) safeHeaders.Authorization = 'Basic ***';

    return [
      `curl -X ${method} "${url}"`,
      ...Object.entries(safeHeaders).map(([key, value]) => `  -H "${key}: ${value}"`),
      body ? `  -d '${body}'` : null
    ].filter(Boolean).join(' \\\n');
  }

  // ─── Logs console + attachements rapport HTML, appelés à la volée depuis les steps ───
  // world = le "this" du step (contexte Cucumber), nécessaire pour appeler world.attach(...)
  static report(world, { statusCode, body, curlCmd, orderId }) {
    console.log('\n── CURL ──────────────────────────────────────');
    console.log(curlCmd);
    console.log(`\n── ORDER_ID : ${orderId} ───────────────`);
    console.log(`\n── RESPONSE (${statusCode}) ─────────────`);
    console.log(JSON.stringify(body, null, 2));

    world.attach(`CURL envoyé :\n\n${curlCmd}`, 'text/plain');
    world.attach(`ORDER_ID créé : ${orderId}`, 'text/plain');
    world.attach(JSON.stringify(body, null, 2), 'application/json');
  }

  static reportError(world, { curlCmd, error }) {
    if (curlCmd) world.attach(`CURL envoyé :\n\n${curlCmd}`, 'text/plain');
    world.attach(`ERREUR : ${error.message}`, 'text/plain');
    console.error('Erreur :', error);
  }

  // ─── Méthodes métier explicites et réutilisables ───

  // exemple d'appel à l'API avec createOrder : const appel = await HiPayClient.createOrder(this.body, { withAuthorization: true });
  async createOrder(payload, options = {}) {
    return this._request(ORDER_ENDPOINT, {
      method: 'POST',
      body: JSON.stringify(payload),
      ...options
    });
  }
}

module.exports = HiPayClient;
