export const PLUGIN_MANIFEST_SCHEMA_VERSION = "1" as const;
export const PLUGIN_REGISTRY_SCHEMA_VERSION = "1" as const;
export const OFFICIAL_DEFAULTS_SCHEMA_VERSION = "1" as const;

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
  integrity: string;
  mirrors?: PluginDistributionMirror[];
}

export interface PluginDistributionMirror {
  region: "global" | "china";
  url: string;
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
  releaseNotesUrl?: string;
  publishedAt?: string;
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

export interface OfficialDefaultPlugin {
  id: string;
  version: string;
  order: number;
  installMode: "preinstalled" | "recommended";
  updatePolicy: "notify";
}

export interface OfficialDefaultsProfile {
  $schema?: string;
  schemaVersion: typeof OFFICIAL_DEFAULTS_SCHEMA_VERSION;
  id: "official-defaults";
  channel: "stable" | "beta";
  revision: string;
  defaultPluginId: string;
  plugins: OfficialDefaultPlugin[];
  updatedAt: string;
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
