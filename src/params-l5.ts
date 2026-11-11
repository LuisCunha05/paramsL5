import { QUERY_NAMES } from '#s/constants';
import { type TFilter, filter } from '#s/generators/filter';
import { type TInclude, include } from '#s/generators/include';
import { type TLimit, limit } from '#s/generators/limit';
import { type TOrderBySortBy, orderBySortBy } from '#s/generators/order-sort';
import { type TPage, page } from '#s/generators/page';
import { type TSearch, search } from '#s/generators/search';
import { type TSearchJoin, searchJoin } from '#s/generators/search-join';
import { type TWith, withRel } from '#s/generators/with';
import { type TWithCount, withCount } from '#s/generators/with-count';
import { toParams, type TParamsStrings } from '#s/utils';

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

  result.toParams = () => toParams(result);
  return result;
}
