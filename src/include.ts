import { CollectionParam } from '@/types'
import { isNonEmptyString, typeName } from '@/utils'

export type TInclude = Set<string>

export class Include extends CollectionParam<TInclude> {
	private readonly state: TInclude

	constructor() {
		super()
		this.state = new Set<string>()
	}

	public add(arg?: string): void {
		if (typeof arg === 'undefined') return
		if (!isNonEmptyString(arg)) {
			throw new TypeError(
				`Argument must be a string, got ${typeName(arg)} instead`,
			)
		}
	}

	public get(): TInclude {
		return this.state
	}

	protected isInputValid(arg: string): boolean {
		if (!isNonEmptyString(arg)) {
			throw new TypeError(
				`Include value must be a string, got ${typeName(arg)} instead`,
			)
		}
		return true
	}

	public toParams(): string {
		return `include=${Array.from(this.state.values()).join(',')}`
	}
}
