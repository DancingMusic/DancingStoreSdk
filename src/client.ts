import { assertPluginManifest, buildRegistryIndex } from "./validation";
import type {
  DancingStoreClientOptions,
  PluginManifest,
  PluginRegistryIndex,
  PluginRegistryQuery,
} from "./types";

export class DancingStoreClient {
  private readonly registryUrl: string;
  private readonly fetchImpl: typeof globalThis.fetch;
  private index: PluginRegistryIndex | null = null;

  constructor(options: DancingStoreClientOptions) {
    if (!options.registryUrl) throw new Error("registryUrl is required");
    this.registryUrl = options.registryUrl;
    this.fetchImpl = options.fetch ?? globalThis.fetch;
    if (!this.fetchImpl) throw new Error("A fetch implementation is required");
  }

  async refresh(): Promise<PluginRegistryIndex> {
    const response = await this.fetchImpl(this.registryUrl);
    if (!response.ok) {
      throw new Error(`Unable to load DancingStore registry: HTTP ${response.status}`);
    }

    const value = (await response.json()) as Partial<PluginRegistryIndex>;
    if (value.schemaVersion !== "1" || !Array.isArray(value.plugins)) {
      throw new Error("Invalid DancingStore registry index");
    }
    value.plugins.forEach((manifest) => assertPluginManifest(manifest));
    this.index = buildRegistryIndex(value.plugins);
    return this.index;
  }

  async list(query: PluginRegistryQuery = {}): Promise<PluginManifest[]> {
    const index = this.index ?? (await this.refresh());
    const keyword = query.keyword?.trim().toLowerCase();
    return index.plugins.filter((plugin) => {
      if (query.status && plugin.status !== query.status) return false;
      if (query.tag && !plugin.tags.includes(query.tag)) return false;
      if (query.capability && !plugin.capabilities.includes(query.capability)) return false;
      if (!keyword) return true;
      return [plugin.id, plugin.name, plugin.summary, ...plugin.tags]
        .join(" ")
        .toLowerCase()
        .includes(keyword);
    });
  }

  async get(pluginId: string): Promise<PluginManifest | null> {
    if (!pluginId) throw new Error("pluginId is required");
    const index = this.index ?? (await this.refresh());
    return index.plugins.find((plugin) => plugin.id === pluginId) ?? null;
  }

  get config() {
    return { registryUrl: this.registryUrl, loaded: this.index !== null };
  }
}
