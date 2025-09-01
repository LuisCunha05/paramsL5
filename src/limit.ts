import { ValueParam } from '@/types'
import { isNumber, typeName } from '@/utils'

export type TLimit = number

export class Limit extends ValueParam<TLimit> {
	private state: TLimit = 10

	constructor(arg?: TLimit) {
		super()
		if (typeof arg !== 'undefined' && !this.isInputValid(arg)) {
			throw new TypeError(
				`Limit must be a positive integer or zero, got ${typeName(arg)} instead`,
			)
		}

		if (arg) this.state = arg
	}

	public get(): TLimit {
		return this.state
	}

	public toParams(): string {
		return `limit=${this.state}`
	}

	public set(arg: number) {
		if (!this.isInputValid(arg)) {
			throw new TypeError(
				`Limit must be a positive integer or zero, got ${typeName(arg)} instead`,
			)
		}
		this.state = arg
	}

	protected isInputValid(arg?: number): arg is number {
		const predicate = (value: number) => {
			return Number.isInteger(value) && value >= 0
		}

		return isNumber(arg, predicate)
	}
}
