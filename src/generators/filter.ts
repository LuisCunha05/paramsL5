import { QUERY_NAMES } from '#/constants';
import type { TLogger, TPath, TResult, TGenerator } from '#/types';
import { filterWithDelimeter, unwrap } from '#/utils';

export type TFilter<TTShape> = readonly NoInfer<TPath<TTShape>>[];

export interface TFilterOptions {
  readonly logger?: TLogger;
  readonly strict?: boolean;
}

export interface TFilterResult {
  [QUERY_NAMES.FLT]: string | undefined;
}

/**
 * Formats database columns to retrieve into a semicolon-separated string (`filter=id;name`).
 *
 * @remarks
 * Fields are automatically validated: `null`, `undefined`, and invalid shapes are filtered out safely.
 *
 * @param arg - Array of column field names.
 * @param options - Optional settings including custom logger.
 * @returns An object `{ filter }` containing a semicolon-separated string of unique column names, or `undefined`.
 *
 * @example
 * ```typescript
 * Filter.build(['id', 'name', 'email']); // => { filter: "id;name;email" }
 * ```
 */

export class Filter {
  static safe<TShape extends object = Record<string, unknown>>(
    value?: TFilter<TShape>,
    options?: TFilterOptions,
  ): TResult<TFilterResult> {
    return filterWithDelimeter({
      delimiter: ';',
      label: QUERY_NAMES.FLT,
      logger: options?.logger,
      strict: options?.strict,
      value,
    });
  }

  static build<TShape extends object = Record<string, unknown>>(
    value?: TFilter<TShape>,
    options?: TFilterOptions,
  ): TFilterResult {
    return unwrap(Filter.safe(value, options));
  }
}

Filter satisfies TGenerator<TFilter<unknown>, TFilterOptions, TFilterResult>;
