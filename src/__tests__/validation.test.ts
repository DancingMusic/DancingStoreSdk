import { describe, expect, it } from "vitest";
import { buildRegistryIndex, validatePluginManifest } from "../validation";
import type { PluginManifest } from "../types";

const manifest = (id = "example-plugin"): PluginManifest => ({
  schemaVersion: "1", id, name: "Example", summary: "Example visual plugin", version: "1.2.3",
  publisher: { name: "Example", url: "https://example.com" },
  repository: "https://github.com/example/plugin",
  license: { name: "MIT", url: "https://example.com/license", commercialUse: true },
  compatibility: { protocolPackage: "@dancingmusic/plugin-sdk", protocolVersion: "^1.1.0" },
  distribution: { url: "https://cdn.example.com/example-plugin@1.2.3/index.js", format: "esm" },
  capabilities: ["audio-reactive"], permissions: [], tags: ["example"], status: "published",
  submittedAt: "2026-01-01T00:00:00Z", updatedAt: "2026-01-02T00:00:00Z",
});

describe("plugin manifest validation", () => {
  it("accepts a valid manifest", () => expect(validatePluginManifest(manifest())).toEqual({ valid: true, issues: [] }));
  it("rejects a floating distribution branch", () => {
    const value = manifest(); value.distribution.url = "https://cdn.jsdelivr.net/gh/example/plugin@main/index.js";
    expect(validatePluginManifest(value).issues.some((entry) => entry.path === "$.distribution.url")).toBe(true);
  });
  it("rejects unknown permissions", () => {
    const value = manifest() as unknown as { permissions: string[] }; value.permissions = ["credentials"];
    expect(validatePluginManifest(value).valid).toBe(false);
  });
  it("sorts output and derives a deterministic timestamp", () => {
    const index = buildRegistryIndex([manifest("z-plugin"), manifest("a-plugin")]);
    expect(index.plugins.map(({ id }) => id)).toEqual(["a-plugin", "z-plugin"]);
    expect(index.generatedAt).toBe("2026-01-02T00:00:00Z");
  });
  it("rejects duplicate plugin ids", () => expect(() => buildRegistryIndex([manifest(), manifest()])).toThrow("Duplicate plugin id"));
});
