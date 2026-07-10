const SORT_LOCALE = 'es';

/** Primera letra del nombre (tal cual; sin ignorar artículos). */
function firstSortLetter(name: string): string {
  const trimmed = name.trim();
  return trimmed ? trimmed[0]!.toLocaleUpperCase(SORT_LOCALE) : '';
}

function compareProductNames(a: string, b: string): number {
  const byLetter = firstSortLetter(a).localeCompare(firstSortLetter(b), SORT_LOCALE, {
    sensitivity: 'base',
  });
  if (byLetter !== 0) return byLetter;
  // Misma letra inicial: orden alfabético completo (duplicados quedan juntos).
  return a.trim().localeCompare(b.trim(), SORT_LOCALE, { sensitivity: 'base' });
}

/** Lista de productos: agrupa por letra inicial y ordena alfabéticamente dentro de cada grupo. */
export function sortProductsByName<T extends { id: string; name: string }>(
  products: readonly T[],
): T[] {
  return [...products].sort((a, b) => {
    const byName = compareProductNames(a.name, b.name);
    if (byName !== 0) return byName;
    return a.id.localeCompare(b.id);
  });
}
