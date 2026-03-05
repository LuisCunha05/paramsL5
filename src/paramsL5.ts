import { limit } from '@/limit'
import { Search } from '@/search'
import { searchCriteria } from '@/searchCriteria'
import { searchJoin } from '@/searchJoin'

export class ParamsL5 {
  private params: string = ''
  private search: Search
  private _criteria = searchCriteria
  private _join = searchJoin
  private _limit = limit

  constructor() {
    this.search = new Search()
  }

  public toParams(): string {
    this.params = [
      this._join(),
      this._criteria(),
      this._limit(),
      this.search.toParams(),
    ].join('&')
    return this.params
  }
}
