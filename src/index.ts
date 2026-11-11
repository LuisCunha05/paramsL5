import { paramsL5 } from '#/params-l5';

export type { ClientOptions, ClientRunner } from '#/client';

/**
 * Creates a reusable client runner configured with default query options and custom logger settings.
 *
 * @remarks
 * Fields are validated: `null`, `undefined`, and invalid shapes are filtered out safely, falling back to configured defaults when available.
 *
 * @param options - Configuration options for defaults (`limit`, `sortBy`, etc.) and logging.
 * @returns A query runner function with a `.for<TShape>()` helper for type-safe query generation.
 *
 * @example
 * ```typescript
 * const client = createClient({ defaultOptions: { limit: 15, sortBy: 'desc' } });
 * const query = client({ page: 2 });
 * console.log(query.toParams()); // => "limit=15&page=2&sortedBy=desc"
 * ```
 */
export { createClient } from '#/client';

export { CONDITIONS, SEARCH_JOIN, SORT_BY } from '#/constants';

export type { TFilter } from '#gen/filter';

/**
 * Formats database columns to retrieve into a semicolon-separated string (`filter=id;name`).
 *
 * @remarks
 * Fields are validated: `null`, `undefined`, and invalid shapes (such as empty strings or non-string values) are filtered out safely.
 *
 * @param arg - Array of column field names.
 * @param options - Optional settings including custom logger.
 * @returns Semicolon-separated string of unique column names, or `undefined` if none remain.
 *
 * @example
 * ```typescript
 * filter(['id', 'name', 'email']); // => "id;name;email"
 * ```
 */
export { filter } from '#gen/filter';

export type { TInclude } from '#gen/include';

/**
 * Formats related models to eager load into a comma-separated string (`include=profile,posts`).
 *
 * @remarks
 * Fields are validated: `null`, `undefined`, and invalid shapes (such as empty strings or non-string values) are filtered out safely.
 *
 * @param arg - Array of relation names.
 * @param options - Optional settings including custom logger.
 * @returns Comma-separated string of unique relation names, or `undefined` if none remain.
 *
 * @example
 * ```typescript
 * include(['profile', 'posts']); // => "profile,posts"
 * ```
 */
export { include } from '#gen/include';

export type { TLimit } from '#gen/limit';

/**
 * Formats the pagination limit (records per page) into a query parameter string.
 *
 * @remarks
 * Fields are validated: `null`, `undefined`, and invalid shapes/types (negative numbers, decimals, non-numeric values) are filtered out safely.
 *
 * @param arg - Number of records to return (integer >= 0).
 * @param options - Optional settings including `defaultValue` and custom logger.
 * @returns String representation of the limit, or `undefined` if invalid.
 *
 * @example
 * ```typescript
 * limit(15); // => "15"
 * ```
 */
export { limit } from '#gen/limit';

export type { TOrderBySortBy } from '#gen/order-sort';

/**
 * Formats sorting columns and directions into paired `orderBy` and `sortedBy` parameters.
 *
 * @remarks
 * Fields are validated: `null`, `undefined`, and invalid shapes (such as malformed tuples or invalid sort directions) are filtered out safely.
 *
 * @param arg - Array of tuples in `[field, 'asc' | 'desc']` format.
 * @param options - Optional settings such as `defaultSortBy` and custom logger.
 * @returns An object `{ orderBy, sortedBy }` with semicolon-separated values, or `undefined` values if none remain.
 *
 * @example
 * ```typescript
 * orderBySortBy([['created_at', 'desc'], ['name', 'asc']]);
 * // => { orderBy: "created_at;name", sortedBy: "desc;asc" }
 * ```
 */
export { orderBySortBy } from '#gen/order-sort';

export type { TPage } from '#gen/page';

/**
 * Formats the pagination page number into a query parameter string.
 *
 * @remarks
 * Fields are validated: `null`, `undefined`, and invalid shapes/types (numbers <= 0, decimals, non-numeric values) are filtered out safely.
 *
 * @param arg - Page number to retrieve (integer >= 1).
 * @param options - Optional settings including custom logger.
 * @returns String representation of the page number, or `undefined` if invalid.
 *
 * @example
 * ```typescript
 * page(2); // => "2"
 * ```
 */
export { page } from '#gen/page';

export type {
  TCondition,
  TSearch,
  TSearchOptions,
  TSearchResult,
} from '#gen/search';

/**
 * Formats search criteria into `search` and optional `searchFields` parameter strings.
 *
 * @remarks
 * Fields are validated: `null`, `undefined`, and invalid shapes (such as malformed tuples, non-array inputs, or invalid conditions) are filtered out safely.
 *
 * @param arg - Array of search tuples in `[field, value, condition?]` format.
 * @param options - Search options including `includeSearchFields` and `defaultCondition`.
 * @returns An object containing `{ search, searchFields }`, or `undefined` values if none remain.
 *
 * @example
 * ```typescript
 * search([
 *   ['name', 'John', CONDITIONS.LIKE],
 *   ['age', 18, CONDITIONS.GTE],
 * ], { includeSearchFields: true });
 * // => { search: "name:John;age:18", searchFields: "name:like;age:>=" }
 * ```
 */
export { search } from '#gen/search';

export type { TSearchJoin } from '#gen/search-join';

/**
 * Formats the logical operator (`and` | `or`) that connects multiple search conditions.
 *
 * @remarks
 * Fields are validated: `null`, `undefined`, and values other than `'and'` or `'or'` are filtered out safely.
 *
 * @param arg - The join strategy (`'and'` or `'or'`).
 * @param options - Optional settings including custom logger.
 * @returns The validated join string (`'and'` | `'or'`), or `undefined` if invalid.
 *
 * @example
 * ```typescript
 * searchJoin('and'); // => "and"
 * ```
 */
export { searchJoin } from '#gen/search-join';

export type { TWith } from '#gen/with';

/**
 * Formats relations to eager load via repository `with` into a semicolon-separated string.
 *
 * @remarks
 * Fields are validated: `null`, `undefined`, and invalid shapes (such as empty strings or non-string values) are filtered out safely.
 *
 * @param arg - Array of relation paths (supports dot and pipe notation).
 * @param options - Optional settings including custom logger.
 * @returns Semicolon-separated string of unique relation paths, or `undefined` if none remain.
 *
 * @example
 * ```typescript
 * withRel(['author', 'comments.author']); // => "author;comments.author"
 * ```
 */
export { withRel } from '#gen/with';

export type { TWithCount } from '#gen/with-count';

/**
 * Formats relations whose count should be loaded (`withCount`) into a semicolon-separated string.
 *
 * @remarks
 * Fields are validated: `null`, `undefined`, and invalid shapes (such as empty strings or non-string values) are filtered out safely.
 *
 * @param arg - Array of relation names to count.
 * @param options - Optional settings including custom logger.
 * @returns Semicolon-separated string of unique relation names, or `undefined` if none remain.
 *
 * @example
 * ```typescript
 * withCount(['comments', 'likes']); // => "comments;likes"
 * ```
 */
export { withCount } from '#gen/with-count';

/**
 * Compiles an object of repository query parameters into a URL-encoded query string (`URLSearchParams`).
 *
 * @remarks
 * Parameter keys are validated against permitted `l5-repository` keys and sorted alphabetically.
 * Parameters with empty, `undefined`, or `null` values are omitted.
 *
 * @param arg - Object mapping query parameter keys (e.g. `search`, `filter`, `limit`) to their string values.
 * @returns A sorted, URL-encoded query parameter string (e.g. `filter=id%3Bname&limit=10`), or an empty string if no valid parameters exist.
 *
 * @example
 * ```typescript
 * query({
 *   filter: 'id;name',
 *   limit: '15',
 *   search: 'status:active',
 * });
 * // => "filter=id%3Bname&limit=15&search=status%3Aactive"
 * ```
 */
export { query } from '#gen/query';

export type { TParams, TResultParams } from '#/params-l5';

/**
 * Generates query parameters formatted for `l5-repository` and provides a `.toParams()` compiler.
 *
 * @remarks
 * Fields are validated: `null`, `undefined`, and invalid shapes are filtered out safely.
 *
 * @param arg - Query parameter options (`search`, `filter`, `limit`, `orderBySortBy`, etc.).
 * @returns An object with individual parameter strings and a `toParams()` method for URL encoding.
 *
 * @example
 * ```typescript
 * const query = paramsL5({
 *   search: [['status', 'active']],
 *   filter: ['id', 'name'],
 *   limit: 10,
 * });
 * console.log(query.toParams());
 * // => "filter=id%3Bname&limit=10&search=status%3Aactive"
 * ```
 */
export { paramsL5 } from '#/params-l5';

export type {
  TBaseValue,
  TLogger,
  TNoDuplicates,
  TNoDuplicateKeys,
  TPath,
  TPathPipe,
} from '#/types';

export default paramsL5;
