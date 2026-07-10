import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { LOG_LEVEL } from "@/constants";
import { searchCriteria } from "@/generators/searchCriteria";
import { Logger } from "@/logger";

// biome-ignore lint/suspicious/noExplicitAny: Used to avoid many ts-expected-errors in the tests
let input: any;
// biome-ignore lint/suspicious/noExplicitAny: Used to avoid many ts-expected-errors in the tests
let result: any;
// biome-ignore lint/suspicious/noExplicitAny: Used to avoid many ts-expected-errors in the tests
let expected: any;

const info = vi.fn();
const warn = vi.fn();
const error = vi.fn();
const logger = { info, warn, error };
const noOpLogger = Logger({ logLevel: LOG_LEVEL.NONE });

beforeEach(() => {
  input = undefined;
  result = undefined;
  expected = undefined;
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("SearchCriteria params generation", () => {
  test("Should generate params correct string key-value", () => {
    input = [["key", "value"]];
    expected = {
      raw: "key=value",
      encoded: "key=value",
    };

    result = searchCriteria(input);

    expect(result).toEqual(expected);
  });

  test("Should generate params correct boolean(true) key-value", () => {
    input = [["key", true]];
    expected = {
      raw: "key=true",
      encoded: "key=true",
    };

    result = searchCriteria(input);

    expect(result).toEqual(expected);
  });

  test("Should generate params correct boolean(false) key-value", () => {
    input = [["key", false]];
    expected = {
      raw: "key=false",
      encoded: "key=false",
    };

    result = searchCriteria(input);

    expect(result).toEqual(expected);
  });

  test("Should generate params correct number key-value", () => {
    input = [["key", 7]];
    expected = {
      raw: "key=7",
      encoded: "key=7",
    };

    result = searchCriteria(input);

    expect(result).toEqual(expected);
  });

  test("Should generate string params with multiple key-values", () => {
    input = [
      ["key1", "value"],
      ["key2", 777],
      ["key3", false],
    ];
    expected = {
      raw: "key1=value&key2=777&key3=false",
      encoded: "key1=value&key2=777&key3=false",
    };

    result = searchCriteria(input);

    expect(result).toEqual(expected);
  });

  test("Should capture the last element with same key", () => {
    input = [
      ["key", "value1"],
      ["key", "value2"],
    ];
    expected = {
      raw: "key=value2",
      encoded: "key=value2",
    };

    result = searchCriteria(input);

    expect(result).toEqual(expected);
  });
});

describe("SearchCriteria validation", () => {
  test("Should return undefined with empty input", () => {
    result = searchCriteria(undefined, { logger: noOpLogger });

    expect(result).toBeUndefined();
  });

  test("Shouldn't accept undefined for key", () => {
    input = [[undefined, "value1"]];

    result = searchCriteria(input, { logger: noOpLogger });

    expect(result).toBeUndefined();
  });

  test("Shouldn't accept number for key", () => {
    input = [[2, "value1"]];

    result = searchCriteria(input, { logger: noOpLogger });

    expect(result).toBeUndefined();
  });

  test("Shouldn't accept object for key", () => {
    input = [[{}, "value1"]];

    result = searchCriteria(input, { logger: noOpLogger });

    expect(result).toBeUndefined();
  });

  test("Shouldn't accept array for key", () => {
    input = [[[], "value1"]];

    result = searchCriteria(input, { logger: noOpLogger });

    expect(result).toBeUndefined();
  });

  test("Shouldn't accept null for key", () => {
    input = [[null, "value1"]];

    result = searchCriteria(input, { logger: noOpLogger });

    expect(result).toBeUndefined();
  });

  test("Shouldn't accept undefined for value", () => {
    input = [["key"]];

    result = searchCriteria(input, { logger: noOpLogger });

    expect(result).toBeUndefined();
  });
});

describe("SearchCriteria logging", () => {
  test("should log error if arg is not an array", () => {
    input = {};

    searchCriteria(input, { logger });

    expect(error).toHaveBeenCalledWith(
      "SearchCriteria: keys must have a type of array, got object instead",
    );
  });

  test("should log warn if item is not an array", () => {
    input = ["invalid"];

    searchCriteria(input, { logger });

    expect(warn).toHaveBeenCalledWith(
      "SearchCriteria: must have a type of array, got string instead",
    );
  });

  test("should log warn if item does not have exactly 2 elements", () => {
    input = [["key"]];

    searchCriteria(input, { logger });

    expect(warn).toHaveBeenCalledWith(
      "SearchCriteria: must have a key-value array, but got length 1 at index 0 instead",
    );
  });

  test("should log warn if key is not a non-empty string", () => {
    input = [[123, "value"]];

    searchCriteria(input, { logger });

    expect(warn).toHaveBeenCalledWith(
      "SearchCriteria: must have keys as non-empty strings, but got number at index 0 instead",
    );
  });

  test("should log info with empty array", () => {
    input = [];

    searchCriteria(input, { logger });

    expect(info).toHaveBeenCalledWith("SearchCriteria: no values given");
  });

  test("should log info when value ins't baseValue", () => {
    input = [["key", null]];

    searchCriteria(input, { logger });

    expect(info).toHaveBeenCalledTimes(2);

    expect(info).toHaveBeenNthCalledWith(
      1,
      `SearchCriteria: ignoring invalid value, got null at index 0 instead`,
    );
    expect(info).toHaveBeenNthCalledWith(
      2,
      "SearchCriteria: no values remaning to parse",
    );
  });

  test("external logger should log invalid argument", () => {
    searchCriteria(null as any, { logger });
    expect(error).toHaveBeenCalledWith(
      "SearchCriteria: keys must have a type of array, got null instead",
    );
  });

  test("external logger should log empty value", () => {
    searchCriteria([], { logger });
    expect(info).toHaveBeenCalledWith("SearchCriteria: no values given");
  });

  test("external logger should log invalid type for sub-argument", () => {
    searchCriteria([{} as any], { logger });
    expect(warn).toHaveBeenCalledWith(
      "SearchCriteria: must have a type of array, got object instead",
    );
  });

  test("external logger should log invalid amount of arguments", () => {
    searchCriteria([["key"] as any], { logger });
    expect(warn).toHaveBeenCalledWith(
      "SearchCriteria: must have a key-value array, but got length 1 at index 0 instead",
    );
  });

  test("external logger should log invalid key type for sub-argument", () => {
    searchCriteria([[1, "value"] as any], { logger });
    expect(warn).toHaveBeenCalledWith(
      "SearchCriteria: must have keys as non-empty strings, but got number at index 0 instead",
    );
  });

  test("external logger should log non-baseValue value argument", () => {
    searchCriteria([["key", null] as any], { logger });
    expect(info).toHaveBeenCalledWith(
      "SearchCriteria: ignoring invalid value, got null at index 0 instead",
    );
  });

  test("external logger should log no remaning values", () => {
    searchCriteria([["key", null] as any], { logger });
    expect(info).toHaveBeenCalledWith(
      "SearchCriteria: no values remaning to parse",
    );
  });
});
