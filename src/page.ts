import { ValueParam } from '@/types'
import { isNumber, typeName } from '@/utils'

export type TPage = number

export class Page extends ValueParam<TPage> {
	private state: TPage = 10

	constructor(arg?: TPage) {
		super()
		if (typeof arg !== 'undefined' && !this.isInputValid(arg)) {
			throw new TypeError(
				`Page must be a positive integer, got ${typeName(arg)} instead`,
			)
		}

		if (arg) this.state = arg
	}

	public get(): TPage {
		return this.state
	}

	public toParams(): string {
		return `page=${this.state}`
	}

	public set(arg: number) {
		if (!this.isInputValid(arg)) {
			throw new TypeError(
				`Page must be a positive integer, got ${typeName(arg)} instead`,
			)
		}
		this.state = arg
	}

	protected isInputValid(arg?: number): arg is number {
		const predicate = (value: number) => {
			return Number.isInteger(value) && value > 0
		}

		return isNumber(arg, predicate)
	}
}
