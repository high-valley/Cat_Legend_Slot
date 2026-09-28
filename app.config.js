// app.json holds the config; EXPO_BASE_URL lets the GitHub Pages build serve the web app from /<repo>/.
module.exports = ({ config }) => ({
  ...config,
  experiments: {
    ...config.experiments,
    ...(process.env.EXPO_BASE_URL ? { baseUrl: process.env.EXPO_BASE_URL } : {}),
  },
});
