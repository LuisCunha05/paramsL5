export function isNonEmptyString(value: unknown): value is string {
	return typeof value === 'string' && value.trim().length > 0
}

export function isNumber(
	arg: unknown,
	predicate?: (value: number) => boolean,
): arg is number {
	if (typeof arg !== 'number' || Number.isNaN(arg) || !Number.isFinite(arg))
		return false

	return predicate ? predicate(arg) : true
}

export function typeName(arg?: unknown): string {
	if (Array.isArray(arg)) return 'Array'
	if (arg === null) return 'null'
	if (Number.isNaN(arg)) return 'NaN'
	return typeof arg
}
