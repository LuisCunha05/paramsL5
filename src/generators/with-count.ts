import { QUERY_LABELS, QUERY_NAMES } from '#/constants';
import {
  msgMustBeString,
  msgNoRemaining,
  msgNoValues,
  msgNotArray,
} from '#/messages';
import type { TLogger, TPath } from '#/types';
import { isArray, isNonEmptyString, typeName } from '#/utils';

export type TWithCount<TTShape> = readonly NoInfer<TPath<TTShape>>[];
export interface TWithCountOptions {
  readonly logger?: TLogger;
}

export interface TWithCountResult {
  [QUERY_NAMES.WTC]: string | undefined;
}

const EMPTY_RESULT = {
  [QUERY_NAMES.WTC]: undefined,
} as const;

/**
 * Formats relations whose count should be loaded (`withCount`) into a semicolon-separated string.
 *
 * @remarks
 * Fields are validated: `null`, `undefined`, and invalid shapes (such as empty strings or non-string values) are filtered out safely.
 *
 * @param arg - Array of relation names to count.
 * @param options - Optional settings including custom logger.
 * @returns An object `{ withCount }` containing a semicolon-separated string of unique relation names, or `undefined`.
 *
 * @example
 * ```typescript
 * withCount(['comments', 'likes']); // => { withCount: "comments;likes" }
 * ```
 */
export function withCount<TShape extends object = Record<string, unknown>>(
  arg: TWithCount<TShape> = [],
  options: TWithCountOptions = {},
): TWithCountResult {
  const log = options.logger;
  if (!isArray(arg)) {
    log?.error(msgNotArray(QUERY_LABELS.WTC, typeName(arg)));
    return EMPTY_RESULT;
  }

  if (!arg.length) {
    log?.info(msgNoValues(QUERY_LABELS.WTC));
    return EMPTY_RESULT;
  }

  const filteredValues = arg.filter((item) => {
    if (!isNonEmptyString(item)) {
      log?.warn(msgMustBeString(QUERY_LABELS.WTC, typeName(item)));
      return false;
    }
    return true;
  });

  if (!filteredValues.length) {
    log?.info(msgNoRemaining(QUERY_LABELS.WTC));
    return EMPTY_RESULT;
  }

  const uniqueValues = [...new Set(filteredValues)];

  if (!uniqueValues.length) {
    log?.info(msgNoRemaining(QUERY_LABELS.WTC));
    return EMPTY_RESULT;
  }

  return {
    [QUERY_NAMES.WTC]: uniqueValues.join(';'),
  };
}
