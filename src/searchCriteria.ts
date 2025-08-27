import { isNonEmptyString } from '@/utils'
import { AValidation, type IColletionParams } from './types'

export type TSearchCriteria = Map<string, string>

export class SearchCriteria
	extends AValidation
	implements IColletionParams<TSearchCriteria>
{
	private readonly state: TSearchCriteria

	constructor() {
		super()
		this.state = new Map<string, string>()
	}

	protected isInputValid(key: string, value: string): boolean {
		if (!isNonEmptyString(value)) return false
		return !this.state.has(key)
	}

	public add(key: string, value: string): void {
		if (!this.isInputValid(key, value)) return
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
