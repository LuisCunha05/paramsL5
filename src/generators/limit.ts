import { QUERY_LABELS } from '#s/constants';
import { defaultLogger } from '#s/logger';
import { MESSAGES } from '#s/messages';
import type { ILogger } from '#s/types';
import { isNumber, typeName } from '#s/utils';

export type TLimit = number;

export interface TLimitOptions {
  logger?: ILogger;
  defaultValue?: TLimit;
}

const MIN_LIMIT = 0;

export function limit(
  arg?: TLimit,
  options: TLimitOptions = {},
): string | undefined {
  const log = options.logger ?? defaultLogger;
  const val = arg ?? options.defaultValue;
  if (val === undefined) {
    log?.info(MESSAGES.noValue(QUERY_LABELS.LMT));
    return undefined;
  }

  if (!isInputValid(val)) {
    log?.error(
      MESSAGES.mustBePositiveInteger(QUERY_LABELS.LMT, typeName(val), true),
    );
    return undefined;
  }

  return String(val);
}

function predicate(value: number) {
  return Number.isInteger(value) && value >= MIN_LIMIT;
}

function isInputValid(arg?: number): arg is number {
  return isNumber(arg, predicate);
}
