import { isNonEmptyString, typeName } from '@/utils'
import { CollectionParam } from './types'

export type TSearchCriteria = Map<string, string>

export class SearchCriteria extends CollectionParam<TSearchCriteria> {
  private readonly state: TSearchCriteria

  constructor() {
    super()
    this.state = new Map<string, string>()
  }

  protected isInputValid(key: string, value: string): boolean {
    if (!isNonEmptyString(value)) return false
    if (!isNonEmptyString(key))
      throw new TypeError(
        `SearchCriteria keys must have a type of string, got ${typeName(key)} instead`,
      )

    return true
  }

  public add(key: string, value?: string): void {
    if (typeof value === 'undefined' || !this.isInputValid(key, value)) return
    this.state.set(key, value)
  }

  public get(): TSearchCriteria {
    return this.state
  }

  public toParams(): string {
    return Array.from(this.state)
      .map(([key, value]) => `${key}=${value}`)
      .join('&')
  }
}
