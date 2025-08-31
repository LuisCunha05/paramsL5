import {Limit} from "@/limit";

describe("Limit", () => {
  let limit: Limit;

  beforeEach(() => {
    limit = new Limit();
  })

  test("Should set limit to a parameter", () => {
    limit.set(7);

    expect(limit.get()).toBe(7);
  })

  test("Should have a default value", () => {
    expect(limit.get()).toBe(10);
  })

  test("Should ignore non-number arguments", () => {
    limit.set();
    limit.set(undefined);
    //@ts-expect-error
    limit.set(null);
    //@ts-expect-error
    limit.set({});
    //@ts-expect-error
    limit.set([]);

    expect(limit.get()).toBe(10);
  })

  test("Should change limit to a parameter", () => {
    limit.set(7);

    expect(limit.get()).toBe(7);

    limit.set(10);

    expect(limit.get()).toBe(10);
  })

  test("Should ignore negative numbers ", () => {
    limit.set(-10);
    limit.set(3);
    limit.set(-99);

    expect(limit.get()).toBe(3);
  })

  test("Should generate correct params string for default value", () => {

    expect(limit.toParams()).toBe("limit=10");
  })

  test("Should generate correct params string for non-default value", () => {
    limit.set(7);

    expect(limit.toParams()).toBe("limit=7");
  })
})