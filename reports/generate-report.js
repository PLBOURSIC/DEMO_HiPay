const reporter = require('cucumber-html-reporter');
const path = require('path');

const reportPath = path.resolve(__dirname, 'cucumber-report.html');

const options = {
  theme: 'bootstrap',                        // Thème du rapport (bootstrap, foundation, simple)
  jsonFile: 'reports/cucumber.json',         // Fichier JSON généré par CucumberJS
  output: 'reports/cucumber-report.html',    // Fichier HTML de sortie
  reportSuiteAsScenarios: true,
  scenarioTimestamp: true,
  launchReport: !process.env.CI,             // N'ouvre pas le navigateur en CI
  metadata: {
    'App Version': '1.0.0',
    'Test Environment': 'RECETTE 1',
    'Browser': 'N/A',
    'Platform': 'Linux',
    'Executed': 'Runner GitHub'
  }
};

reporter.generate(options);

console.log(`\n📊 Rapport HTML généré : ${reportPath.replace(/\\/g, '/')}`);