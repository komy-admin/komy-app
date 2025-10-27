/**
 * Compare deux valeurs de manière profonde (deep equality)
 * Supporte les primitives, objets, tableaux et valeurs nulles/undefined
 *
 * @param a - Première valeur à comparer
 * @param b - Seconde valeur à comparer
 * @returns true si les valeurs sont égales en profondeur, false sinon
 *
 * @example
 * deepEquals([1, 2, 3], [1, 2, 3]) // true
 * deepEquals({ a: 1 }, { a: 1 }) // true
 * deepEquals({ a: { b: 1 } }, { a: { b: 1 } }) // true
 * deepEquals([{ id: 1 }], [{ id: 2 }]) // false
 */
export function deepEquals<T = unknown>(a: T, b: T): boolean {
  // Cas d'égalité stricte (primitives, références identiques)
  if (a === b) return true;

  // Cas null/undefined
  if (a == null || b == null) return false;

  // Cas tableaux
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;

    for (let i = 0; i < a.length; i++) {
      if (!deepEquals(a[i], b[i])) return false;
    }

    return true;
  }

  // Cas objets
  if (typeof a === 'object' && typeof b === 'object') {
    const keysA = Object.keys(a as object);
    const keysB = Object.keys(b as object);

    if (keysA.length !== keysB.length) return false;

    for (const key of keysA) {
      if (!keysB.includes(key)) return false;

      const valueA = (a as Record<string, unknown>)[key];
      const valueB = (b as Record<string, unknown>)[key];

      if (!deepEquals(valueA, valueB)) return false;
    }

    return true;
  }

  // Autres cas (types différents, etc.)
  return false;
}
