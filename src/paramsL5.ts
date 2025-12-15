import { Limit } from "@/limit";
import { Search } from "@/search";
import { SearchCriteria } from "@/searchCriteria";
import { SearchJoin } from "@/searchJoin";

export class ParamsL5 {
  private params: string = "";
  private criteria: SearchCriteria;
  private join: SearchJoin;
  private limit: Limit;
  private search: Search;

  constructor() {
    this.criteria = new SearchCriteria();
    this.join = new SearchJoin();
    this.limit = new Limit();
    this.search = new Search();
  }

  public toParams(): string {
    this.params = [this.join.toParams(), this.criteria.toParams(), this.limit.toParams(), this.search.toParams()].join(
      "&",
    );
    return this.params;
  }
}
