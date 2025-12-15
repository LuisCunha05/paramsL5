import { Condition, Search } from "@/search";

describe("Search Class", () => {
  let search: Search;

  beforeEach(() => {
    search = new Search();
  });

  describe("add()", () => {
    test('should add a valid key-value pair with default condition "="', () => {
      search.add("name", "John");

      const state = search.get();
      expect(state.has("name")).toBe(true);
      expect(state.get("name")?.value).toBe("John");
    });

    test("should add a valid key-value pair with a specific condition", () => {
      search.add("age", 18, Condition.GTE);

      const state = search.get();
      expect(state.get("age")?.value).toBe(18);
      expect(state.get("age")?.condition).toBe(Condition.GTE);
    });

    test("should update the value if the key and condition already exist", () => {
      search.add("name", "John", "like");
      search.add("name", "Doe", "like"); // Update

      const state = search.get();
      expect(state.get("name")?.value).toBe("Doe");
    });

    test("should throw TypeError if key is empty or invalid", () => {
      expect(() => search.add("", "value")).toThrow(TypeError);
      // @ts-expect-error - Testing runtime safety
      expect(() => search.add(null, "value")).toThrow(TypeError);
    });

    test("should remove the entry if value is undefined", () => {
      search.add("status", "active", "=");
      expect(!!search.get().get("status")).toBe(true);

      search.add("status", null, "=");

      expect(!!search.get().get("status")).toBe(false);
    });

    test("should not add to state if input value is invalid (isInputValid check)", () => {
      // @ts-expect-error - Intentionally passing invalid type
      search.add("meta", { nested: true }, "=");

      expect(search.get().has("meta")).toBe(false);
    });

    test("should not add to state if input is invalid (isInputValid check)", () => {
      // @ts-expect-error
      search.add("name", "John", "INVALID_CONDITION");
      expect(search.get().has("name")).toBe(false);
    });
  });

  describe("toParams()", () => {
    test("should return an empty string if state is empty", () => {
      expect(search.toParams()).toBe("");
    });

    test("should format a single search param correctly", () => {
      search.add("name", "John", "=");

      // Expected: search:name:John&searchFields=name:=
      const result = search.toParams();
      expect(result).toBe("search:name:John&searchFields=name:=");
    });

    test("should format multiple search params correctly (separated by semicolon)", () => {
      search.add("name", "John", "like");
      search.add("email", "gmail", "ilike");

      const result = search.toParams();

      // Note: Map iteration order is insertion order in JS/TS
      const expectedSearch = "search:name:John;email:gmail";
      const expectedFields = "searchFields=name:like;email:ilike";

      expect(result).toBe(`${expectedSearch}&${expectedFields}`);
    });
  });
});
