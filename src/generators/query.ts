import { assertQueryKey, type TParamsStrings } from '#/utils';

/**
 * Compiles a dictionary of formatted query parameters into a URL query string (`URLSearchParams`).
 *
 * @remarks
 * Parameter keys are validated against permitted `l5-repository` keys and sorted alphabetically.
 * Parameters with empty, `undefined`, or `null` values are omitted.
 *
 * @param arg - Object containing parameter names (`filter`, `search`, `limit`, etc.) mapped to their string values.
 * @returns Sorted, URL-encoded query string (e.g. `filter=id%3Bname&limit=10`), or an empty string if none remain.
 *
 * @example
 * ```typescript
 * query({
 *   filter: 'id;name',
 *   limit: '10',
 *   search: 'status:active',
 * });
 * // => "filter=id%3Bname&limit=10&search=status%3Aactive"
 * ```
 */
export function query(arg: Partial<TParamsStrings>): string {
  const params = new URLSearchParams();

  Object.keys(arg)
    .toSorted()
    .forEach((key) => {
      if (!assertQueryKey(key)) {
        return;
      }
      const val = arg[key];
      if (val) {
        params.append(key, val);
      }
    });

  return params.toString();
}
