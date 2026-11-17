import { logger as loggerFn, type LogLevel } from '#/logger';
import type { TParams, TResultParams } from '#/params-l5';
import type { TLogger, TValidateFlatArray } from '#/types';
import { Filter } from '#gen/filter';
import { Include } from '#gen/include';
import { type TLimit, Limit } from '#gen/limit';
import { OrderBySortBy, type TSortBy } from '#gen/order-sort';
import { type TPage, Page } from '#gen/page';
import { query } from '#gen/query';
import { type TCondition, Search } from '#gen/search';
import { type TSearchJoin, SearchJoin } from '#gen/search-join';
import { With } from '#gen/with';
import { WithCount } from '#gen/with-count';

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

    const result: TResultParams = {
      ...Filter.build(params.filter, { logger }),
      ...Include.build(params.include, { logger }),
      ...Limit.build(params.limit, {
        defaultValue: options?.defaultOptions?.limit,
        logger,
      }),
      ...OrderBySortBy.build(params.orderBySortBy, {
        defaultSortBy: options?.defaultOptions?.sortBy,
        logger,
      }),
      ...Page.build(params.page ?? options?.defaultOptions?.page, {
        logger,
      }),
      ...Search.build(params.search, {
        defaultCondition: options?.defaultOptions?.searchCondition,
        includeSearchFields:
          params.includeSearchFields ??
          options?.defaultOptions?.includeSearchFields,
        logger,
      }),
      ...SearchJoin.build(
        params.searchJoin ?? options?.defaultOptions?.searchJoin,
        {
          logger,
        },
      ),
      ...With.build(params.with, { logger }),
      ...WithCount.build(params.withCount, { logger }),
      toParams: () => {},
    };

    result.toParams = () => query(result);
    return result;
  }

  runner.for =
    <TShape extends object>() =>
    (params: TParams<TShape> = {}) =>
      runner(params);

  return runner;
}
