import { createSign } from "node:crypto";
import { resolveFirebaseServerEnv } from "@/lib/firebase/env";

const TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
const OAUTH_SCOPE = "https://www.googleapis.com/auth/firebase.messaging";
const ACCESS_TOKEN_TTL_SECONDS = 3600;

type CachedAccessToken = {
  token: string;
  expiresAtEpochSec: number;
};

let cachedAccessToken: CachedAccessToken | null = null;

function toBase64Url(input: string | Buffer): string {
  const raw =
    typeof input === "string"
      ? Buffer.from(input, "utf8")
      : Buffer.from(input);
  return raw
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function signJwt(unsigned: string, privateKey: string): string {
  const signer = createSign("RSA-SHA256");
  signer.update(unsigned);
  signer.end();
  const signature = signer.sign(privateKey);
  return `${unsigned}.${toBase64Url(signature)}`;
}

function buildServiceAccountJwt(): string {
  const env = resolveFirebaseServerEnv();
  const now = Math.floor(Date.now() / 1000);
  const header = {
    alg: "RS256",
    typ: "JWT",
  };
  const payload = {
    iss: env.clientEmail,
    sub: env.clientEmail,
    aud: TOKEN_ENDPOINT,
    scope: OAUTH_SCOPE,
    iat: now,
    exp: now + ACCESS_TOKEN_TTL_SECONDS,
  };

  const unsigned = `${toBase64Url(JSON.stringify(header))}.${toBase64Url(
    JSON.stringify(payload),
  )}`;
  return signJwt(unsigned, env.privateKey);
}

function shouldReuseToken(token: CachedAccessToken | null): boolean {
  if (!token) return false;
  const now = Math.floor(Date.now() / 1000);
  // refresh token 60 seconds before expiry
  return token.expiresAtEpochSec - 60 > now;
}

export async function getFirebaseAccessToken(): Promise<string> {
  if (shouldReuseToken(cachedAccessToken)) {
    return cachedAccessToken!.token;
  }

  const assertion = buildServiceAccountJwt();
  const form = new URLSearchParams();
  form.set("grant_type", "urn:ietf:params:oauth:grant-type:jwt-bearer");
  form.set("assertion", assertion);

  const res = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: form.toString(),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(
      `Failed to obtain Firebase access token (${res.status}): ${body}`,
    );
  }

  const data = (await res.json()) as {
    access_token?: string;
    expires_in?: number;
  };

  if (!data.access_token || !data.expires_in) {
    throw new Error("Firebase token endpoint returned invalid payload.");
  }

  const now = Math.floor(Date.now() / 1000);
  cachedAccessToken = {
    token: data.access_token,
    expiresAtEpochSec: now + data.expires_in,
  };
  return data.access_token;
}

export function clearFirebaseAccessTokenCache(): void {
  cachedAccessToken = null;
}
