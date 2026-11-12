import { QUERY_LABELS, QUERY_NAMES } from '#/constants';
import { defaultLogger } from '#/logger';
import {
  msgMustBeString,
  msgNoRemaining,
  msgNoValues,
  msgNotArray,
} from '#/messages';
import type { TLogger, TPathPipe } from '#/types';
import { isArray, isNonEmptyString, typeName } from '#/utils';

export type TWith<TTShape> = readonly NoInfer<TPathPipe<TTShape>>[];
export interface TWithOptions {
  logger?: TLogger;
}

export interface TWithResult {
  [QUERY_NAMES.WTH]: string | undefined;
}

const EMPTY_RESULT = {
  [QUERY_NAMES.WTH]: undefined,
} as const;

/**
 * Formats relations to eager load via repository `with` into a semicolon-separated string.
 *
 * @remarks
 * Fields are validated: `null`, `undefined`, and invalid shapes (such as empty strings or non-string values) are filtered out safely.
 *
 * @param arg - Array of relation paths (supports dot and pipe notation).
 * @param options - Optional settings including custom logger.
 * @returns An object `{ with }` containing a semicolon-separated string of unique relation paths, or `undefined`.
 *
 * @example
 * ```typescript
 * withRel(['author', 'comments.author']); // => { with: "author;comments.author" }
 * ```
 */
export function withRel<TShape extends object = Record<string, unknown>>(
  arg: TWith<TShape> = [],
  options: TWithOptions = {},
): TWithResult {
  const log = options.logger ?? defaultLogger;
  if (!isArray(arg)) {
    log?.error(msgNotArray(QUERY_LABELS.WTH, typeName(arg)));
    return EMPTY_RESULT;
  }

  if (!arg.length) {
    log?.info(msgNoValues(QUERY_LABELS.WTH));
    return EMPTY_RESULT;
  }

  const filteredValues = arg.filter((item) => {
    if (!isNonEmptyString(item)) {
      log?.warn(msgMustBeString(QUERY_LABELS.WTH, typeName(item)));
      return false;
    }
    return true;
  });

  if (!filteredValues.length) {
    log?.info(msgNoRemaining(QUERY_LABELS.WTH));
    return EMPTY_RESULT;
  }

  const uniqueValues = [...new Set(filteredValues)];

  if (!uniqueValues.length) {
    log?.info(msgNoRemaining(QUERY_LABELS.WTH));
    return EMPTY_RESULT;
  }

  return {
    [QUERY_NAMES.WTH]: uniqueValues.join(';'),
  };
}
