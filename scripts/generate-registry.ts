import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import { assertPluginManifest, buildOfficialDefaultsProfile, buildRegistryIndex } from "../src/validation";
import type { OfficialDefaultsProfile, PluginManifest } from "../src/types";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const registryDirectory = resolve(root, "registry");
const outputPath = resolve(root, "dist/registry.json");
const defaultsInputPath = resolve(root, "profiles/official-defaults.json");
const defaultsOutputPath = resolve(root, "dist/official-defaults.json");
const check = process.argv.includes("--check");
const schema = JSON.parse(await readFile(resolve(root, "schema/plugin-manifest.schema.json"), "utf8"));
const defaultsSchema = JSON.parse(await readFile(resolve(root, "schema/official-defaults.schema.json"), "utf8"));
const ajv = new Ajv2020({ allErrors: true, strict: true });
addFormats(ajv);
const validateSchema = ajv.compile(schema);
const validateDefaultsSchema = ajv.compile(defaultsSchema);

const files = (await readdir(registryDirectory)).filter((file) => file.endsWith(".json")).sort();
if (files.length === 0) throw new Error("Registry contains no plugin manifests");

const manifests: PluginManifest[] = [];
for (const file of files) {
  const value: unknown = JSON.parse(await readFile(resolve(registryDirectory, file), "utf8"));
  if (!validateSchema(value)) {
    const details = (validateSchema.errors ?? []).map((error) => `${error.instancePath || "/"} ${error.message}`).join("\n");
    throw new Error(`${file} does not match plugin-manifest.schema.json:\n${details}`);
  }
  try { assertPluginManifest(value); } catch (error) {
    throw new Error(`${file}:\n${error instanceof Error ? error.message : String(error)}`);
  }
  if (`${value.id}.json` !== file) throw new Error(`${file}: filename must match plugin id "${value.id}.json"`);
  manifests.push(value);
}

const output = `${JSON.stringify(buildRegistryIndex(manifests), null, 2)}\n`;
const defaultsValue: unknown = JSON.parse(await readFile(defaultsInputPath, "utf8"));
if (!validateDefaultsSchema(defaultsValue)) {
  const details = (validateDefaultsSchema.errors ?? []).map((error) => `${error.instancePath || "/"} ${error.message}`).join("\n");
  throw new Error(`official-defaults.json does not match official-defaults.schema.json:\n${details}`);
}
const defaultsOutput = `${JSON.stringify(buildOfficialDefaultsProfile(defaultsValue as OfficialDefaultsProfile, manifests), null, 2)}\n`;
if (check) {
  let existing = "";
  let existingDefaults = "";
  try { existing = await readFile(outputPath, "utf8"); } catch { /* handled below */ }
  try { existingDefaults = await readFile(defaultsOutputPath, "utf8"); } catch { /* handled below */ }
  if (existing !== output) throw new Error("dist/registry.json is stale; run npm run registry:generate");
  if (existingDefaults !== defaultsOutput) throw new Error("dist/official-defaults.json is stale; run npm run registry:generate");
  console.log(`Validated ${manifests.length} plugin manifests, registry and official defaults`);
} else {
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, output);
  await writeFile(defaultsOutputPath, defaultsOutput);
  console.log(`Generated registry and official defaults from ${manifests.length} plugin manifests`);
}
