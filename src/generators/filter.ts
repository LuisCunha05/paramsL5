import { QUERY_LABELS } from '#/constants';
import { defaultLogger } from '#/logger';
import {
  msgMustBeString,
  msgNoRemaining,
  msgNoValues,
  msgNotArray,
} from '#/messages';
import type { TLogger, TPath } from '#/types';
import { isArray, isNonEmptyString, typeName } from '#/utils';

export type TFilter<TTShape> = readonly NoInfer<TPath<TTShape>>[];

export interface TFilterOptions {
  readonly logger?: TLogger;
}

export function filter<TShape extends object = Record<string, unknown>>(
  arg: TFilter<TShape> = [],
  options: TFilterOptions = {},
): string | undefined {
  const log = options.logger ?? defaultLogger;
  if (!isArray(arg)) {
    log?.error(msgNotArray(QUERY_LABELS.FLT, typeName(arg)));
    return undefined;
  }

  if (!arg.length) {
    log?.info(msgNoValues(QUERY_LABELS.FLT));
    return undefined;
  }

  const filteredValues = arg.filter((item) => {
    if (!isNonEmptyString(item)) {
      log?.info(msgMustBeString(QUERY_LABELS.FLT, typeName(item)));
      return false;
    }
    return true;
  });

  if (!filteredValues.length) {
    log?.info(msgNoRemaining(QUERY_LABELS.FLT));
    return undefined;
  }

  const uniqueValues = [...new Set(filteredValues)];

  if (!uniqueValues.length) {
    return undefined;
  }

  return uniqueValues.join(';');
}
