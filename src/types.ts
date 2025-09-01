export abstract class BaseParam<T> {
	protected abstract isInputValid(...arg: unknown[]): boolean
	public abstract get(): T
	public abstract toParams(): string
}

export abstract class CollectionParam<T> extends BaseParam<T> {
	public abstract add(...args: unknown[]): void
}

export abstract class ValueParam<T> extends BaseParam<T> {
	public abstract set(...args: unknown[]): void
}
