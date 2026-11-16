import { type TParamsStrings } from '#/utils';
import { type TFilter, Filter } from '#gen/filter';
import { type TInclude, Include } from '#gen/include';
import { type TLimit, limit } from '#gen/limit';
import { type TOrderBySortBy, orderBySortBy } from '#gen/order-sort';
import { type TPage, page } from '#gen/page';
import { query } from '#gen/query';
import { type TSearch, search } from '#gen/search';
import { type TSearchJoin, searchJoin } from '#gen/search-join';
import { type TWith, With } from '#gen/with';
import { type TWithCount, WithCount } from '#gen/with-count';

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
  const result: TResultParams = {
    ...Filter.build(arg.filter),
    ...Include.build(arg.include),
    ...limit(arg.limit),
    ...orderBySortBy(arg.orderBySortBy),
    ...page(arg.page),
    ...search(arg.search, {
      includeSearchFields: arg.includeSearchFields,
    }),
    ...searchJoin(arg.searchJoin),
    ...With.build(arg.with),
    ...WithCount.build(arg.withCount),
    toParams: () => {},
  };

  result.toParams = () => query(result);
  return result;
}
