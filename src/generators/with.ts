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
