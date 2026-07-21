const { defineParameterType } = require('@cucumber/cucumber');

// Définit {boolean} comme type de paramètre reconnu par Cucumber JS. on va comparer (s) / s = true ou false avec 'true'
// donc le code pourra dire que la comparaispon est équivalente ou non (true ou false), c'est comme ça qu'on peut utiliser le boolean
// Permet d'écrire : ...présente true  ou  ...présente false dans les .feature
defineParameterType({
  name: 'boolean',
  regexp: /true|false/,
  transformer: (s) => s === 'true',
});
