import { describe, expect, it, vi } from "vitest";
import { DancingStoreClient } from "../client";
import type { PluginManifest } from "../types";

const plugin: PluginManifest = {
  schemaVersion: "1", id: "example-plugin", runtimeId: "example", name: "Example", summary: "Terrain visual", version: "1.0.0",
  publisher: { name: "Example", url: "https://example.com" }, repository: "https://github.com/example/plugin",
  license: { name: "MIT", url: "https://example.com/license", commercialUse: true },
  compatibility: { protocolPackage: "@dancingmusic/plugin-sdk", protocolVersion: "^1.0.0" },
  distribution: { url: "https://cdn.example.com/plugin@1.0.0/index.js", format: "esm", integrity: `sha256-${"A".repeat(43)}=` },
  capabilities: ["audio-reactive"], permissions: [], tags: ["terrain"], status: "published",
  submittedAt: "2026-01-01T00:00:00Z", updatedAt: "2026-01-01T00:00:00Z",
};

describe("DancingStoreClient", () => {
  it("loads once, queries and gets plugin records", async () => {
    const fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ schemaVersion: "1", generatedAt: plugin.updatedAt, plugins: [plugin] }) });
    const client = new DancingStoreClient({ registryUrl: "https://example.com/registry.json", fetch: fetch as typeof globalThis.fetch });
    expect(await client.list({ keyword: "terrain", capability: "audio-reactive" })).toEqual([plugin]);
    expect(await client.get("example-plugin")).toEqual(plugin);
    expect(fetch).toHaveBeenCalledOnce();
  });
  it("reports HTTP failures", async () => {
    const fetch = vi.fn().mockResolvedValue({ ok: false, status: 503 });
    const client = new DancingStoreClient({ registryUrl: "https://example.com/registry.json", fetch: fetch as typeof globalThis.fetch });
    await expect(client.list()).rejects.toThrow("HTTP 503");
  });
});
