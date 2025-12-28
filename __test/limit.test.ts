import { limit } from "@/limit";

const warn = jest.spyOn(console, "warn").mockImplementation(() => {});

describe("Limit", () => {
  let result: String | undefined;

  beforeEach(() => {
    result = undefined;
  });

  afterEach(() => {
    warn.mockReset();
  });

  test("Should set limit to a parameter", () => {
    result = limit(7);

    expect(result).toBe("limit=7");
  });

  test("Should have a default value", () => {
    expect(limit()).toBe("limit=10");
  });

  test("Should warn for non-number arguments", () => {
    //@ts-expect-error
    limit(null);
    //@ts-expect-error
    limit({});
    //@ts-expect-error
    limit([]);

    expect(warn).toHaveBeenCalledTimes(3);
  });

  test("Should warm for negative numbers", () => {
    limit(-10);
    expect(warn).toHaveBeenCalled();
  });

  test("Should warn with specific message", () => {
    limit(-10);
    expect(warn).toHaveBeenCalledWith("Limit must be a positive integer or zero, got number instead");
  });
});
