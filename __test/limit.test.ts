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

  test("Should error for non-number arguments", () => {

    expect(() => {
      //@ts-expect-error
      limit.set();
    }).toThrow(`Limit must be a positive integer or zero, got undefined instead`)

    expect(() => {
      //@ts-expect-error
      limit.set(null);
    }).toThrow(`Limit must be a positive integer or zero, got null instead`)

    expect(() => {
      //@ts-expect-error
      limit.set({});
    }).toThrow(`Limit must be a positive integer or zero, got object instead`)

    expect(() => {
      //@ts-expect-error
      limit.set([]);
    }).toThrow(`Limit must be a positive integer or zero, got Array instead`)
  })

  test("Should change limit to a parameter", () => {
    limit.set(7);

    expect(limit.get()).toBe(7);

    limit.set(10);

    expect(limit.get()).toBe(10);
  })

  test("Should error for negative numbers", () => {
    expect(() => limit.set(-10)).toThrow('Limit must be a positive integer or zero, got number instead')
  })

  test("Should generate correct params string for default value", () => {

    expect(limit.toParams()).toBe("limit=10");
  })

  test("Should generate correct params string for non-default value", () => {
    limit.set(7);

    expect(limit.toParams()).toBe("limit=7");
  })
})