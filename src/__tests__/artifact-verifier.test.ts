import { createHash } from "node:crypto";
import { describe, expect, it, vi } from "vitest";
// @ts-expect-error Release scripts intentionally remain plain Node ESM.
import { downloadBounded, verifyRegistryArtifacts } from "../../scripts/verify-artifacts.mjs";

const bytes = new TextEncoder().encode("export default {};");
const integrity = `sha256-${createHash("sha256").update(bytes).digest("base64")}`;

function registry(expected = integrity) {
  return {
    plugins: [
      {
        id: "published-plugin",
        status: "published",
        distribution: {
          url: "https://cdn.example.com/plugin@1.0.0/index.js",
          integrity: expected,
        },
      },
      {
        id: "withdrawn-plugin",
        status: "withdrawn",
        distribution: { url: "https://cdn.example.com/withdrawn@1.0.0/index.js" },
      },
    ],
  };
}

describe("artifact verifier", () => {
  it("verifies only published artifacts and forbids redirects", async () => {
    const fetch = vi.fn().mockResolvedValue(new Response(bytes, {
      status: 200,
      headers: { "content-length": String(bytes.byteLength) },
    }));
    await expect(verifyRegistryArtifacts(registry(), { fetch })).resolves.toBe(1);
    expect(fetch).toHaveBeenCalledOnce();
    expect(fetch.mock.calls[0][1]).toEqual(expect.objectContaining({ redirect: "error" }));
  });

  it("rejects declared and streamed artifacts over the bound", async () => {
    const declared = vi.fn().mockResolvedValue(new Response(bytes, {
      status: 200,
      headers: { "content-length": "20" },
    }));
    await expect(downloadBounded("https://example.com/plugin.js", declared, 10)).rejects.toThrow("exceeds 10 bytes");

    const streamed = vi.fn().mockResolvedValue(new Response(bytes, { status: 200 }));
    await expect(downloadBounded("https://example.com/plugin.js", streamed, 10)).rejects.toThrow("exceeds 10 bytes");
  });

  it("fails closed on an integrity mismatch", async () => {
    const fetch = vi.fn().mockResolvedValue(new Response(bytes, { status: 200 }));
    const wrong = `sha256-${"A".repeat(43)}=`;
    await expect(verifyRegistryArtifacts(registry(wrong), { fetch })).rejects.toThrow("integrity mismatch");
  });
});
