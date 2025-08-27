import {SearchCriteria} from "@/searchCriteria";

describe("SearchCriteria", () => {
  let searchCriteria: SearchCriteria;

  beforeEach(() => {
    searchCriteria = new SearchCriteria();
  })

  test("Should add a non-existing parameter", () => {

    searchCriteria.add("key", "value");

    expect(searchCriteria.get().has("key")).toBe(true);
  })

  test("Shouldn't add an existing parameter", () => {

    searchCriteria.add("key", "value1");
    searchCriteria.add("key", "value2");

    expect(searchCriteria.get().get("key")).toBe("value1");
  })

  test("Shouldn't add an undefined value", () => {

    //@ts-expect-error
    searchCriteria.add("key");

    expect(searchCriteria.get().has("key")).toBe(false);
  })

  test("Should generate empty string params with empty state", () => {

    expect(searchCriteria.toParams()).toBe("");
  })

  test("Should generate string params with single key-value", () => {

    searchCriteria.add("key", "value");

    expect(searchCriteria.toParams()).toBe("key=value");
  })

  test("Should generate string params with multiple key-values", () => {

    searchCriteria.add("key1", "value1");
    searchCriteria.add("key2", "value2");
    searchCriteria.add("key3", "value3");

    expect(searchCriteria.toParams()).toBe("key1=value1&key2=value2&key3=value3");
  })
})