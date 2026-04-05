const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, ".env.local") });
require("dotenv").config({ path: path.resolve(__dirname, ".env") });

/** @type {import('jest').Config} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/src"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  transform: {
    "^.+\\.tsx?$": ["ts-jest", { tsconfig: "tsconfig.json" }],
  },
};
