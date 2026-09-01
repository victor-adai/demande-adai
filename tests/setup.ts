import "@testing-library/jest-dom/vitest";

// jsdom logs a benign "Not implemented: navigation" error whenever a hash-only
// <a href="#..."> anchor is clicked (nav links, pack "#packs" chips, etc.).
// It doesn't affect assertions — filter only that exact message so real errors
// still surface.
const originalConsoleError = console.error;
console.error = (...args: unknown[]) => {
  const message = typeof args[0] === "string" ? args[0] : args[0] instanceof Error ? args[0].message : "";
  if (message.includes("Not implemented: navigation")) return;
  originalConsoleError(...args);
};
