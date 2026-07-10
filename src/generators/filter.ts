import type { ILogger, TResult } from "@/types";
import { encodeSearchParam, isNonEmptyString, typeName } from "@/utils";

export type TFilter = Array<string>;

export type TFilterOptions = {
  logger?: ILogger;
};

export function filter(
  arg: TFilter = [],
  options: TFilterOptions = {},
): TResult | undefined {
  const log = options.logger ?? console;
  if (!Array.isArray(arg)) {
    log?.error(
      `Filter: argument must be an array, got ${typeName(arg)} instead`,
    );
    return;
  }

  if (!arg.length) {
    log?.info("Filter: no values given");
    return;
  }

  const filteredValues = arg.filter((item) => {
    if (!isNonEmptyString(item)) {
      log?.info(
        `Filter: include value must be a string, got ${typeName(item)} instead`,
      );
      return false;
    }
    return true;
  });

  if (!filteredValues.length) {
    log?.info("Filter: no values remaining to parse");
    return;
  }

  const uniqueValues = Array.from(new Set(filteredValues));

  if (!uniqueValues.length) return;

  return {
    raw: uniqueValues.join(";"),
    encoded: encodeSearchParam(uniqueValues.join(";")),
  };
}
