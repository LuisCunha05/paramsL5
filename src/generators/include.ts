import { QUERY_LABELS } from '#s/constants';
import { defaultLogger } from '#s/logger';
import {
  msgMustBeString,
  msgNoRemaining,
  msgNoValues,
  msgNotArray,
} from '#s/messages';
import type { TLogger, TPath } from '#s/types';
import { isArray, isNonEmptyString, typeName } from '#s/utils';

export type TInclude<TTShape> = readonly NoInfer<TPath<TTShape>>[];

export interface TIncludeOptions {
  logger?: TLogger;
}

export function include<TShape extends object = Record<string, unknown>>(
  arg: TInclude<TShape> = [],
  options: TIncludeOptions = {},
): string | undefined {
  const log = options.logger ?? defaultLogger;
  if (!isArray(arg)) {
    log?.error(msgNotArray(QUERY_LABELS.INC, typeName(arg)));
    return undefined;
  }

  if (!arg.length) {
    log?.info(msgNoValues(QUERY_LABELS.INC));
    return undefined;
  }

  const filteredValues = arg.reduce<TPath<TShape>[]>((result, item) => {
    if (!isNonEmptyString(item)) {
      log?.info(msgMustBeString(QUERY_LABELS.INC, typeName(item)));
      return result;
    }

    result.push(item);
    return result;
  }, []);

  if (!filteredValues.length) {
    log?.info(msgNoRemaining(QUERY_LABELS.INC));
    return undefined;
  }

  const uniqueValues = [...new Set(filteredValues)];

  return uniqueValues.join(',');
}
