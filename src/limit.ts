import {IValueParams, AValidation} from '@/types'

export type TLimit = number

export class Limit extends AValidation implements IValueParams<TLimit> {
    private state: TLimit = 10

    constructor(arg?: TLimit) {
        super()
        if(!this.isInputValid(arg))return
        this.state = arg
    }

    public get(): TLimit {
        return this.state
    }

    public toParams(): string {
        return `limit=${this.state}`
    }

    public set(arg?: number) {
        if(!this.isInputValid(arg))return
        this.state = arg
    }

    protected isInputValid(arg?: number): arg is number {
        if(
            typeof arg !== 'number' ||
            Number.isNaN(arg) ||
            !Number.isFinite(arg) ||
            !Number.isInteger(arg)
        )return false

        return arg > 0
    }
}