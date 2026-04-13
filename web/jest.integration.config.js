const base = require("./jest.config");

/** @type {import('jest').Config} */
module.exports = {
  ...base,
  testPathIgnorePatterns: ["/node_modules/"],
  collectCoverage: false,
};
