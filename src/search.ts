import { type BaseValue, CollectionParam } from '@/types'
import {isBaseValue, isNonEmptyString, typeName} from '@/utils'

export const Condition = [
	'=',
	'like',
	'in',
	'between',
	'ilike',
	'>=',
	'<=',
	'>',
	'<',
	'!=',
] as const

export type TCondition = typeof Condition[number]

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
			if(this.state.has(key)) this.state.get(key)?.delete(condition)
			return
		}

		if (!this.isInputValid(value, condition)) return

		if (!this.state.has(key)) {
			this.state.set(key, new Map<TCondition, BaseValue>())

			this.state.get(key)?.set(condition, value)
			return;
		}

		this.state.get(key)?.set(condition, value)
	}

	public get(): TSearch {
		return this.state
	}

	protected isInputValid(
		value: BaseValue,
		condition: TCondition,
	): boolean {
		return isBaseValue(value) && Condition.includes(condition)
	}

	public toParams(): string {
		const search = Array.from(this.state)
		if(search.length === 0) return ''
		return search.reduce((result, item) =>{
			const valueCondition = Array.from(item[1])
		}, 'search=' )
	}
}
