import { QUERY_LABELS } from '#s/constants';
import { defaultLogger } from '#s/logger';
import {
  msgMustBeString,
  msgNoRemaining,
  msgNoValues,
  msgNotArray,
} from '#s/messages';
import type { ILogger, Path } from '#s/types';
import { isArray, isNonEmptyString, typeName } from '#s/utils';

export type TWith<TTShape> = readonly NoInfer<Path<TTShape>>[];
export interface TWithOptions {
  logger?: ILogger;
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
