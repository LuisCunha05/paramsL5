import type {IParams} from './types'


type TSearchJoin = 'and'| 'or'

export class SearchJoin implements IParams<TSearchJoin> {
  private state: TSearchJoin = "and";

  constructor(defaultValue: TSearchJoin = "and") {
    this.state = defaultValue;
  }

  public setState(search: TSearchJoin): void {
    this.state = search;
  }

  public getState(): TSearchJoin {
    return this.state;
  }

  public toParams(): string {
    return `searchJoin=${this.state}`
  }
}