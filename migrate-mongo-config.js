const config = require("./src/core/config/env");

module.exports = {
  mongodb: {
    url: config.MONGODB_URI,
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    },
  },
  migrationsDir: "migrations",
  changelogCollectionName: "changelog",
  migrationFileExtension: ".js",
  useFileHash: false,
  moduleSystem: "commonjs",
};
