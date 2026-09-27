/** Read env on Node or Cloudflare Workers (OpenNext binds secrets on `env`). */
export function readWorkerEnv(name: string): string | undefined {
  const fromProcess = process.env[name]?.trim();
  if (fromProcess) return fromProcess;

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getCloudflareContext } = require("@opennextjs/cloudflare") as {
      getCloudflareContext: () => { env?: Record<string, string> };
    };
    const bound = getCloudflareContext()?.env?.[name]?.trim();
    if (bound) return bound;
  } catch {
    // Not on Cloudflare / outside a request
  }

  return undefined;
}
