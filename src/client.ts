import { QUERY_NAMES } from '#/constants';
import { logger as loggerFn, type LogLevel } from '#/logger';
import type { TParams, TResultParams } from '#/params-l5';
import type {
  TLogger,
  TValidateFlatArray,
  TValidateKeyTupleArray,
} from '#/types';
import { toParams } from '#/utils';
import { filter } from '#gen//filter';
import { include } from '#gen//include';
import { type TLimit, limit } from '#gen//limit';
import { type TSortBy, orderBySortBy } from '#gen//order-sort';
import { type TPage, page } from '#gen//page';
import { type TCondition, search } from '#gen//search';
import { type TSearchJoin, searchJoin } from '#gen//search-join';
import { withRel } from '#gen//with';
import { withCount } from '#gen//with-count';

interface DefaultOptions {
  sortBy?: TSortBy;
  page?: TPage;
  limit?: TLimit;
  searchJoin?: TSearchJoin;
  searchCondition?: TCondition;
  includeSearchFields?: boolean;
}

export interface ClientOptions {
  defaultOptions?: DefaultOptions;
  logging?: { logger?: TLogger; logLevel: LogLevel };
}

export type ValidateParams<TInput> = {
  [KFn in keyof TInput]: KFn extends 'include' | 'with' | 'withCount' | 'filter'
    ? TValidateFlatArray<TInput[KFn]>
    : KFn extends 'orderBySortBy' | 'search'
      ? TValidateKeyTupleArray<TInput[KFn]>
      : TInput[KFn];
};

export interface ClientRunner {
  <TShape extends object = Record<string, unknown>>(
    params?: TParams<TShape>,
  ): TResultParams;

  for: <TShape extends object>() => <const TInput extends TParams<TShape>>(
    params?: ValidateParams<TInput> extends TInput
      ? TInput
      : ValidateParams<TInput>,
  ) => TResultParams;
}

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
export function createClient(options: ClientOptions = {}): ClientRunner {
  function runner<TShape extends object = Record<string, unknown>>(
    params: TParams<TShape> = {},
  ): TResultParams {
    const { logging } = options;

    const logger = loggerFn({
      logLevel: logging?.logLevel,
      logger: logging?.logger,
    });

    const searchObj = search(params.search, {
      defaultCondition: options?.defaultOptions?.searchCondition,
      includeSearchFields:
        params.includeSearchFields ??
        options?.defaultOptions?.includeSearchFields,
      logger,
    });

    const orderBySortByObj = orderBySortBy(params.orderBySortBy, {
      defaultSortBy: options?.defaultOptions?.sortBy,
      logger,
    });

    const result: TResultParams = {
      [QUERY_NAMES.FLT]: filter(params.filter, { logger }),
      [QUERY_NAMES.INC]: include(params.include, { logger }),
      [QUERY_NAMES.LMT]: limit(params.limit, {
        defaultValue: options?.defaultOptions?.limit,
        logger,
      }),
      [QUERY_NAMES.OBY]: orderBySortByObj.orderBy,
      [QUERY_NAMES.PAG]: page(params.page ?? options?.defaultOptions?.page, {
        logger,
      }),
      [QUERY_NAMES.SRC]: searchObj?.search,
      [QUERY_NAMES.SFI]: searchObj?.searchFields,
      [QUERY_NAMES.SJO]: searchJoin(
        params.searchJoin ?? options?.defaultOptions?.searchJoin,
        { logger },
      ),
      [QUERY_NAMES.SBY]: orderBySortByObj.sortedBy,
      toParams: () => {},
      [QUERY_NAMES.WTH]: withRel(params.with, { logger }),
      [QUERY_NAMES.WTC]: withCount(params.withCount, { logger }),
    };

    result.toParams = () => toParams(result);
    return result;
  }

  runner.for =
    <TShape extends object>() =>
    (params: TParams<TShape> = {}) =>
      runner(params);

  return runner;
}
