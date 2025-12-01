export function aggregateUniqueTags(resources: { tags: string[] }[]): string[] {
  const uniqueTags = new Set<string>();
  resources.forEach((resource) => {
    resource.tags?.forEach((tag) => uniqueTags.add(tag));
  });
  return Array.from(uniqueTags).sort((a, b) => a.localeCompare(b));
}
