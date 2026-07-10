import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { LOG_LEVEL, URL_ENCODED_CHARS as URC } from "@/constants";
import { filter } from "@/generators/filter";
import { Logger } from "@/logger";

// biome-ignore lint/suspicious/noExplicitAny: Used to avoid many ts-expected-errors in the tests
let input: any;
// biome-ignore lint/suspicious/noExplicitAny: Used to avoid many ts-expected-errors in the tests
let result: any;
// biome-ignore lint/suspicious/noExplicitAny: Used to avoid many ts-expected-errors in the tests
let expected: any;

beforeEach(() => {
  input = undefined;
  result = undefined;
  expected = undefined;
});

const info = vi.fn();
const warn = vi.fn();
const error = vi.fn();
const logger = { info, warn, error };
const noOpLogger = Logger({ logLevel: LOG_LEVEL.NONE });

afterEach(() => {
  vi.clearAllMocks();
});

describe("filter function", () => {
  describe("formatting", () => {
    test("should format a valid array of strings", () => {
      input = ["a", "b", "c"];
      expected = {
        raw: "a;b;c",
        encoded: `a${URC.SEMICOLON}b${URC.SEMICOLON}c`,
      };

      result = filter(input, { logger: noOpLogger });

      expect(result).toEqual(expected);
    });

    test("should return unique values if there are duplicates", () => {
      input = ["a", "b", "a", "c", "b"];
      expected = {
        raw: "a;b;c",
        encoded: `a${URC.SEMICOLON}b${URC.SEMICOLON}c`,
      };

      result = filter(input, { logger: noOpLogger });

      expect(result).toEqual(expected);
    });
  });

  describe("validations and edge cases", () => {
    test("should return undefined if called with a non-array", () => {
      input = "not an array";

      result = filter(input, { logger: noOpLogger });

      expect(result).toBeUndefined();
    });

    test("should filter out non-string items", () => {
      input = ["a", 123, "b"];
      expected = {
        raw: "a;b",
        encoded: `a${URC.SEMICOLON}b`,
      };

      result = filter(input, { logger: noOpLogger });

      expect(result).toEqual(expected);
    });

    test("should filter out empty strings", () => {
      input = ["a", "", "b", "   "];
      expected = {
        raw: "a;b",
        encoded: `a${URC.SEMICOLON}b`,
      };

      result = filter(input, { logger: noOpLogger });

      expect(result).toEqual(expected);
    });
  });

  describe("filter logging", () => {
    test("should log error if argument is not an array", () => {
      input = "not an array";

      filter(input, { logger });

      expect(error).toHaveBeenCalledExactlyOnceWith(
        "Filter: argument must be an array, got string instead",
      );
    });

    test("should log info if an item is not a string", () => {
      input = ["a", 123];

      filter(input, { logger });

      expect(info).toHaveBeenCalledExactlyOnceWith(
        "Filter: include value must be a string, got number instead",
      );
    });

    test("should log info with empty array", () => {
      input = [];

      filter(input, { logger });

      expect(info).toHaveBeenCalledExactlyOnceWith("Filter: no values given");
    });

    test("should log info with no values remaining to parse", () => {
      input = [123];

      filter(input, { logger });

      expect(info).toHaveBeenCalledTimes(2);
      expect(info).toHaveBeenNthCalledWith(
        1,
        "Filter: include value must be a string, got number instead",
      );
      expect(info).toHaveBeenNthCalledWith(
        2,
        "Filter: no values remaining to parse",
      );
    });
  });
});
