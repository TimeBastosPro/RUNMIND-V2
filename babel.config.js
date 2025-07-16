module.exports = function(api) {
    api.cache(true);
    return {
      presets: ['babel-preset-expo'],
      plugins: [
        // Adicione esta linha. É fundamental que seja o último plugin.
        'react-native-reanimated/plugin',
      ],
    };
  };