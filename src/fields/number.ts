import { Field } from "../field";

class NumberField extends Field<number> {}

/**
 * Create a new number field
 */
export const number = () => {
  return new NumberField();
};
