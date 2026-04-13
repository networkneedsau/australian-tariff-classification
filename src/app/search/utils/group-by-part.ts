/**
 * Generic grouping utility that groups an array of items by a key field.
 * Preserves insertion order of groups.
 */
export function groupByField<T>(
  items: T[],
  keyField: keyof T,
  titleField?: keyof T
): { key: string; title: string; items: T[] }[] {
  const map = new Map<string, { key: string; title: string; items: T[] }>();

  for (const item of items) {
    const key = String(item[keyField] ?? 'Unknown');
    const title = titleField ? String(item[titleField] ?? '') : key;

    if (!map.has(key)) {
      map.set(key, { key, title, items: [] });
    }
    map.get(key)!.items.push(item);
  }

  return Array.from(map.values());
}
