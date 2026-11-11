import { QUERY_LABELS } from '#/constants';
import { defaultLogger } from '#/logger';
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

/**
 * Formats related models to eager load into a comma-separated string (`include=profile,posts`).
 *
 * @remarks
 * Fields are validated: `null`, `undefined`, and invalid shapes (such as empty strings or non-string values) are filtered out safely.
 *
 * @param arg - Array of relation names.
 * @param options - Optional settings including custom logger.
 * @returns Comma-separated string of unique relation names, or `undefined` if none remain.
 *
 * @example
 * ```typescript
 * include(['profile', 'posts']); // => "profile,posts"
 * ```
 */
export function include<TShape extends object = Record<string, unknown>>(
  arg: TInclude<TShape> = [],
  options: TIncludeOptions = {},
): string | undefined {
  const log = options.logger ?? defaultLogger;
  if (!isArray(arg)) {
    log?.error(msgNotArray(QUERY_LABELS.INC, typeName(arg)));
    return undefined;
  }

  if (!arg.length) {
    log?.info(msgNoValues(QUERY_LABELS.INC));
    return undefined;
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
    return undefined;
  }

  const uniqueValues = [...new Set(filteredValues)];

  return uniqueValues.join(',');
}
