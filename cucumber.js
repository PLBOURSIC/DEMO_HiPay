const common = {
  require: [
    //'features/support/**/*.js',
    // Chargé explicitement car support-scripts contient aussi des utilitaires non-Cucumber
    'features/support-scripts/parameter_types.js',
    'features/step_definitions/**/*.js',
  ],
  format: ['progress'],
};

module.exports = { default: common };
