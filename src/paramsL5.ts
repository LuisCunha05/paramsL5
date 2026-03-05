import { limit } from '@/limit'
import { search } from '@/search'
import { searchCriteria } from '@/searchCriteria'
import { searchJoin } from '@/searchJoin'

export class ParamsL5 {
  private params: string = ''
  private _search = search
  private _criteria = searchCriteria
  private _join = searchJoin
  private _limit = limit

  public toParams(): string {
    this.params = [
      this._join(),
      this._criteria(),
      this._limit(),
      this._search(),
    ].join('&')
    return this.params
  }
}
