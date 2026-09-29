/** Verify Google Sign-In / One Tap ID token and return profile fields. */
export async function verifyGoogleIdToken(credential: string): Promise<{
  email: string;
  name: string;
  sub: string;
} | null> {
  const token = credential.trim();
  if (!token) return null;

  const res = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(token)}`, {
    cache: "no-store",
  });
  if (!res.ok) return null;

  const data = (await res.json()) as {
    email?: string;
    name?: string;
    sub?: string;
    aud?: string;
    email_verified?: string;
  };

  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim();
  if (clientId && data.aud !== clientId) return null;
  if (!data.email || data.email_verified === "false") return null;

  return {
    email: data.email,
    name: data.name?.trim() || data.email.split("@")[0] || "Google user",
    sub: data.sub ?? "",
  };
}
