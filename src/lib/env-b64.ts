import { readWorkerEnv } from "@/lib/worker-env";

function decodeBase64Utf8(raw: string): string | undefined {
  try {
    return Buffer.from(raw, "base64").toString("utf8");
  } catch {
    return undefined;
  }
}

/** Plain env var, or base64 sibling (e.g. `AUTH_SECRET` / `AUTH_SECRET_B64`) from wrangler.jsonc. */
export function readWorkerEnvPlainOrB64(plainName: string, b64Name?: string): string | undefined {
  const plain = readWorkerEnv(plainName)?.trim();
  if (plain) return plain;

  const key = b64Name ?? `${plainName}_B64`;
  const raw = readWorkerEnv(key)?.trim();
  if (!raw) return undefined;
  return decodeBase64Utf8(raw);
}
