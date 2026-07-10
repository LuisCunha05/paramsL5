import type { BaseValue } from "@/types";

export function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export function isNumber(
  arg: unknown,
  predicate?: (value: number) => boolean,
): arg is number {
  if (typeof arg !== "number" || Number.isNaN(arg) || !Number.isFinite(arg))
    return false;

  return predicate ? predicate(arg) : true;
}

export function isBaseValue(arg: unknown): arg is BaseValue {
  return !(
    typeof arg !== "boolean" &&
    !isNumber(arg) &&
    !isNonEmptyString(arg)
  );
}

export function typeName(arg?: unknown): string {
  if (Array.isArray(arg)) return "Array";
  if (arg === null) return "null";
  if (Number.isNaN(arg)) return "NaN";
  return typeof arg;
}

/**
 * Docs [#link](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/encodeURIComponent#description)
 */
export function encodeSearchParam(str: string) {
  return encodeURIComponent(str)
    .replace(
      /[!'()*]/g,
      (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`,
    )
    .replace(/%20/g, "+");
}

export function decodeSearchParam(str: string) {
  try {
    return decodeURIComponent(str.replace(/\+/g, "%20"));
  } catch (e: unknown) {
    console.error(
      `    [ParamsL5]: Malformed URL. ${e instanceof URIError ? e.message : e}`,
    );
    return str.replace(/\+/g, " ");
  }
}
