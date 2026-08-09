// This is the Babel configuration file for the Expo project,
// which specifies the presets and plugins to be used by Babel for transpiling the JavaScript code
module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
  };
};
