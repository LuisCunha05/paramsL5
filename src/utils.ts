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
