import { resolveFirebaseServerEnv } from "@/lib/firebase/env";
import { getFirebaseAccessToken } from "@/lib/firebase/google-auth";

export type RemoteConfigTemplate = {
  parameters?: Record<
    string,
    {
      defaultValue?: { value?: string };
      description?: string;
    }
  >;
};

export async function fetchRemoteConfigTemplate(): Promise<RemoteConfigTemplate> {
  const env = resolveFirebaseServerEnv();
  const token = await getFirebaseAccessToken();
  const endpoint = `https://firebaseremoteconfig.googleapis.com/v1/projects/${env.projectId}/remoteConfig`;

  const res = await fetch(endpoint, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(
      `Failed to fetch Remote Config template (${res.status}): ${body}`,
    );
  }

  return (await res.json()) as RemoteConfigTemplate;
}

export async function updateRemoteConfigTemplate(
  template: RemoteConfigTemplate,
  etag?: string,
): Promise<void> {
  const env = resolveFirebaseServerEnv();
  const token = await getFirebaseAccessToken();
  const endpoint = `https://firebaseremoteconfig.googleapis.com/v1/projects/${env.projectId}/remoteConfig`;

  const res = await fetch(endpoint, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json; UTF-8",
      "If-Match": etag ?? "*",
    },
    body: JSON.stringify(template),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(
      `Failed to update Remote Config template (${res.status}): ${body}`,
    );
  }
}
