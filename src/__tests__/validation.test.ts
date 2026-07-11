import { describe, expect, it } from "vitest";
import { buildOfficialDefaultsProfile, buildRegistryIndex, validatePluginManifest } from "../validation";
import type { OfficialDefaultsProfile, PluginManifest } from "../types";

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
  it("accepts pinned regional mirrors and release metadata", () => {
    const value = manifest();
    value.distribution.integrity = "sha256-YWJj";
    value.distribution.mirrors = [
      { region: "global", url: "https://global.example.com/example-plugin@1.2.3/index.js" },
      { region: "china", url: "https://china.example.com/example-plugin@1.2.3/index.js" },
    ];
    value.releaseNotesUrl = "https://example.com/releases/1.2.3";
    value.publishedAt = "2026-01-01T12:00:00Z";
    expect(validatePluginManifest(value)).toEqual({ valid: true, issues: [] });
  });
  it("requires integrity and unique regions for mirrors", () => {
    const value = manifest();
    value.distribution.mirrors = [
      { region: "china", url: "https://one.example.com/example-plugin@1.2.3/index.js" },
      { region: "china", url: "https://two.example.com/example-plugin@1.2.3/index.js" },
    ];
    const paths = validatePluginManifest(value).issues.map((entry) => entry.path);
    expect(paths).toContain("$.distribution.integrity");
    expect(paths).toContain("$.distribution.mirrors[1].region");
  });
  it("rejects a floating distribution branch", () => {
    const value = manifest(); value.distribution.url = "https://cdn.jsdelivr.net/gh/example/plugin@main/index.js";
    expect(validatePluginManifest(value).issues.some((entry) => entry.path === "$.distribution.url")).toBe(true);
  });
  it("rejects a floating mirror branch", () => {
    const value = manifest();
    value.distribution.integrity = "sha256-YWJj";
    value.distribution.mirrors = [{ region: "global", url: "https://cdn.example.com/plugin@main/index.js" }];
    expect(validatePluginManifest(value).issues.some((entry) => entry.path === "$.distribution.mirrors[0].url")).toBe(true);
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

describe("official defaults profile", () => {
  const profile = (): OfficialDefaultsProfile => ({
    schemaVersion: "1", id: "official-defaults", channel: "stable", revision: "1.0.0",
    defaultPluginId: "a-plugin", updatedAt: "2026-07-12T00:00:00Z",
    plugins: [
      { id: "z-plugin", version: "1.2.3", order: 10, installMode: "recommended", updatePolicy: "notify" },
      { id: "a-plugin", version: "1.2.3", order: 0, installMode: "preinstalled", updatePolicy: "notify" },
    ],
  });

  it("validates references and sorts by explicit order", () => {
    expect(buildOfficialDefaultsProfile(profile(), [manifest("a-plugin"), manifest("z-plugin")]).plugins.map(({ id }) => id))
      .toEqual(["a-plugin", "z-plugin"]);
  });

  it("rejects a version that does not match the registry", () => {
    const value = profile(); value.plugins[0].version = "2.0.0";
    expect(() => buildOfficialDefaultsProfile(value, [manifest("a-plugin"), manifest("z-plugin")])).toThrow("expects 2.0.0");
  });

  it("rejects an unregistered default", () => {
    const value = profile(); value.defaultPluginId = "missing-plugin";
    expect(() => buildOfficialDefaultsProfile(value, [manifest("a-plugin"), manifest("z-plugin")])).toThrow("defaultPluginId");
  });
});
