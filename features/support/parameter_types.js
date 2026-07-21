const { defineParameterType } = require('@cucumber/cucumber');

// Définit {boolean} comme type de paramètre reconnu par Cucumber JS
// Permet d'écrire : ...présente true  ou  ...présente false dans les .feature
defineParameterType({
  name: 'boolean',
  regexp: /true|false/,
  transformer: (s) => s === 'true',
});
