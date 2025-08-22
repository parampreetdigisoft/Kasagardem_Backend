const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });

module.exports = {
  mongodb: {
    url: process.env.MONGODB_URI,
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
