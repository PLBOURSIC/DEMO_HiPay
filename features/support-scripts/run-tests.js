/**
 * utilisation d'un node script pour jouer les test car la commande 'true' pour forcer le rapport HTML n'est pas reconnue par Windows
 * --> il faut donc faire un script cross platform
 * Runner cross-platform : lance cucumber-js puis génère toujours le rapport,
 * même si des tests échouent (exit code non-zéro).
 * Usage : node scripts/run-tests.js [feature_path]
 */
const { spawnSync } = require('child_process');
const path = require('path');

const userArgs = process.argv.slice(2);
const hasFormatArg = userArgs.includes('--format') || userArgs.includes('-f');

const cucumberArgs = [
  'cucumber-js',
  ...userArgs,
  ...(hasFormatArg ? [] : ['--format', 'json:reports/cucumber.json'])
];

const result = spawnSync('npx', cucumberArgs, {
  stdio: 'inherit',
  shell: true,
  cwd: path.resolve(__dirname, '../..')
});

// Génère le rapport même si les tests ont échoué
require('../../reports/generate-report');

// Propage le code de sortie pour que la CI détecte les échecs
process.exit(result.status ?? 0);
