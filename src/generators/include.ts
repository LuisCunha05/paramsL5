import { QUERY_NAMES } from '#/constants';
import type { TGenerator, TLogger, TPath, TResult } from '#/types';
import { filterWithDelimeter, unwrap } from '#/utils';

export type TInclude<TTShape> = readonly NoInfer<TPath<TTShape>>[];

export interface TIncludeOptions {
  readonly logger?: TLogger;
  readonly strict?: boolean;
}

export interface TIncludeResult {
  [QUERY_NAMES.INC]: string | undefined;
}

/**
 * Formats related models to eager load into a comma-separated string (`include=profile,posts`).
 *
 * @remarks
 * Under strict mode (default), non-array inputs and non-string items produce a `ParamsL5ValidationError`.
 * Set `options.strict` to `false` to filter out invalid entries safely without throwing.
 *
 * @param value - Array of relation names.
 * @param options - Optional settings including custom logger and strict mode.
 * @returns An object `{ include }` containing a comma-separated string of unique relation names, or `undefined`.
 *
 * @example
 * ```typescript
 * Include.build(['profile', 'posts']); // => { include: "profile,posts" }
 * ```
 */
export class Include {
  static safe<TShape extends object = Record<string, unknown>>(
    value?: TInclude<TShape>,
    options?: TIncludeOptions,
  ): TResult<TIncludeResult> {
    return filterWithDelimeter({
      delimiter: ',',
      label: QUERY_NAMES.INC,
      logger: options?.logger,
      strict: options?.strict,
      value,
    });
  }

  static build<TShape extends object = Record<string, unknown>>(
    value?: TInclude<TShape>,
    options?: TIncludeOptions,
  ): TIncludeResult {
    return unwrap(Include.safe(value, options));
  }
}

Include satisfies TGenerator<
  TInclude<unknown>,
  TIncludeOptions,
  TIncludeResult
>;
