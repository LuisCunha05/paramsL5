import { QUERY_LABELS, SEARCH_JOIN } from '#/constants';
import { defaultLogger } from '#/logger';
import { msgMustBeEither, msgMustBeString, msgNoValue } from '#/messages';
import type { TLogger, ToEnum } from '#/types';
import { isNonEmptyString, typeName } from '#/utils';

export type TSearchJoin = ToEnum<typeof SEARCH_JOIN>;
export interface TSearchJoinOptions {
  logger?: TLogger;
}

export function searchJoin(
  arg?: TSearchJoin,
  options: TSearchJoinOptions = {},
): string | undefined {
  const log = options.logger ?? defaultLogger;
  if (arg === undefined) {
    log?.info(msgNoValue(QUERY_LABELS.SJO));
    return undefined;
  }

  if (!isNonEmptyString(arg)) {
    log?.error(msgMustBeString(QUERY_LABELS.SJO, typeName(arg)));
    return undefined;
  }

  if (!(arg === SEARCH_JOIN.AND || arg === SEARCH_JOIN.OR)) {
    log?.error(
      msgMustBeEither(QUERY_LABELS.SJO, SEARCH_JOIN.AND, SEARCH_JOIN.OR, arg),
    );
    return undefined;
  }

  return arg;
}
