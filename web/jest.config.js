const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, ".env.local") });
require("dotenv").config({ path: path.resolve(__dirname, ".env") });

/** @type {import('jest').Config} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/src"],
  testPathIgnorePatterns: [
    "/node_modules/",
    "\\.integration\\.test\\.ts$",
  ],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  transform: {
    "^.+\\.tsx?$": ["ts-jest", { tsconfig: "tsconfig.json" }],
  },
  collectCoverageFrom: [
    "src/app/api/**/*.{ts,tsx}",
    "src/lib/**/*.{ts,tsx}",
    "!src/**/*.d.ts",
    "!src/**/__tests__/**",
  ],
  coverageThreshold: {
    global: {
      statements: 7,
      branches: 5,
      functions: 7,
      lines: 8,
    },
    "./src/app/api/lessons/generate/route.ts": {
      statements: 95,
      branches: 90,
      lines: 100,
    },
    "./src/app/api/standards/route.ts": {
      statements: 95,
      branches: 75,
      lines: 100,
    },
    "./src/app/api/standards/search/route.ts": {
      statements: 95,
      branches: 80,
      lines: 100,
    },
    "./src/lib/lessonQuota.ts": {
      statements: 100,
      branches: 100,
      functions: 100,
      lines: 100,
    },
    "./src/lib/ownership.ts": {
      statements: 100,
      branches: 100,
      functions: 100,
      lines: 100,
    },
  },
};
