import { Field } from "../field";

class BooleanField extends Field<boolean> {}

/**
 * Create a new boolean field
 */
export const boolean = () => {
  return new BooleanField();
};
