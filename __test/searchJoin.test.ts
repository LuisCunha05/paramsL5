import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { LOG_LEVEL, SEARCH_JOIN } from "@/constants";
import { searchJoin } from "@/generators/searchJoin";
import { Logger } from "@/logger";

// biome-ignore lint/suspicious/noExplicitAny: Used to avoid many ts-expected-errors in the tests
let input: any;
let result: string | undefined;
let expected: string | undefined;

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

describe("searchJoin function", () => {
  describe("formatting", () => {
    test("should format searchJoin correctly", () => {
      input = SEARCH_JOIN.AND;
      expected = SEARCH_JOIN.AND;

      result = searchJoin(input, { logger: noOpLogger });

      expect(result).toEqual(expected);
    });
  });

  describe("validations and edge cases", () => {
    test("should return undefined if called with a non-string", () => {
      input = 123;

      result = searchJoin(input, { logger: noOpLogger });

      expect(result).toBeUndefined();
    });

    test("should return undefined if called with an invalid join string", () => {
      input = "invalid";

      result = searchJoin(input, { logger: noOpLogger });

      expect(result).toBeUndefined();
    });

    test("should return undefined if argument is undefined", () => {
      result = searchJoin(undefined, { logger: noOpLogger });

      expect(result).toBeUndefined();
    });
  });

  describe("searchJoin logging", () => {
    test("should log error if argument is not a string", () => {
      input = 123;

      searchJoin(input, { logger });

      expect(error).toHaveBeenCalledExactlyOnceWith(
        "SearchJoin: must be a string, got number instead",
      );
    });

    test("should log error if argument is invalid search join", () => {
      input = "invalid";

      searchJoin(input, { logger });

      expect(error).toHaveBeenCalledExactlyOnceWith(
        `SearchJoin: must be either "${SEARCH_JOIN.AND}" or "${SEARCH_JOIN.OR}", got "invalid" instead`,
      );
    });

    test("should log info if argument is undefined", () => {
      searchJoin(undefined, { logger });

      expect(info).toHaveBeenCalledExactlyOnceWith(
        "SearchJoin: no value given",
      );
    });
  });
});
