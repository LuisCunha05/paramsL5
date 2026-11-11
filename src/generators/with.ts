import { QUERY_LABELS } from '#/constants';
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

/**
 * Formats relations to eager load via repository `with` into a semicolon-separated string.
 *
 * @remarks
 * Fields are validated: `null`, `undefined`, and invalid shapes (such as empty strings or non-string values) are filtered out safely.
 *
 * @param arg - Array of relation paths (supports dot and pipe notation).
 * @param options - Optional settings including custom logger.
 * @returns Semicolon-separated string of unique relation paths, or `undefined` if none remain.
 *
 * @example
 * ```typescript
 * withRel(['author', 'comments.author']); // => "author;comments.author"
 * ```
 */
export function withRel<TShape extends object = Record<string, unknown>>(
  arg: TWith<TShape> = [],
  options: TWithOptions = {},
): string | undefined {
  const log = options.logger ?? defaultLogger;
  if (!isArray(arg)) {
    log?.error(msgNotArray(QUERY_LABELS.WTH, typeName(arg)));
    return undefined;
  }

  if (!arg.length) {
    log?.info(msgNoValues(QUERY_LABELS.WTH));
    return undefined;
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
    return undefined;
  }

  const uniqueValues = [...new Set(filteredValues)];

  if (!uniqueValues.length) {
    log?.info(msgNoRemaining(QUERY_LABELS.WTH));
    return undefined;
  }

  return uniqueValues.join(';');
}
