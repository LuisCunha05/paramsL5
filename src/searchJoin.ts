import { isNonEmptyString } from '@/utils'
import { ValueParam } from './types'

export type TSearchJoin = 'and' | 'or'

export class SearchJoin extends ValueParam<TSearchJoin> {
  private state: TSearchJoin = 'and'

  constructor(defaultValue?: TSearchJoin) {
    super()
    if (defaultValue && this.isInputValid(defaultValue))
      this.state = defaultValue
  }

  public set(search: TSearchJoin): void {
    if (this.isInputValid(search)) this.state = search
  }

  public get(): TSearchJoin {
    return this.state
  }

  public toParams(): string {
    return `searchJoin=${this.state}`
  }

  protected isInputValid(arg: string): boolean {
    if (!isNonEmptyString(arg)) {
      throw new TypeError('SearchJoin must be an string')
    }
    if (!(arg === 'and' || arg === 'or')) {
      throw new Error('SearchJoin must be either "and" or "or"')
    }
    return true
  }
}
