import { QUERY_LABELS } from '#s/constants';
import { defaultLogger } from '#s/logger';
import { MESSAGES } from '#s/messages';
import type { ILogger } from '#s/types';
import { isNumber, typeName } from '#s/utils';

export type TPage = number;

export interface TPageOptions {
  logger?: ILogger;
}

const MIN_PAGE = 0;
export function page(
  arg?: TPage,
  options: TPageOptions = {},
): string | undefined {
  const log = options.logger ?? defaultLogger;

  if (arg === undefined) {
    log?.info(MESSAGES.noValue(QUERY_LABELS.PAG));
    return undefined;
  }

  if (!isInputValid(arg)) {
    log?.error(
      MESSAGES.mustBePositiveInteger(QUERY_LABELS.PAG, typeName(arg), false),
    );
    return undefined;
  }

  return String(arg);
}

function predicate(value: number) {
  return Number.isInteger(value) && value > MIN_PAGE;
}

function isInputValid(arg?: number): arg is number {
  return isNumber(arg, predicate);
}
