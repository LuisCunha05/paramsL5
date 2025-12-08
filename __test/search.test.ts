import { Search } from "@/search"; // Adjust path as needed

describe("Search Class", () => {
  let search: Search;

  beforeEach(() => {
    search = new Search();
  });

  describe("add()", () => {
    it('should add a valid key-value pair with default condition "="', () => {
      search.add("name", "John");

      const state = search.get();
      expect(state.has("name")).toBe(true);
      expect(state.get("name")?.get("=")).toBe("John");
    });

    it("should add a valid key-value pair with a specific condition", () => {
      search.add("age", 18, ">=");

      const state = search.get();
      expect(state.get("age")?.get(">=")).toBe(18);
    });

    it("should allow multiple conditions for the same key", () => {
      search.add("price", 10, ">=");
      search.add("price", 100, "<=");

      const state = search.get();
      const priceConditions = state.get("price");

      expect(priceConditions?.size).toBe(2);
      expect(priceConditions?.get(">=")).toBe(10);
      expect(priceConditions?.get("<=")).toBe(100);
    });

    it("should update the value if the key and condition already exist", () => {
      search.add("name", "John", "like");
      search.add("name", "Doe", "like"); // Update

      const state = search.get();
      expect(state.get("name")?.get("like")).toBe("Doe");
    });

    it("should throw TypeError if key is empty or invalid", () => {
      expect(() => search.add("", "value")).toThrow(TypeError);
      // @ts-ignore - Testing runtime safety
      expect(() => search.add(null, "value")).toThrow(TypeError);
    });

    it("should remove the entry if value is undefined", () => {
      // Setup
      search.add("status", "active", "=");
      expect(search.get().get("status")?.has("=")).toBe(true);

      // Act: Pass undefined to remove
      search.add("status", undefined, "=");

      // Assert
      expect(search.get().get("status")?.has("=")).toBe(false);
    });

    it("should not add to state if input is invalid (isInputValid check)", () => {
      // Assuming object is not a BaseValue based on our mock
      // @ts-ignore - Intentionally passing invalid type
      search.add("meta", { nested: true }, "=");

      expect(search.get().has("meta")).toBe(false);

      // Test invalid condition not in the Condition list
      // @ts-ignore
      search.add("name", "John", "INVALID_CONDITION");
      expect(search.get().has("name")).toBe(false);
    });
  });

  describe("toParams()", () => {
    it("should return an empty string if state is empty", () => {
      expect(search.toParams()).toBe("");
    });

    it("should format a single search param correctly", () => {
      search.add("name", "John", "=");

      // Expected: search:name:John&searchFields=name:=
      const result = search.toParams();
      expect(result).toBe("search:name:John&searchFields=name:=");
    });

    it("should format multiple search params correctly (separated by semicolon)", () => {
      search.add("name", "John", "like");
      search.add("email", "gmail", "ilike");

      const result = search.toParams();

      // Note: Map iteration order is insertion order in JS/TS
      const expectedSearch = "search:name:John;email:gmail";
      const expectedFields = "searchFields=name:like;email:ilike";

      expect(result).toBe(`${expectedSearch}&${expectedFields}`);
    });

    it("should format multiple conditions for a single key correctly", () => {
      search.add("created_at", "2023-01-01", ">=");
      search.add("created_at", "2023-12-31", "<=");

      const result = search.toParams();

      // The result string must contain both parts, checking inclusions to avoid Map order fragility in tests
      expect(result).toContain("created_at:2023-01-01");
      expect(result).toContain("created_at:2023-12-31");
      expect(result).toContain("created_at:>=");
      expect(result).toContain("created_at:<=");

      // Exact structure check
      const parts = result.split("&");
      expect(parts[0]).toBe("search:created_at:2023-01-01;created_at:2023-12-31");
      expect(parts[1]).toBe("searchFields=created_at:>=;created_at:<=");
    });
  });
});
