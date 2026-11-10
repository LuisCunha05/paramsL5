import { QUERY_NAMES } from '#s/constants';
import { filter } from '#s/generators/filter';
import { include } from '#s/generators/include';
import { type TLimit, limit } from '#s/generators/limit';
import { type TSortBy, orderBySortBy } from '#s/generators/order-sort';
import { type TPage, page } from '#s/generators/page';
import { type TCondition, search } from '#s/generators/search';
import { type TSearchJoin, searchJoin } from '#s/generators/search-join';
import { withRel } from '#s/generators/with';
import { logger as loggerFn, type LogLevel } from '#s/logger';
import type { TParams, TResultParams } from '#s/params-l5';
import type {
  ILogger,
  ValidateFlatArray,
  ValidateKeyTupleArray,
} from '#s/types';
import { toParams } from '#s/utils';

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
  logging?: { logger?: ILogger; logLevel: LogLevel };
}

export type ValidateParams<TInput> = {
  [KFn in keyof TInput]: KFn extends 'include' | 'with' | 'filter'
    ? ValidateFlatArray<TInput[KFn]>
    : KFn extends 'orderBySortBy' | 'search'
      ? ValidateKeyTupleArray<TInput[KFn]>
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
