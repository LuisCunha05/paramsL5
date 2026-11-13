import { QUERY_LABELS, QUERY_NAMES } from '#/constants';
import {
  msgMustBeString,
  msgNoRemaining,
  msgNoValues,
  msgNotArray,
} from '#/messages';
import type { TLogger, TPath } from '#/types';
import { isArray, isNonEmptyString, typeName } from '#/utils';

export type TInclude<TTShape> = readonly NoInfer<TPath<TTShape>>[];

export interface TIncludeOptions {
  logger?: TLogger;
}

export interface TIncludeResult {
  [QUERY_NAMES.INC]: string | undefined;
}

const EMPTY_RESULT = {
  [QUERY_NAMES.INC]: undefined,
} as const;

/**
 * Formats related models to eager load into a comma-separated string (`include=profile,posts`).
 *
 * @remarks
 * Fields are validated: `null`, `undefined`, and invalid shapes (such as empty strings or non-string values) are filtered out safely.
 *
 * @param arg - Array of relation names.
 * @param options - Optional settings including custom logger.
 * @returns An object `{ include }` containing a comma-separated string of unique relation names, or `undefined`.
 *
 * @example
 * ```typescript
 * include(['profile', 'posts']); // => { include: "profile,posts" }
 * ```
 */
export function include<TShape extends object = Record<string, unknown>>(
  arg: TInclude<TShape> = [],
  options: TIncludeOptions = {},
): TIncludeResult {
  const log = options.logger;
  if (!isArray(arg)) {
    log?.error(msgNotArray(QUERY_LABELS.INC, typeName(arg)));
    return EMPTY_RESULT;
  }

  if (!arg.length) {
    log?.info(msgNoValues(QUERY_LABELS.INC));
    return EMPTY_RESULT;
  }

  const filteredValues = arg.reduce<TPath<TShape>[]>((result, item) => {
    if (!isNonEmptyString(item)) {
      log?.info(msgMustBeString(QUERY_LABELS.INC, typeName(item)));
      return result;
    }

    result.push(item);
    return result;
  }, []);

  if (!filteredValues.length) {
    log?.info(msgNoRemaining(QUERY_LABELS.INC));
    return EMPTY_RESULT;
  }

  const uniqueValues = [...new Set(filteredValues)];

  return {
    [QUERY_NAMES.INC]: uniqueValues.join(','),
  };
}
