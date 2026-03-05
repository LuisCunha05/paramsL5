import { type BaseValue, CollectionParam } from '@/types'
import { isBaseValue, isNonEmptyString, typeName } from '@/utils'

export const Condition = Object.freeze({
  EQ: '=',
  GTE: '>=',
  LTE: '<=',
  GT: '>',
  LT: '<',
  DIFF: '!=',
  IN: 'in',
  LIKE: 'like',
  ILIKE: 'ilike',
  BTW: 'between',
} as const)

export type TCondition = (typeof Condition)[keyof typeof Condition]

export type TValueCondition = { value: BaseValue | null; condition: TCondition }
export type TSearch = Map<string, TValueCondition>

export class Search extends CollectionParam<TSearch> {
  private readonly state: TSearch

  constructor() {
    super()
    this.state = new Map<string, TValueCondition>()
  }
  public add(
    key: string,
    value: BaseValue | null,
    condition?: TCondition | undefined,
  ): void {
    if (!isNonEmptyString(key)) {
      throw new TypeError(
        `Search key must be of type string, got ${typeName(key)}}) instead.`,
      )
    }

    if (typeof condition === 'undefined') condition = Condition.EQ

    if (value === null) {
      if (this.state.has(key)) this.state.delete(key)
      return
    }

    if (!this.isInputValid(value, condition)) return

    this.state.set(key, { value: value, condition })
  }

  public get(): TSearch {
    return this.state
  }

  protected isInputValid(value: BaseValue, condition: TCondition): boolean {
    return isBaseValue(value) && Object.values(Condition).includes(condition)
  }

  public toParams(): string {
    const search = Array.from(this.state)
    if (search.length === 0) return ''
    const searchAndFields = search.reduce(
      (result, [key, valueCondition]) => {
        const { value, condition } = valueCondition

        if (!value) return result

        const newValue = typeof value === 'string' ? value.trim() : value

        result.search.push(`${key}:${newValue}`)
        result.fields.push(`${key}:${condition}`)

        return result
      },
      { search: [] as string[], fields: [] as string[] },
    )

    return `search:${searchAndFields.search.join(';')}&searchFields=${searchAndFields.fields.join(';')}`
  }
}
