import { Field } from "../field.ts";

class BooleanField extends Field<boolean> {
  constructor() {
    super();
    this.validators.push({
      rule: "type",
      fn: (v: unknown) => typeof v === "boolean",
      message: "must be a boolean",
    });
  }
}

/**
 * Create a new boolean field
 */
export const boolean = () => {
  return new BooleanField();
};
