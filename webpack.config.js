const Dotenv = require("dotenv-webpack");

module.exports = {
  // другие настройки Webpack
  plugins: [new Dotenv()],
  resolve: {
    fallback: {
      path: false, // если path не используется
      os: false, // если os не используется
      crypto: false, // если crypto не используется
    },
  },
};
