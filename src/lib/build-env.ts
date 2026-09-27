/** True when build uses the local placeholder DB from with-build-env.mjs */
export function isBuildPlaceholderDatabase(): boolean {
  const url = process.env.DATABASE_URL?.trim() ?? "";
  return url.includes("@127.0.0.1:5432/build");
}

/** Skip SSG param generation when no real database is available at build time. */
export function shouldSkipStaticParamsAtBuild(): boolean {
  return isBuildPlaceholderDatabase();
}
