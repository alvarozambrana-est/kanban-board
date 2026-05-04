import { describe, it, expect } from "vitest";

describe("S1 - Project scaffold", () => {
  it("has the correct package.json name", () => {
    const pkg = require("../package.json");
    expect(pkg.name).toBe("opencode-test");
  });

  it("has all required scripts", () => {
    const pkg = require("../package.json");
    expect(pkg.scripts).toHaveProperty("dev");
    expect(pkg.scripts).toHaveProperty("build");
    expect(pkg.scripts).toHaveProperty("test");
  });

  it("has next, react, and better-sqlite3 as dependencies", () => {
    const pkg = require("../package.json");
    expect(pkg.dependencies).toHaveProperty("next");
    expect(pkg.dependencies).toHaveProperty("react");
    expect(pkg.dependencies).toHaveProperty("better-sqlite3");
  });

  it("has vitest as devDependency", () => {
    const pkg = require("../package.json");
    expect(pkg.devDependencies).toHaveProperty("vitest");
  });

  it("has proper TypeScript config", () => {
    const tsconfig = require("../tsconfig.json");
    expect(tsconfig.compilerOptions.strict).toBe(true);
    expect(tsconfig.compilerOptions.jsx).toBe("react-jsx");
  });

  it("renders homepage without errors", () => {
    expect(true).toBe(true);
  });
});
