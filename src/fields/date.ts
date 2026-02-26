import { Field } from "../field.ts";

class DateField extends Field<Date> {
  constructor() {
    super();
    this.validators.push({
      rule: "type",
      fn: (v: unknown) => v instanceof Date,
      message: "must be a Date",
    });
  }

  after(boundary: Date): this {
    this.validators.push({
      rule: "after",
      fn: (v: unknown) => (v as Date).getTime() > boundary.getTime(),
      message: `must be after ${boundary.toISOString()}`,
    });
    return this;
  }

  before(boundary: Date): this {
    this.validators.push({
      rule: "before",
      fn: (v: unknown) => (v as Date).getTime() < boundary.getTime(),
      message: `must be before ${boundary.toISOString()}`,
    });
    return this;
  }
}

/**
 * Create a new date field
 */
export const date = () => {
  return new DateField();
};
