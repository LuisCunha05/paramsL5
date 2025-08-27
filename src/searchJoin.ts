import type {IValueParams} from './types'


export type TSearchJoin = 'and'| 'or'

export class SearchJoin implements IValueParams<TSearchJoin> {
  private state: TSearchJoin = "and";

  constructor(defaultValue: TSearchJoin = "and") {
    this.state = defaultValue;
  }

  public set(search: TSearchJoin): void {
    this.state = search;
  }

  public get(): TSearchJoin {
    return this.state;
  }

  public toParams(): string {
    return `searchJoin=${this.state}`
  }
}