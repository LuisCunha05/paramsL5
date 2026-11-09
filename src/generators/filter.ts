import { QUERY_LABELS } from '#s/constants';
import { defaultLogger } from '#s/logger';
import { MESSAGES } from '#s/messages';
import type { ILogger, Path } from '#s/types';
import { isArray, isNonEmptyString, typeName } from '#s/utils';

export type TFilter<TTShape> = readonly NoInfer<Path<TTShape>>[];

export interface TFilterOptions {
  readonly logger?: ILogger;
}

export function filter<TShape extends object = Record<string, unknown>>(
  arg: TFilter<TShape> = [],
  options: TFilterOptions = {},
): string | undefined {
  const log = options.logger ?? defaultLogger;
  if (!isArray(arg)) {
    log?.error(MESSAGES.notArray(QUERY_LABELS.FLT, typeName(arg)));
    return undefined;
  }

  if (!arg.length) {
    log?.info(MESSAGES.noValues(QUERY_LABELS.FLT));
    return undefined;
  }

  const filteredValues = arg.filter((item) => {
    if (!isNonEmptyString(item)) {
      log?.info(MESSAGES.mustBeString(QUERY_LABELS.FLT, typeName(item)));
      return false;
    }
    return true;
  });

  if (!filteredValues.length) {
    log?.info(MESSAGES.noRemaining(QUERY_LABELS.FLT));
    return undefined;
  }

  const uniqueValues = [...new Set(filteredValues)];

  if (!uniqueValues.length) {
    return undefined;
  }

  return uniqueValues.join(';');
}
