export default scenarios();

function scenarios() {
  return {
    scenarios: [
      emberScenario('~6.4.0'),
      emberScenario('latest'),
      emberScenario('beta'),
      emberScenario('alpha'),
    ],
  };
}

function emberScenario(tag) {
  return {
    name: `ember-${tag}`,
    npm: {
      devDependencies: {
        'ember-source': `npm:ember-source@${tag}`,
      },
    },
  };
}
