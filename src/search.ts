import { type BaseValue, CollectionParam } from '@/types'
import { isNonEmptyString, typeName } from '@/utils'

export type TCondition =
	| '='
	| 'like'
	| 'in'
	| 'between'
	| 'ilike'
	| '>='
	| '<='
	| '>'
	| '<'
	| '!='

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
		if (typeof value === 'undefined') return
		if (typeof condition === 'undefined') condition = '=' as TCondition

		if (!this.isInputValid(key, value, condition)) return

		if (!this.state.has(key)) {
			this.state.set(key, new Map<TCondition, BaseValue>())

			this.state.get(key)?.set(condition, value)
		}

		if (this.state.get(key)?.has(condition)) {
			throw new Error("Search key can't have duplicate condition")
		}

		this.state.get(key)?.set(condition, value)
	}

	public get(): TSearch {
		return this.state
	}

	protected isInputValid(
		key: string,
		value: BaseValue,
		condition?: TCondition,
	): boolean {
		return false
	}

	public toParams(): string {
		return 'search='
	}
}
