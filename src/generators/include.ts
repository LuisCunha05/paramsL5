import { QUERY_NAMES } from '#/constants';
import type { TGenerator, TLogger, TPath, TResult } from '#/types';
import { filterWithDelimeter, unwrap } from '#/utils';

export type TInclude<TTShape> = readonly NoInfer<TPath<TTShape>>[];

export interface TIncludeOptions {
  readonly logger?: TLogger;
}

export interface TIncludeResult {
  [QUERY_NAMES.INC]: string | undefined;
}

/**
 * Formats related models to eager load into a comma-separated string (`include=profile,posts`).
 *
 * @remarks
 * Fields are automatically validated: `null`, `undefined`, and invalid shapes are filtered out safely.
 *
 * @param arg - Array of relation names.
 * @param options - Optional settings including custom logger.
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
    return filterWithDelimeter(QUERY_NAMES.INC, ',', value, options?.logger);
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
