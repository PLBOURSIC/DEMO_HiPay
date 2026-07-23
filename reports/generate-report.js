const reporter = require('cucumber-html-reporter');
const path = require('path');

const reportPath = path.resolve(__dirname, 'cucumber-report.html');
const targetEnv = process.env.TARGET_ENV || 'LOCAL';
const targetMode = process.env.TARGET_MODE || 'manual';
const executionHost = process.env.GITHUB_ACTIONS ? 'GitHub Actions' : 'Local workstation';

const options = {
  theme: 'bootstrap',                        // Thème du rapport (bootstrap, foundation, simple)
  jsonFile: 'reports/cucumber.json',         // Fichier JSON généré par CucumberJS
  output: 'reports/cucumber-report.html',    // Fichier HTML de sortie
  reportSuiteAsScenarios: true,
  scenarioTimestamp: true,
  launchReport: !process.env.CI,             // N'ouvre pas le navigateur en CI
  metadata: {
    'App Version': '1.0.0',
    'Test Environment': targetEnv,
    'Execution Mode': targetMode,
    'Browser': 'N/A',
    'Platform': process.platform,
    'Executed': executionHost
  }
};

reporter.generate(options);

console.log(`\n📊 Rapport HTML généré : ${reportPath.replace(/\\/g, '/')}`);