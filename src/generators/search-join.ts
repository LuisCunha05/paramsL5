import { QUERY_LABELS, QUERY_NAMES, SEARCH_JOIN } from '#/constants';
import { defaultLogger } from '#/logger';
import { msgMustBeEither, msgMustBeString, msgNoValue } from '#/messages';
import type { TLogger, ToEnum } from '#/types';
import { isNonEmptyString, typeName } from '#/utils';

export type TSearchJoin = ToEnum<typeof SEARCH_JOIN>;
export interface TSearchJoinOptions {
  logger?: TLogger;
}

export interface TSearchJoinResult {
  [QUERY_NAMES.SJO]: string | undefined;
}

const EMPTY_RESULT = {
  [QUERY_NAMES.SJO]: undefined,
} as const;

/**
 * Formats the logical operator (`and` | `or`) that connects multiple search conditions.
 *
 * @remarks
 * Fields are validated: `null`, `undefined`, and values other than `'and'` or `'or'` are filtered out safely.
 *
 * @param arg - The join strategy (`'and'` or `'or'`).
 * @param options - Optional settings including custom logger.
 * @returns An object `{ searchJoin }` containing the validated join string (`'and'` | `'or'`), or `undefined` if invalid.
 *
 * @example
 * ```typescript
 * searchJoin('and'); // => { searchJoin: "and" }
 * ```
 */
export function searchJoin(
  arg?: TSearchJoin,
  options: TSearchJoinOptions = {},
): TSearchJoinResult {
  const log = options.logger ?? defaultLogger;
  if (arg === undefined) {
    log?.info(msgNoValue(QUERY_LABELS.SJO));
    return EMPTY_RESULT;
  }

  if (!isNonEmptyString(arg)) {
    log?.error(msgMustBeString(QUERY_LABELS.SJO, typeName(arg)));
    return EMPTY_RESULT;
  }

  if (!(arg === SEARCH_JOIN.AND || arg === SEARCH_JOIN.OR)) {
    log?.error(
      msgMustBeEither(QUERY_LABELS.SJO, SEARCH_JOIN.AND, SEARCH_JOIN.OR, arg),
    );
    return EMPTY_RESULT;
  }

  return {
    [QUERY_NAMES.SJO]: arg,
  };
}
