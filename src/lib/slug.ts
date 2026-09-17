const MAX_LENGTH = 60;

export function slugify(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .slice(0, MAX_LENGTH)
    .replace(/^-+|-+$/g, "");
}

/// Names are not unique but status page addresses have to be, so a taken slug
/// gets a numeric suffix: acme-api, acme-api-2, acme-api-3.
export async function availableSlug(
  name: string,
  isTaken: (slug: string) => Promise<boolean>,
): Promise<string> {
  const base = slugify(name) || "monitor";

  if (!(await isTaken(base))) {
    return base;
  }

  for (let suffix = 2; suffix <= 50; suffix++) {
    const candidate = `${base}-${suffix}`;

    if (!(await isTaken(candidate))) {
      return candidate;
    }
  }

  return `${base}-${Date.now().toString(36)}`;
}
