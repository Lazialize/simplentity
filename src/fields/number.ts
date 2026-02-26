import { Field } from "../field.ts";

class NumberField extends Field<number> {
  constructor() {
    super();
    this.validators.push({
      rule: "type",
      fn: (v: unknown) => typeof v === "number",
      message: "must be a number",
    });
  }

  min(n: number): this {
    this.validators.push({
      rule: "min",
      fn: (v: unknown) => (v as number) >= n,
      message: `must be at least ${n}`,
    });
    return this;
  }

  max(n: number): this {
    this.validators.push({
      rule: "max",
      fn: (v: unknown) => (v as number) <= n,
      message: `must be at most ${n}`,
    });
    return this;
  }

  integer(): this {
    this.validators.push({
      rule: "integer",
      fn: (v: unknown) => Number.isInteger(v as number),
      message: "must be an integer",
    });
    return this;
  }
}

/**
 * Create a new number field
 */
export const number = () => {
  return new NumberField();
};
