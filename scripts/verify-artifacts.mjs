import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

export const MAX_ARTIFACT_BYTES = 10 * 1024 * 1024;

export async function downloadBounded(url, fetchImpl = globalThis.fetch, maxBytes = MAX_ARTIFACT_BYTES) {
  const response = await fetchImpl(url, {
    signal: AbortSignal.timeout(20_000),
    redirect: "error",
    headers: { Accept: "text/javascript,application/javascript,application/ecmascript,text/plain;q=0.8" },
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const declared = Number(response.headers.get("content-length") || 0);
  if (Number.isFinite(declared) && declared > maxBytes) throw new Error(`artifact exceeds ${maxBytes} bytes`);
  if (!response.body) return Buffer.alloc(0);

  const chunks = [];
  let total = 0;
  for await (const chunk of response.body) {
    total += chunk.byteLength;
    if (total > maxBytes) throw new Error(`artifact exceeds ${maxBytes} bytes`);
    chunks.push(Buffer.from(chunk));
  }
  return Buffer.concat(chunks, total);
}

export async function verifyRegistryArtifacts(registry, options = {}) {
  if (!Array.isArray(registry?.plugins)) throw new Error("generated registry has no plugins array");
  const fetchImpl = options.fetch ?? globalThis.fetch;
  const maxBytes = options.maxBytes ?? MAX_ARTIFACT_BYTES;
  const onVerified = options.onVerified ?? (() => {});
  let verified = 0;

  for (const plugin of registry.plugins.filter((entry) => entry.status === "published")) {
    const expected = plugin.distribution?.integrity;
    if (typeof expected !== "string" || !/^sha256-[A-Za-z0-9+/]{43}=$/.test(expected)) {
      throw new Error(`${plugin.id}: invalid or missing SHA-256 SRI`);
    }
    const urls = [plugin.distribution.url, ...(plugin.distribution.mirrors ?? []).map((mirror) => mirror.url)];
    for (const url of urls) {
      const bytes = await downloadBounded(url, fetchImpl, maxBytes);
      const actual = `sha256-${createHash("sha256").update(bytes).digest("base64")}`;
      if (actual !== expected) throw new Error(`${plugin.id}: integrity mismatch for ${url}`);
      onVerified(plugin.id, url);
      verified += 1;
    }
  }
  return verified;
}

async function main() {
  const registry = JSON.parse(await readFile(new URL("../dist/registry.json", import.meta.url), "utf8"));
  const verified = await verifyRegistryArtifacts(registry, {
    onVerified: (id, url) => process.stdout.write(`verified ${id} ${url}\n`),
  });
  process.stdout.write(`verified ${verified} published artifact URL(s)\n`);
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  await main();
}
