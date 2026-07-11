import {
  PLUGIN_REGISTRY_SCHEMA_VERSION,
  type ManifestValidationIssue,
  type ManifestValidationResult,
  type PluginCapability,
  type PluginManifest,
  type PluginPermission,
  type PluginRegistryIndex,
  type OfficialDefaultsProfile,
} from "./types";

const capabilities = new Set<PluginCapability>([
  "audio-reactive", "cover-art", "lyrics", "playlist", "host-actions",
  "pointer-interaction", "settings",
]);
const permissions = new Set<PluginPermission>([
  "host-actions:playback", "host-actions:navigation", "network", "storage",
]);
const semver = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/;
const semverRange = /^(?:[~^]|>=?|<=?)?\s*(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z.-]+)?(?:\s+<(?:=)?\s*(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*))?$/;
const date = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/;
const id = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function httpsUrl(value: unknown): boolean {
  if (typeof value !== "string") return false;
  try { return new URL(value).protocol === "https:"; } catch { return false; }
}

export function validatePluginManifest(value: unknown): ManifestValidationResult {
  const issues: ManifestValidationIssue[] = [];
  const issue = (path: string, message: string) => issues.push({ path, message });
  if (!isRecord(value)) return { valid: false, issues: [{ path: "$", message: "must be an object" }] };

  const required = ["schemaVersion", "id", "name", "summary", "version", "publisher",
    "repository", "license", "compatibility", "distribution", "capabilities", "permissions",
    "tags", "status", "submittedAt", "updatedAt"];
  for (const field of required) if (!(field in value)) issue(`$.${field}`, "is required");
  const allowed = new Set(["$schema", ...required, "releaseNotesUrl", "publishedAt"]);
  for (const field of Object.keys(value)) if (!allowed.has(field)) issue(`$.${field}`, "is not allowed");
  if (value.schemaVersion !== "1") issue("$.schemaVersion", 'must equal "1"');
  if (value.$schema !== undefined && typeof value.$schema !== "string") issue("$.$schema", "must be a string");
  if (typeof value.id !== "string" || !id.test(value.id)) issue("$.id", "must be a lowercase kebab-case id");
  for (const field of ["name", "summary"] as const) {
    if (typeof value[field] !== "string" || !value[field].trim()) issue(`$.${field}`, "must be a non-empty string");
  }
  if (typeof value.summary === "string" && value.summary.length > 240) issue("$.summary", "must not exceed 240 characters");
  if (typeof value.version !== "string" || !semver.test(value.version)) issue("$.version", "must be SemVer");
  if (!httpsUrl(value.repository)) issue("$.repository", "must be an HTTPS URL");
  if (value.releaseNotesUrl !== undefined && !httpsUrl(value.releaseNotesUrl)) issue("$.releaseNotesUrl", "must be an HTTPS URL");
  if (value.publishedAt !== undefined && (typeof value.publishedAt !== "string" || !date.test(value.publishedAt) || Number.isNaN(Date.parse(value.publishedAt)))) issue("$.publishedAt", "must be an ISO 8601 UTC timestamp");

  if (!isRecord(value.publisher)) issue("$.publisher", "must be an object");
  else {
    for (const field of Object.keys(value.publisher)) if (!["name", "url"].includes(field)) issue(`$.publisher.${field}`, "is not allowed");
    if (typeof value.publisher.name !== "string" || !value.publisher.name.trim()) issue("$.publisher.name", "must be non-empty");
    if (!httpsUrl(value.publisher.url)) issue("$.publisher.url", "must be an HTTPS URL");
  }
  if (!isRecord(value.license)) issue("$.license", "must be an object");
  else {
    for (const field of Object.keys(value.license)) if (!["name", "url", "commercialUse"].includes(field)) issue(`$.license.${field}`, "is not allowed");
    if (typeof value.license.name !== "string" || !value.license.name.trim()) issue("$.license.name", "must be non-empty");
    if (!httpsUrl(value.license.url)) issue("$.license.url", "must be an HTTPS URL");
    if (typeof value.license.commercialUse !== "boolean") issue("$.license.commercialUse", "must be boolean");
  }
  if (!isRecord(value.compatibility)) issue("$.compatibility", "must be an object");
  else {
    for (const field of Object.keys(value.compatibility)) if (!["protocolPackage", "protocolVersion", "hostVersion"].includes(field)) issue(`$.compatibility.${field}`, "is not allowed");
    if (value.compatibility.protocolPackage !== "@dancingmusic/plugin-sdk") issue("$.compatibility.protocolPackage", "must identify the DancePlugin protocol package");
    if (typeof value.compatibility.protocolVersion !== "string" || !semverRange.test(value.compatibility.protocolVersion)) issue("$.compatibility.protocolVersion", "must be a supported SemVer range");
    if (value.compatibility.hostVersion !== undefined && (typeof value.compatibility.hostVersion !== "string" || !semverRange.test(value.compatibility.hostVersion))) issue("$.compatibility.hostVersion", "must be a supported SemVer range");
  }
  if (!isRecord(value.distribution)) issue("$.distribution", "must be an object");
  else {
    for (const field of Object.keys(value.distribution)) if (!["url", "format", "integrity", "mirrors"].includes(field)) issue(`$.distribution.${field}`, "is not allowed");
    if (!httpsUrl(value.distribution.url)) issue("$.distribution.url", "must be an HTTPS URL");
    if (value.distribution.format !== "esm") issue("$.distribution.format", 'must equal "esm"');
    if (typeof value.distribution.url === "string" && /@(main|master|head)(?:\/|$)/i.test(value.distribution.url)) issue("$.distribution.url", "must pin a tag or immutable commit, not a branch");
    if (typeof value.version === "string" && typeof value.distribution.url === "string" &&
      !value.distribution.url.includes(value.version) && !/[a-f0-9]{40}/i.test(value.distribution.url)) issue("$.distribution.url", "must contain the manifest version or a full commit hash");
    if (value.distribution.integrity !== undefined &&
      (typeof value.distribution.integrity !== "string" || !/^sha(256|384|512)-[A-Za-z0-9+/]+={0,2}$/.test(value.distribution.integrity))) issue("$.distribution.integrity", "must be an SRI sha256/384/512 value");
    if (value.distribution.mirrors !== undefined) {
      if (!Array.isArray(value.distribution.mirrors) || value.distribution.mirrors.length === 0 || value.distribution.mirrors.length > 2) {
        issue("$.distribution.mirrors", "must contain one or two regional mirrors");
      } else {
        const regions = new Set<string>();
        const urls = new Set<string>();
        value.distribution.mirrors.forEach((mirror, index) => {
          const path = `$.distribution.mirrors[${index}]`;
          if (!isRecord(mirror)) return issue(path, "must be an object");
          for (const field of Object.keys(mirror)) if (!["region", "url"].includes(field)) issue(`${path}.${field}`, "is not allowed");
          if (mirror.region !== "global" && mirror.region !== "china") issue(`${path}.region`, "must equal global or china");
          else if (regions.has(mirror.region)) issue(`${path}.region`, "must not duplicate a region");
          else regions.add(mirror.region);
          const mirrorUrl = mirror.url;
          if (typeof mirrorUrl !== "string" || !httpsUrl(mirrorUrl)) issue(`${path}.url`, "must be an HTTPS URL");
          else {
            if (urls.has(mirrorUrl)) issue(`${path}.url`, "must not duplicate an artifact URL");
            urls.add(mirrorUrl);
            if (/@(main|master|head)(?:\/|$)/i.test(mirrorUrl)) issue(`${path}.url`, "must pin a tag or immutable commit, not a branch");
            if (typeof value.version === "string" && !mirrorUrl.includes(value.version) && !/[a-f0-9]{40}/i.test(mirrorUrl)) issue(`${path}.url`, "must contain the manifest version or a full commit hash");
          }
        });
      }
      if (value.distribution.integrity === undefined) issue("$.distribution.integrity", "is required when mirrors are declared");
    }
  }

  const checkEnumArray = <T extends string>(field: "capabilities" | "permissions", allowed: Set<T>) => {
    const list = value[field];
    if (!Array.isArray(list)) return issue(`$.${field}`, "must be an array");
    if (new Set(list).size !== list.length) issue(`$.${field}`, "must not contain duplicates");
    list.forEach((entry, index) => { if (typeof entry !== "string" || !allowed.has(entry as T)) issue(`$.${field}[${index}]`, "contains an unsupported value"); });
  };
  checkEnumArray("capabilities", capabilities);
  checkEnumArray("permissions", permissions);
  if (!Array.isArray(value.tags) || value.tags.some((tag) => typeof tag !== "string" || !id.test(tag))) issue("$.tags", "must contain lowercase kebab-case tags");
  else if (new Set(value.tags).size !== value.tags.length) issue("$.tags", "must not contain duplicates");
  if (!new Set(["published", "deprecated", "withdrawn"]).has(value.status as string)) issue("$.status", "has an unsupported value");
  for (const field of ["submittedAt", "updatedAt"] as const) if (typeof value[field] !== "string" || !date.test(value[field]) || Number.isNaN(Date.parse(value[field]))) issue(`$.${field}`, "must be an ISO 8601 UTC timestamp");
  if (typeof value.submittedAt === "string" && typeof value.updatedAt === "string" && value.updatedAt < value.submittedAt) issue("$.updatedAt", "must not precede submittedAt");
  return { valid: issues.length === 0, issues };
}

export function assertPluginManifest(value: unknown): asserts value is PluginManifest {
  const result = validatePluginManifest(value);
  if (!result.valid) throw new Error(result.issues.map(({ path, message }) => `${path} ${message}`).join("\n"));
}

export function buildRegistryIndex(manifests: readonly PluginManifest[]): PluginRegistryIndex {
  const ids = new Set<string>();
  const plugins = manifests.map((manifest) => {
    assertPluginManifest(manifest);
    if (ids.has(manifest.id)) throw new Error(`Duplicate plugin id: ${manifest.id}`);
    ids.add(manifest.id);
    return manifest;
  }).sort((a, b) => a.id.localeCompare(b.id));
  return {
    schemaVersion: PLUGIN_REGISTRY_SCHEMA_VERSION,
    generatedAt: plugins.reduce((latest, plugin) => plugin.updatedAt > latest ? plugin.updatedAt : latest, "1970-01-01T00:00:00Z"),
    plugins,
  };
}

export function assertOfficialDefaultsProfile(
  value: unknown,
  manifests: readonly PluginManifest[],
): asserts value is OfficialDefaultsProfile {
  if (!isRecord(value) || !Array.isArray(value.plugins)) {
    throw new Error("Official defaults profile must be an object with plugins");
  }
  const byId = new Map(manifests.map((manifest) => [manifest.id, manifest]));
  const ids = new Set<string>();
  const orders = new Set<number>();
  for (const [index, entry] of value.plugins.entries()) {
    if (!isRecord(entry) || typeof entry.id !== "string" || typeof entry.version !== "string") {
      throw new Error(`Official defaults plugin at index ${index} is invalid`);
    }
    if (ids.has(entry.id)) throw new Error(`Duplicate official default plugin id: ${entry.id}`);
    ids.add(entry.id);
    if (typeof entry.order !== "number" || orders.has(entry.order)) {
      throw new Error(`Duplicate or invalid official default order for ${entry.id}`);
    }
    orders.add(entry.order);
    const manifest = byId.get(entry.id);
    if (!manifest) throw new Error(`Official default plugin is not registered: ${entry.id}`);
    if (manifest.status !== "published") throw new Error(`Official default plugin is not published: ${entry.id}`);
    if (manifest.version !== entry.version) {
      throw new Error(`Official default ${entry.id} expects ${entry.version}, registry has ${manifest.version}`);
    }
  }
  if (typeof value.defaultPluginId !== "string" || !ids.has(value.defaultPluginId)) {
    throw new Error("Official defaultPluginId must reference a profile plugin");
  }
}

export function buildOfficialDefaultsProfile(
  profile: OfficialDefaultsProfile,
  manifests: readonly PluginManifest[],
): OfficialDefaultsProfile {
  assertOfficialDefaultsProfile(profile, manifests);
  return { ...profile, plugins: [...profile.plugins].sort((a, b) => a.order - b.order) };
}
