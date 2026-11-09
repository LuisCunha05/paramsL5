import { SEARCH_JOIN } from '#s/constants';
import { defaultLogger } from '#s/logger';
import type { ILogger } from '#s/types';
import { isNonEmptyString, typeName } from '#s/utils';

export type TSearchJoin = (typeof SEARCH_JOIN)[keyof typeof SEARCH_JOIN];
export interface TSearchJoinOptions {
  logger?: ILogger;
}

export function searchJoin(
  arg?: TSearchJoin,
  options: TSearchJoinOptions = {},
): string | undefined {
  const log = options.logger ?? defaultLogger;
  if (arg === undefined) {
    log?.info('SearchJoin: no value given');
    return undefined;
  }

  if (!isNonEmptyString(arg)) {
    log?.error(`SearchJoin: must be a string, got ${typeName(arg)} instead`);
    return undefined;
  }

  if (!(arg === SEARCH_JOIN.AND || arg === SEARCH_JOIN.OR)) {
    log?.error(
      `SearchJoin: must be either "${SEARCH_JOIN.AND}" or "${SEARCH_JOIN.OR}", got "${arg}" instead`,
    );
    return undefined;
  }

  return arg;
}
