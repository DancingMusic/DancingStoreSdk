export const PLUGIN_MANIFEST_SCHEMA_VERSION = "1" as const;
export const PLUGIN_REGISTRY_SCHEMA_VERSION = "1" as const;

export type PluginCapability =
  | "audio-reactive"
  | "cover-art"
  | "lyrics"
  | "playlist"
  | "host-actions"
  | "pointer-interaction"
  | "settings";

export type PluginPermission =
  | "host-actions:playback"
  | "host-actions:navigation"
  | "network"
  | "storage";

export interface PluginPublisher {
  name: string;
  url: string;
}

export interface PluginLicense {
  name: string;
  url: string;
  commercialUse: boolean;
}

export interface PluginCompatibility {
  protocolPackage: "@dancingmusic/plugin-sdk";
  protocolVersion: string;
  hostVersion?: string;
}

export interface PluginDistribution {
  url: string;
  format: "esm";
  integrity?: string;
}

export interface PluginManifest {
  $schema?: string;
  schemaVersion: typeof PLUGIN_MANIFEST_SCHEMA_VERSION;
  id: string;
  name: string;
  summary: string;
  version: string;
  publisher: PluginPublisher;
  repository: string;
  license: PluginLicense;
  compatibility: PluginCompatibility;
  distribution: PluginDistribution;
  capabilities: PluginCapability[];
  permissions: PluginPermission[];
  tags: string[];
  status: "published" | "deprecated" | "withdrawn";
  submittedAt: string;
  updatedAt: string;
}

export interface PluginRegistryIndex {
  schemaVersion: typeof PLUGIN_REGISTRY_SCHEMA_VERSION;
  generatedAt: string;
  plugins: PluginManifest[];
}

export interface PluginRegistryQuery {
  keyword?: string;
  tag?: string;
  capability?: PluginCapability;
  status?: PluginManifest["status"];
}

export interface DancingStoreClientOptions {
  registryUrl: string;
  fetch?: typeof globalThis.fetch;
}

export interface ManifestValidationIssue {
  path: string;
  message: string;
}

export interface ManifestValidationResult {
  valid: boolean;
  issues: ManifestValidationIssue[];
}
