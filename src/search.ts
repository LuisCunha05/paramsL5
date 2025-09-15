import { type BaseValue, CollectionParam } from '@/types'
import { isBaseValue, isNonEmptyString, typeName } from '@/utils'

export const Condition = [
	'=',
	'>=',
	'<=',
	'>',
	'<',
	'!=',
	'in',
	'like',
	'ilike',
	'between',
] as const

export type TCondition = (typeof Condition)[number]

export type TValueCondition = Map<TCondition, BaseValue>
export type TSearch = Map<string, TValueCondition>

export class Search extends CollectionParam<TSearch> {
	private readonly state: TSearch

	constructor() {
		super()
		this.state = new Map<string, TValueCondition>()
	}
	public add(
		key: string,
		value: BaseValue | undefined,
		condition?: TCondition | undefined,
	): void {
		if (!isNonEmptyString(key)) {
			throw new TypeError(
				`Search key must be of type string, got ${typeName(key)}}) instead.`,
			)
		}
		if (typeof condition === 'undefined') condition = '=' as TCondition
		if (typeof value === 'undefined') {
			if (this.state.has(key)) this.state.get(key)?.delete(condition)
			return
		}

		if (!this.isInputValid(value, condition)) return

		if (!this.state.has(key)) {
			this.state.set(key, new Map<TCondition, BaseValue>())

			this.state.get(key)?.set(condition, value)
			return
		}

		this.state.get(key)?.set(condition, value)
	}

	public get(): TSearch {
		return this.state
	}

	protected isInputValid(value: BaseValue, condition: TCondition): boolean {
		return isBaseValue(value) && Condition.includes(condition)
	}

	public toParams(): string {
		const search = Array.from(this.state)
		if (search.length === 0) return ''
		const searchAndFields = search.reduce(
			(result, [key, valueConditionMap]) => {
				const valueCondition = Array.from(valueConditionMap)

				valueCondition.forEach(([condition, value]) => {
					result.search.push(`${key}:${value}`)
					result.fields.push(`${key}:${condition}`)
				})
				return result
			},
			{ search: [] as string[], fields: [] as string[] },
		)

		return `search:${searchAndFields.search.join(';')}&searchFields=${searchAndFields.fields.join(';')}`
	}
}
