export class ValidationError extends Error {
  field: string;
  value: unknown;
  rule: string;

  constructor(field: string, value: unknown, rule: string, message: string) {
    super(`Validation failed for field "${field}": ${message}`);
    this.name = "ValidationError";
    this.field = field;
    this.value = value;
    this.rule = rule;
  }
}
