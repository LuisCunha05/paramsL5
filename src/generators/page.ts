import { QUERY_LABELS } from '#/constants';
import { defaultLogger } from '#/logger';
import { msgMustBePositiveInteger, msgNoValue } from '#/messages';
import type { TLogger } from '#/types';
import { isNumber, typeName } from '#/utils';

export type TPage = number;

export interface TPageOptions {
  logger?: TLogger;
}

const MIN_PAGE = 0;
export function page(
  arg?: TPage,
  options: TPageOptions = {},
): string | undefined {
  const log = options.logger ?? defaultLogger;

  if (arg === undefined) {
    log?.info(msgNoValue(QUERY_LABELS.PAG));
    return undefined;
  }

  if (!isInputValid(arg)) {
    log?.error(
      msgMustBePositiveInteger(QUERY_LABELS.PAG, typeName(arg), false),
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
