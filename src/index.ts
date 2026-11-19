export { CONDITIONS, SEARCH_JOIN, SORT_BY } from '#/constants';

export type {
  TValidationErrorOptions,
  TValidationIssue,
} from '#/errors/params-l5-validation-error';
export { ParamsL5ValidationError } from '#/errors/params-l5-validation-error';

export type { TFilter, TFilterOptions, TFilterResult } from '#gen/filter';

/**
 * Formats database columns to retrieve into a semicolon-separated string (`filter=id;name`).
 *
 * @example
 * ```typescript
 * Filter.build(['id', 'name', 'email']); // => { filter: "id;name;email" }
 * ```
 */
export { Filter } from '#gen/filter';

export type { TInclude, TIncludeOptions, TIncludeResult } from '#gen/include';

/**
 * Formats related models to eager load into a comma-separated string (`include=profile,posts`).
 *
 * @example
 * ```typescript
 * Include.build(['profile', 'posts']); // => { include: "profile,posts" }
 * ```
 */
export { Include } from '#gen/include';

export type { TLimit, TLimitOptions, TLimitResult } from '#gen/limit';

/**
 * Formats the pagination limit (records per page) into a query parameter string.
 *
 * @example
 * ```typescript
 * Limit.build(15); // => { limit: "15" }
 * ```
 */
export { Limit } from '#gen/limit';

export type {
  TOrderBySortBy,
  TOrderBySortByOptions,
  TOrderBySortByResult,
  TOrderBySortByValue,
  TSortBy,
} from '#gen/order-sort';

/**
 * Formats object-based sorting columns and directions into paired `orderBy` and `sortedBy` parameters.
 *
 * @example
 * ```typescript
 * OrderBySortBy.build({ created_at: 'desc', name: 'asc' });
 * // => { orderBy: "created_at;name", sortedBy: "desc;asc" }
 * ```
 */
export { OrderBySortBy } from '#gen/order-sort';

export type { TPage, TPageOptions, TPageResult } from '#gen/page';

/**
 * Formats the pagination page number into a query parameter string.
 *
 * @example
 * ```typescript
 * Page.build(2); // => { page: "2" }
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

export type {
  TSearchJoin,
  TSearchJoinOptions,
  TSearchJoinResult,
} from '#gen/search-join';

/**
 * Formats the logical operator (`and` | `or`) that connects multiple search conditions.
 *
 * @example
 * ```typescript
 * SearchJoin.build('and'); // => { searchJoin: "and" }
 * ```
 */
export { SearchJoin } from '#gen/search-join';

export type { TWith, TWithOptions, TWithResult } from '#gen/with';

/**
 * Formats relations to eager load via repository `with` into a semicolon-separated string.
 *
 * @example
 * ```typescript
 * With.build(['author', 'comments.author']); // => { with: "author;comments.author" }
 * ```
 */
export { With } from '#gen/with';

export type {
  TWithCount,
  TWithCountOptions,
  TWithCountResult,
} from '#gen/with-count';

/**
 * Formats relations whose count should be loaded (`withCount`) into a semicolon-separated string.
 *
 * @example
 * ```typescript
 * WithCount.build(['comments', 'likes']); // => { withCount: "comments;likes" }
 * ```
 */
export { WithCount } from '#gen/with-count';

/**
 * Compiles an object of repository query parameters into a URL-encoded query string (`URLSearchParams`).
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

export type {
  ParamsL5DefaultOptions,
  ParamsL5Options,
  ParamsL5TypedRunner,
  TParams,
  TResultParams,
  ValidateParams,
} from '#/params-l5';

/**
 * Generates query parameters formatted for `l5-repository` with static helpers and configurable instances.
 *
 * @example
 * ```typescript
 * const params = ParamsL5.build({
 *   search: { status: 'active' },
 *   filter: ['id', 'name'],
 *   limit: 10,
 * });
 * console.log(params.toParams());
 * // => "filter=id%3Bname&limit=10&page=1&search=status%3Aactive"
 * ```
 */
export { ParamsL5, ParamsL5 as default } from '#/params-l5';

export type {
  TBaseValue,
  TGenerator,
  TLogger,
  TNoDuplicateKeys,
  TNoDuplicates,
  TPath,
  TPathPipe,
  TPathValue,
  TResult,
} from '#/types';
