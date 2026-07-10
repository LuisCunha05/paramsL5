import type { ILogger } from '@/types';
import { isNumber, typeName } from '@/utils';

export type TLimit = number;

export type TLimitOptions = {
  logger?: ILogger;
};

export function limit(
  arg?: TLimit,
  options: TLimitOptions = {},
): string | undefined {
  const log = options.logger ?? console;
  if (arg === undefined) {
    log?.info('Limit: no value given');
    return;
  }

  if (!isInputValid(arg)) {
    log?.error(
      `Limit: must be a positive integer or zero, got ${typeName(arg)} instead`,
    );
    return;
  }

  return String(arg);
}

function predicate(value: number) {
  return Number.isInteger(value) && value >= 0;
}

function isInputValid(arg?: number): arg is number {
  return isNumber(arg, predicate);
}
