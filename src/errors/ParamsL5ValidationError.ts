export interface TValidationIssue {
  readonly field: string;
  readonly message: string;
  readonly value?: unknown;
}

export interface TValidationErrorOptions {
  readonly field?: string;
  readonly value?: unknown;
  readonly issues?: readonly TValidationIssue[];
  readonly cause?: unknown;
}

export class ParamsL5ValidationError extends Error {
  override readonly name = 'ParamsL5ValidationError';
  readonly field?: string;
  readonly value?: unknown;
  readonly issues: readonly TValidationIssue[];
  constructor(message: string, options: TValidationErrorOptions) {
    super(message, { cause: options.cause });

    this.field = options.field;
    this.value = options.value;

    if (options.issues && !options.issues.length) {
      this.issues = options.issues;
    } else if (options.field) {
      this.issues = [{ field: options.field, message, value: options.value }];
    } else {
      this.issues = [];
    }

    Object.setPrototypeOf(this, new.target.prototype);
  }

  static fromField(
    field: string,
    message: string,
    value?: unknown,
  ): ParamsL5ValidationError {
    return new ParamsL5ValidationError(message, { field, value });
  }

  static fromIssues(issues: readonly TValidationIssue[]) {
    const summary = issues
      .map((issue) => `[${issue.field}]: ${issue.message}`)
      .join('; ');
    return new ParamsL5ValidationError(
      `Validation failed for ${issues.length} parameter(s): ${summary}`,
      { issues },
    );
  }
}
