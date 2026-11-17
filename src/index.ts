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

export type { TFilter, TFilterResult } from '#gen/filter';

/**
 * Formats database columns to retrieve into a semicolon-separated string (`filter=id;name`).
 *
 * @remarks
 * Fields are validated: `null`, `undefined`, and invalid shapes (such as empty strings or non-string values) are filtered out safely.
 *
 * @param arg - Array of column field names.
 * @param options - Optional settings including custom logger.
 * @returns An object `{ filter }` containing a semicolon-separated string of unique column names, or `undefined`.
 *
 * @example
 * ```typescript
 * filter(['id', 'name', 'email']); // => { filter: "id;name;email" }
 * ```
 */
export { Filter } from '#gen/filter';

export type { TInclude, TIncludeResult } from '#gen/include';

/**
 * Formats related models to eager load into a comma-separated string (`include=profile,posts`).
 *
 * @remarks
 * Fields are validated: `null`, `undefined`, and invalid shapes (such as empty strings or non-string values) are filtered out safely.
 *
 * @param arg - Array of relation names.
 * @param options - Optional settings including custom logger.
 * @returns An object `{ include }` containing a comma-separated string of unique relation names, or `undefined`.
 *
 * @example
 * ```typescript
 * include(['profile', 'posts']); // => { include: "profile,posts" }
 * ```
 */
export { Include } from '#gen/include';

export type { TLimit, TLimitResult } from '#gen/limit';

/**
 * Formats the pagination limit (records per page) into a query parameter string.
 *
 * @remarks
 * Fields are validated: `null`, `undefined`, and invalid shapes/types (negative numbers, decimals, non-numeric values) are filtered out safely.
 *
 * @param arg - Number of records to return (integer >= 0).
 * @param options - Optional settings including `defaultValue` and custom logger.
 * @returns An object `{ limit }` containing the string representation of the limit, or `undefined` if invalid.
 *
 * @example
 * ```typescript
 * limit(15); // => { limit: "15" }
 * ```
 */
export { Limit } from '#gen/limit';

export type {
  TOrderBySortBy,
  TOrderBySortByOptions,
  TOrderBySortByResult,
  TSortBy,
} from '#gen/order-sort';

/**
 * Formats sorting columns and directions into paired `orderBy` and `sortedBy` parameters.
 *
 * @remarks
 * Top-level non-array inputs (excluding `null` and `undefined`) produce a validation error.
 * Individual tuple entries with invalid shapes, keys, or sort directions are safely filtered out.
 *
 * @example
 * ```typescript
 * OrderBySortBy.build([['created_at', 'desc'], ['name', 'asc']]);
 * // => { orderBy: "created_at;name", sortedBy: "desc;asc" }
 * ```
 */
export { OrderBySortBy } from '#gen/order-sort';

export type { TPage, TPageResult } from '#gen/page';

/**
 * Formats the pagination page number into a query parameter string.
 *
 * @remarks
 * Fields are validated: `null`, `undefined`, and invalid shapes/types (numbers <= 0, decimals, non-numeric values) are filtered out safely.
 *
 * @param arg - Page number to retrieve (integer >= 1).
 * @param options - Optional settings including custom logger.
 * @returns An object `{ page }` containing the string representation of the page number, or `undefined` if invalid.
 *
 * @example
 * ```typescript
 * page(2); // => { page: "2" }
 * ```
 */
export { Page } from '#gen/page';

export type {
  TCondition,
  TSearch,
  TSearchCondition,
  TSearchOptions,
  TSearchResult,
} from '#gen/search';

/**
 * Formats object-based search criteria into `search` and optional `searchFields` parameter strings.
 *
 * @remarks
 * Top-level non-object inputs (excluding `null` and `undefined`) produce a validation error.
 * Individual field entries with `null`, `undefined`, or invalid shapes/conditions are safely filtered out.
 *
 * @example
 * ```typescript
 * Search.build(
 *   { name: { like: 'John' }, age: { gte: 18 } },
 *   { includeSearchFields: true },
 * );
 * // => { search: "name:John;age:18", searchFields: "name:like;age:>=" }
 * ```
 */
export { Search } from '#gen/search';

export type { TSearchJoin, TSearchJoinResult } from '#gen/search-join';

/**
 * Formats the logical operator (`and` | `or`) that connects multiple search conditions.
 *
 * @remarks
 * Fields are validated: `null`, `undefined`, and values other than `'and'` or `'or'` are filtered out safely.
 *
 * @param arg - The join strategy (`'and'` or `'or'`).
 * @param options - Optional settings including custom logger.
 * @returns An object `{ searchJoin }` containing the validated join string (`'and'` | `'or'`), or `undefined` if invalid.
 *
 * @example
 * ```typescript
 * searchJoin('and'); // => { searchJoin: "and" }
 * ```
 */
export { SearchJoin } from '#gen/search-join';

export type { TWith, TWithResult } from '#gen/with';

/**
 * Formats relations to eager load via repository `with` into a semicolon-separated string.
 *
 * @remarks
 * Fields are validated: `null`, `undefined`, and invalid shapes (such as empty strings or non-string values) are filtered out safely.
 *
 * @param arg - Array of relation paths (supports dot and pipe notation).
 * @param options - Optional settings including custom logger.
 * @returns An object `{ with }` containing a semicolon-separated string of unique relation paths, or `undefined`.
 *
 * @example
 * ```typescript
 * withRel(['author', 'comments.author']); // => { with: "author;comments.author" }
 * ```
 */
export { With } from '#gen/with';

export type { TWithCount, TWithCountResult } from '#gen/with-count';

/**
 * Formats relations whose count should be loaded (`withCount`) into a semicolon-separated string.
 *
 * @remarks
 * Fields are validated: `null`, `undefined`, and invalid shapes (such as empty strings or non-string values) are filtered out safely.
 *
 * @param arg - Array of relation names to count.
 * @param options - Optional settings including custom logger.
 * @returns An object `{ withCount }` containing a semicolon-separated string of unique relation names, or `undefined`.
 *
 * @example
 * ```typescript
 * withCount(['comments', 'likes']); // => { withCount: "comments;likes" }
 * ```
 */
export { WithCount } from '#gen/with-count';

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
 *   search: { status: 'active' },
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
