import { QUERY_NAMES } from '#/constants';
import { type TParamsStrings } from '#/utils';
import { type TFilter, filter } from '#gen/filter';
import { type TInclude, include } from '#gen/include';
import { type TLimit, limit } from '#gen/limit';
import { type TOrderBySortBy, orderBySortBy } from '#gen/order-sort';
import { type TPage, page } from '#gen/page';
import { query } from '#gen/query';
import { type TSearch, search } from '#gen/search';
import { type TSearchJoin, searchJoin } from '#gen/search-join';
import { type TWith, withRel } from '#gen/with';
import { type TWithCount, withCount } from '#gen/with-count';

export interface TParams<TShape extends object = Record<string, unknown>> {
  readonly filter?: TFilter<TShape>;
  readonly include?: TInclude<TShape>;
  readonly limit?: TLimit;
  readonly orderBySortBy?: TOrderBySortBy<TShape>;
  readonly page?: TPage;
  readonly search?: TSearch<TShape>;
  readonly includeSearchFields?: boolean;
  readonly searchJoin?: TSearchJoin;
  readonly with?: TWith<TShape>;
  readonly withCount?: TWithCount<TShape>;
}

export type TResultParams = TParamsStrings & {
  toParams: () => string | undefined;
};

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
export function paramsL5<TShape extends object = Record<string, unknown>>(
  arg: TParams<TShape> = {},
) {
  const searchObj = search(arg.search, {
    includeSearchFields: arg.includeSearchFields,
  });
  const orderBySortByObj = orderBySortBy(arg.orderBySortBy);

  const result: TResultParams = {
    [QUERY_NAMES.FLT]: filter(arg.filter),
    [QUERY_NAMES.INC]: include(arg.include),
    [QUERY_NAMES.LMT]: limit(arg.limit),
    [QUERY_NAMES.OBY]: orderBySortByObj.orderBy,
    [QUERY_NAMES.PAG]: page(arg.page),
    [QUERY_NAMES.SRC]: searchObj.search,
    [QUERY_NAMES.SFI]: searchObj.searchFields,
    [QUERY_NAMES.SJO]: searchJoin(arg.searchJoin),
    [QUERY_NAMES.SBY]: orderBySortByObj.sortedBy,
    toParams: () => {},
    [QUERY_NAMES.WTH]: withRel(arg.with),
    [QUERY_NAMES.WTC]: withCount(arg.withCount),
  };

  result.toParams = () => query(result);
  return result;
}
