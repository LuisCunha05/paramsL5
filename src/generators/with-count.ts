import { QUERY_NAMES } from '#/constants';
import type { TGenerator, TLogger, TPath, TResult } from '#/types';
import { filterWithDelimeter, unwrap } from '#/utils';

export type TWithCount<TTShape> = readonly NoInfer<TPath<TTShape>>[];

export interface TWithCountOptions {
  readonly logger?: TLogger;
}

export interface TWithCountResult {
  [QUERY_NAMES.WTC]: string | undefined;
}

/**
 * Formats relations whose count should be loaded (`withCount`) into a semicolon-separated string.
 *
 * @remarks
 * Fields are automatically validated: `null`, `undefined`, and invalid shapes are filtered out safely.
 *
 * @param arg - Array of relation names to count.
 * @param options - Optional settings including custom logger.
 * @returns An object `{ withCount }` containing a semicolon-separated string of unique relation names, or `undefined`.
 *
 * @example
 * ```typescript
 * WithCount.build(['comments', 'likes']); // => { withCount: "comments;likes" }
 * ```
 */
export class WithCount {
  static safe<TShape extends object = Record<string, unknown>>(
    value?: TWithCount<TShape>,
    options?: TWithCountOptions,
  ): TResult<TWithCountResult> {
    return filterWithDelimeter(QUERY_NAMES.WTC, ';', value, options?.logger);
  }

  static build<TShape extends object = Record<string, unknown>>(
    value?: TWithCount<TShape>,
    options?: TWithCountOptions,
  ): TWithCountResult {
    return unwrap(WithCount.safe(value, options));
  }
}

WithCount satisfies TGenerator<
  TWithCount<unknown>,
  TWithCountOptions,
  TWithCountResult
>;
