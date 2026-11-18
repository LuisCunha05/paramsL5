import { QUERY_NAMES } from '#/constants';
import type { TGenerator, TLogger, TPath, TResult } from '#/types';
import { filterWithDelimeter, unwrap } from '#/utils';

export type TWithCount<TTShape> = readonly NoInfer<TPath<TTShape>>[];

export interface TWithCountOptions {
  readonly logger?: TLogger;
  readonly strict?: boolean;
}

export interface TWithCountResult {
  [QUERY_NAMES.WTC]: string | undefined;
}

/**
 * Formats relations whose count should be loaded (`withCount`) into a semicolon-separated string.
 *
 * @remarks
 * Under strict mode (default), non-array inputs and non-string items produce a `ParamsL5ValidationError`.
 * Set `options.strict` to `false` to filter out invalid entries safely without throwing.
 *
 * @param value - Array of relation names to count.
 * @param options - Optional settings including custom logger and strict mode.
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
    return filterWithDelimeter({
      delimiter: ';',
      label: QUERY_NAMES.WTC,
      logger: options?.logger,
      strict: options?.strict,
      value,
    });
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
