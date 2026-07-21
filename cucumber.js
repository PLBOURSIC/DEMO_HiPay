const common = {
  require: [
    'features/support/**/*.js',
    'features/step_definitions/**/*.js',
    // support-scripts/ est exclu : contient des utilitaires non-Cucumber
  ],
  format: ['progress'],
};

module.exports = { default: common };
