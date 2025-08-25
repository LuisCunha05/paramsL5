

export interface IParams<T> {
  setState(args: unknown): void
  getState(): T
  toParams(): string
}

export interface IParamsWithValidation<T> extends IParams<T> {
  validate(arg: unknown): T
}