import { QUERY_NAMES } from '#/constants';
import type { TGenerator, TLogger, TPathPipe, TResult } from '#/types';
import { filterWithDelimeter, unwrap } from '#/utils';

export type TWith<TTShape> = readonly NoInfer<TPathPipe<TTShape>>[];

export interface TWithOptions {
  readonly logger?: TLogger;
  readonly strict?: boolean;
}

export interface TWithResult {
  [QUERY_NAMES.WTH]: string | undefined;
}

/**
 * Formats relations to eager load via repository `with` into a semicolon-separated string.
 *
 * @remarks
 * Under strict mode (default), non-array inputs and non-string items produce a `ParamsL5ValidationError`.
 * Set `options.strict` to `false` to filter out invalid entries safely without throwing.
 *
 * @param value - Array of relation paths (supports dot and pipe notation).
 * @param options - Optional settings including custom logger and strict mode.
 * @returns An object `{ with }` containing a semicolon-separated string of unique relation paths, or `undefined`.
 *
 * @example
 * ```typescript
 * With.build(['author', 'comments.author']); // => { with: "author;comments.author" }
 * ```
 */
export class With {
  static safe<TShape extends object = Record<string, unknown>>(
    value?: TWith<TShape>,
    options?: TWithOptions,
  ): TResult<TWithResult> {
    return filterWithDelimeter({
      delimiter: ';',
      label: QUERY_NAMES.WTH,
      logger: options?.logger,
      strict: options?.strict,
      value,
    });
  }

  static build<TShape extends object = Record<string, unknown>>(
    value?: TWith<TShape>,
    options?: TWithOptions,
  ): TWithResult {
    return unwrap(With.safe(value, options));
  }
}

With satisfies TGenerator<TWith<unknown>, TWithOptions, TWithResult>;
