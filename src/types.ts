

export interface IValueParams<T> {
  set(...args: unknown[]): void
  get(): T
  toParams(): string
}

export interface IColletionParams<T> {
  add(...args: unknown[]): void
  get(): T
  toParams(): string
}

export abstract class AValidation {
  protected abstract isInputValid(...arg: unknown[]): boolean
}