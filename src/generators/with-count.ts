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

export type TWithCount<TTShape> = readonly NoInfer<Path<TTShape>>[];
export interface TWithCountOptions {
  readonly logger?: ILogger;
}

export function withCount<TShape extends object = Record<string, unknown>>(
  arg: TWithCount<TShape> = [],
  options: TWithCountOptions = {},
): string | undefined {
  const log = options.logger ?? defaultLogger;
  if (!isArray(arg)) {
    log?.error(msgNotArray(QUERY_LABELS.WTC, typeName(arg)));
    return undefined;
  }

  if (!arg.length) {
    log?.info(msgNoValues(QUERY_LABELS.WTC));
    return undefined;
  }

  const filteredValues = arg.filter((item) => {
    if (!isNonEmptyString(item)) {
      log?.warn(msgMustBeString(QUERY_LABELS.WTC, typeName(item)));
      return false;
    }
    return true;
  });

  if (!filteredValues.length) {
    log?.info(msgNoRemaining(QUERY_LABELS.WTC));
    return undefined;
  }

  const uniqueValues = [...new Set(filteredValues)];

  if (!uniqueValues.length) {
    log?.info(msgNoRemaining(QUERY_LABELS.WTC));
    return undefined;
  }

  return uniqueValues.join(';');
}
