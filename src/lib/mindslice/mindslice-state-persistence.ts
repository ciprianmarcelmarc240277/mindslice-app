export type MindsliceStateScope = "memory" | "canon";
export type MindsliceStateDomain = "narrative" | "art" | "structure" | "color" | "shape" | "shape_grammar" | "meta_system";

type PersistedStateResponse<T> = {
  entries?: T[];
};

export async function loadPersistedMindsliceState<T>(
  scope: MindsliceStateScope,
  domain: MindsliceStateDomain,
) {
  const response = await fetch(
    `/api/mindslice-state?scope=${encodeURIComponent(scope)}&domain=${encodeURIComponent(domain)}`,
    { cache: "no-store" },
  );

  const payload = (await response.json()) as PersistedStateResponse<T>;

  if (!response.ok) {
    throw new Error("Persisted mindslice state request failed.");
  }

  return Array.isArray(payload.entries) ? payload.entries : [];
}

export async function persistMindsliceState<T extends { id: string }>(
  scope: MindsliceStateScope,
  domain: MindsliceStateDomain,
  entries: T[],
) {
  const response = await fetch("/api/mindslice-state", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      scope,
      domain,
      entries,
    }),
  });

  const payload = (await response.json()) as PersistedStateResponse<T>;

  if (!response.ok) {
    throw new Error("Persisted mindslice state write failed.");
  }

  return Array.isArray(payload.entries) ? payload.entries : entries;
}
