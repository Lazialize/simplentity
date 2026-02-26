import { Field } from "../field.ts";

class StringField extends Field<string> {
  constructor() {
    super();
    this.validators.push({
      rule: "type",
      fn: (v: unknown) => typeof v === "string",
      message: "must be a string",
    });
  }

  minLength(n: number): this {
    this.validators.push({
      rule: "minLength",
      fn: (v: unknown) => (v as string).length >= n,
      message: `must be at least ${n} characters`,
    });
    return this;
  }

  maxLength(n: number): this {
    this.validators.push({
      rule: "maxLength",
      fn: (v: unknown) => (v as string).length <= n,
      message: `must be at most ${n} characters`,
    });
    return this;
  }

  pattern(regex: RegExp): this {
    this.validators.push({
      rule: "pattern",
      fn: (v: unknown) => regex.test(v as string),
      message: `must match pattern ${regex}`,
    });
    return this;
  }
}

/**
 * Create a new string field
 */
export const string = () => {
  return new StringField();
};
