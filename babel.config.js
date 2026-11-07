module.exports = (api) => {
  api.cache(true);

  return {
    presets: ["babel-preset-expo"],
    // Unistyles must run before React Compiler, which babel-preset-expo adds:
    // Babel runs plugins before presets. Every file under src/ is processed.
    plugins: [["react-native-unistyles/plugin", { root: "src" }]],
  };
};
