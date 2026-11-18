import {
  ParamsL5ValidationError,
  type TValidationIssue,
} from '#/errors/ParamsL5ValidationError';
import { logger as loggerFn, type LogLevel } from '#/logger';
import type { TGenerator, TLogger, TResult, TValidateFlatArray } from '#/types';
import { type TParamsStrings, unwrap } from '#/utils';
import { type TFilter, Filter } from '#gen/filter';
import { type TInclude, Include } from '#gen/include';
import { type TLimit, Limit } from '#gen/limit';
import {
  OrderBySortBy,
  type TOrderBySortBy,
  type TSortBy,
} from '#gen/order-sort';
import { type TPage, Page } from '#gen/page';
import { query } from '#gen/query';
import { type TCondition, type TSearch, Search } from '#gen/search';
import { type TSearchJoin, SearchJoin } from '#gen/search-join';
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

export interface ParamsL5DefaultOptions {
  readonly sortBy?: TSortBy;
  readonly page?: TPage;
  readonly limit?: TLimit;
  readonly searchJoin?: TSearchJoin;
  readonly searchCondition?: TCondition;
  readonly includeSearchFields?: boolean;
}

export interface ParamsL5Options {
  readonly defaultOptions?: ParamsL5DefaultOptions;
  readonly logging?: {
    readonly logger?: TLogger;
    readonly logLevel: LogLevel;
  };
  readonly strict?: boolean;
}

export type ValidateParams<TInput> = {
  [KFn in keyof TInput]: KFn extends 'include' | 'with' | 'withCount' | 'filter'
    ? TValidateFlatArray<TInput[KFn]>
    : TInput[KFn];
};

export interface ParamsL5TypedRunner<TShape extends object> {
  readonly build: <const TInput extends TParams<TShape>>(
    params?: ValidateParams<TInput> extends TInput
      ? TInput
      : ValidateParams<TInput>,
  ) => TResultParams;
  readonly safe: <const TInput extends TParams<TShape>>(
    params?: ValidateParams<TInput> extends TInput
      ? TInput
      : ValidateParams<TInput>,
  ) => TResult<TResultParams>;
}

/**
 * Generates query parameters formatted for `l5-repository` with optional reusable configuration.
 *
 * @remarks
 * Can be instantiated with `new ParamsL5(options)` to hold defaults, logging, and `strict` settings,
 * or called via static `ParamsL5.build()` / `ParamsL5.safe()` / `ParamsL5.for()` methods.
 *
 * @example
 * ```typescript
 * const client = new ParamsL5({ defaultOptions: { limit: 15, sortBy: 'desc' } });
 * const params = client.build({ page: 2 });
 * console.log(params.toParams()); // => "limit=15&page=2"
 * ```
 */
export class ParamsL5 {
  readonly #defaultOptions?: ParamsL5DefaultOptions;
  readonly #logger: TLogger;
  readonly #strict: boolean;

  constructor(options: ParamsL5Options = {}) {
    this.#defaultOptions = options.defaultOptions;
    this.#strict = options.strict ?? true;
    this.#logger = loggerFn({
      logLevel: options.logging?.logLevel,
      logger: options.logging?.logger,
    });
  }

  static safe<TShape extends object = Record<string, unknown>>(
    params?: TParams<TShape>,
    options?: ParamsL5Options,
  ): TResult<TResultParams> {
    return new ParamsL5(options).safe(params);
  }

  static build<TShape extends object = Record<string, unknown>>(
    params?: TParams<TShape>,
    options?: ParamsL5Options,
  ): TResultParams {
    return new ParamsL5(options).build(params);
  }

  static for<TShape extends object>(
    options?: ParamsL5Options,
  ): ParamsL5TypedRunner<TShape> {
    return new ParamsL5(options).for<TShape>();
  }

  safe<TShape extends object = Record<string, unknown>>(
    params: TParams<TShape> = {},
  ): TResult<TResultParams> {
    const baseOptions = { logger: this.#logger, strict: this.#strict };
    const results = [
      Filter.safe(params.filter, baseOptions),
      Include.safe(params.include, baseOptions),
      Limit.safe(params.limit, {
        ...baseOptions,
        defaultValue: this.#defaultOptions?.limit,
      }),
      OrderBySortBy.safe(params.orderBySortBy, {
        ...baseOptions,
        defaultSortBy: this.#defaultOptions?.sortBy,
      }),
      Page.safe(params.page ?? this.#defaultOptions?.page, baseOptions),
      Search.safe(params.search, {
        ...baseOptions,
        defaultCondition: this.#defaultOptions?.searchCondition,
        includeSearchFields:
          params.includeSearchFields ??
          this.#defaultOptions?.includeSearchFields,
      }),
      SearchJoin.safe(params.searchJoin, {
        ...baseOptions,
        defaultSearchJoin: this.#defaultOptions?.searchJoin,
      }),
      With.safe(params.with, baseOptions),
      WithCount.safe(params.withCount, baseOptions),
    ] as const;

    const issues: TValidationIssue[] = [];
    const merged: TParamsStrings = {
      filter: undefined,
      include: undefined,
      limit: undefined,
      orderBy: undefined,
      page: undefined,
      search: undefined,
      searchFields: undefined,
      searchJoin: undefined,
      sortedBy: undefined,
      with: undefined,
      withCount: undefined,
    };

    for (const res of results) {
      if (res.success) {
        Object.assign(merged, res.data);
      } else {
        issues.push(...res.error.issues);
      }
    }

    if (issues.length) {
      return {
        error: ParamsL5ValidationError.fromIssues(issues),
        success: false,
      };
    }

    const result: TResultParams = {
      ...merged,
      toParams: () => query(result),
    };

    return { data: result, success: true };
  }

  build<TShape extends object = Record<string, unknown>>(
    params: TParams<TShape> = {},
  ): TResultParams {
    return unwrap(this.safe(params));
  }

  for<TShape extends object>(): ParamsL5TypedRunner<TShape> {
    return {
      build: (params: TParams<TShape> = {}) => this.build(params),
      safe: (params: TParams<TShape> = {}) => this.safe(params),
    };
  }
}

ParamsL5 satisfies TGenerator<
  TParams | undefined,
  ParamsL5Options,
  TResultParams
>;
