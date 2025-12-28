import { limit } from "@/limit";
import { Search } from "@/search";
import { SearchCriteria } from "@/searchCriteria";
import { SearchJoin } from "@/searchJoin";

export class ParamsL5 {
  private params: string = "";
  private criteria: SearchCriteria;
  private join: SearchJoin;
  private search: Search;
  private _limit = limit;

  constructor() {
    this.criteria = new SearchCriteria();
    this.join = new SearchJoin();
    this.search = new Search();
  }

  public toParams(): string {
    this.params = [this.join.toParams(), this.criteria.toParams(), this._limit(), this.search.toParams()].join("&");
    return this.params;
  }
}
